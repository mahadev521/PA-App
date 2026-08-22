import { useState, useEffect, useCallback } from 'react'
import { getAllEntries, saveEntry, getProfile, saveProfile, getAllExperiences, saveExperience, deleteExperience, getAllTasks, saveTask, deleteTask } from '../utils/storage'
import {
  calculateDayXP,
  getLevelInfo,
  computeStreaks,
  evaluateBadges,
  todayStr,
} from '../utils/gamification'

export function useApp() {
  const [entries, setEntries] = useState([])
  const [experiences, setExperiences] = useState([])
  const [tasks, setTasks] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayEntry, setTodayEntry] = useState(null)

  const reload = useCallback(async () => {
    const [all, prof, exps, tsks] = await Promise.all([getAllEntries(), getProfile(), getAllExperiences(), getAllTasks()])
    setEntries(all)
    setProfile(prof)
    setExperiences(exps)
    setTasks(tsks)
    const today = all.find(e => e.date === todayStr()) || null
    setTodayEntry(today)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const logEntry = useCallback(async (data) => {
    const date = data.date || todayStr()
    await saveEntry({ ...data, date })
    await reload()
  }, [reload])

  const updateProfile = useCallback(async (data) => {
    await saveProfile(data)
    const updated = await getProfile()
    setProfile(updated)
  }, [])

  const addTask = useCallback(async (title, severity, priority) => {
    await saveTask({ title, severity, priority, completed: false, completed_at: null })
    const tsks = await getAllTasks()
    setTasks(tsks)
  }, [])

  const toggleTask = useCallback(async (id) => {
    const all = await getAllTasks()
    const task = all.find(t => t.id === id)
    if (!task) return
    await saveTask({ ...task, completed: !task.completed, completed_at: !task.completed ? Date.now() : null })
    setTasks(await getAllTasks())
  }, [])

  const removeTask = useCallback(async (id) => {
    await deleteTask(id)
    setTasks(await getAllTasks())
  }, [])

  const addExperience = useCallback(async (exp) => {
    await saveExperience(exp)
    await reload()
  }, [reload])

  const removeExperience = useCallback(async (id) => {
    await deleteExperience(id)
    await reload()
  }, [reload])

  // Derived gamification data
  const totalXP = entries.reduce((s, e) => s + calculateDayXP(e), 0)
  const levelInfo = getLevelInfo(totalXP)
  const streaks = computeStreaks(entries)
  const earnedBadges = evaluateBadges(entries)
  const todayXP = todayEntry ? calculateDayXP(todayEntry) : 0

  const logStreak = streaks.find(s => s.key === 'logging')?.current || 0

  return {
    entries, experiences, tasks, profile, loading, todayEntry,
    totalXP, levelInfo, streaks, earnedBadges, todayXP, logStreak,
    logEntry, updateProfile, addExperience, removeExperience,
    addTask, toggleTask, removeTask,
    reload,
  }
}
