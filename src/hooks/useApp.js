import { useState, useEffect, useCallback } from 'react'
import { getAllEntries, saveEntry, getProfile, saveProfile, getAllExperiences, saveExperience, deleteExperience, getAllTasks, saveTask, deleteTask, getAllGoTasks, saveGoTask, deleteGoTask, getAllBacklog, saveBacklogItem, deleteBacklogItem, getAllErrandRuns, saveErrandRun, deleteErrandRun, getAllUtilityItems, saveUtilityItem, deleteUtilityItem } from '../utils/storage'
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
  const [goTasks, setGoTasks] = useState([])
  const [backlog, setBacklog] = useState([])
  const [errandRuns, setErrandRuns] = useState([])
  const [utilityItems, setUtilityItems] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayEntry, setTodayEntry] = useState(null)

  const reload = useCallback(async () => {
    const [all, prof, exps, tsks, gts, bl, er, ui] = await Promise.all([
      getAllEntries(), getProfile(), getAllExperiences(), getAllTasks(),
      getAllGoTasks(), getAllBacklog(), getAllErrandRuns(), getAllUtilityItems(),
    ])
    setEntries(all)
    setProfile(prof)
    setExperiences(exps)
    setTasks(tsks)
    setGoTasks(gts)
    setBacklog(bl)
    setErrandRuns(er)
    setUtilityItems(ui)
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

  const addGoTask = useCallback(async (title, priority) => {
    const now = Date.now()
    await saveGoTask({ title, priority, completed: false, comment: '', order: now })
    setGoTasks(await getAllGoTasks())
  }, [])

  const toggleGoTask = useCallback(async (id) => {
    const all = await getAllGoTasks()
    const task = all.find(t => t.id === id)
    if (!task) return
    await saveGoTask({ ...task, completed: !task.completed })
    setGoTasks(await getAllGoTasks())
  }, [])

  const removeGoTask = useCallback(async (id) => {
    await deleteGoTask(id)
    setGoTasks(await getAllGoTasks())
  }, [])

  const updateGoTaskComment = useCallback(async (id, comment) => {
    const all = await getAllGoTasks()
    const task = all.find(t => t.id === id)
    if (!task) return
    await saveGoTask({ ...task, comment })
    setGoTasks(await getAllGoTasks())
  }, [])

  const reorderGoTask = useCallback(async (id, direction) => {
    const all = await getAllGoTasks()
    const sorted = [...all].sort((a, b) => (a.order ?? a.created_at) - (b.order ?? b.created_at))
    const idx = sorted.findIndex(t => t.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const tempOrder = sorted[idx].order ?? sorted[idx].created_at
    await saveGoTask({ ...sorted[idx], order: sorted[swapIdx].order ?? sorted[swapIdx].created_at })
    await saveGoTask({ ...sorted[swapIdx], order: tempOrder })
    setGoTasks(await getAllGoTasks())
  }, [])

  const addBacklogItem = useCallback(async (title, tag, status = 'backlog', extra = {}) => {
    await saveBacklogItem({ title, tag, done: false, status, ...extra })
    setBacklog(await getAllBacklog())
  }, [])

  const toggleBacklogItem = useCallback(async (id) => {
    const all = await getAllBacklog()
    const item = all.find(i => i.id === id)
    if (!item) return
    await saveBacklogItem({ ...item, done: !item.done })
    setBacklog(await getAllBacklog())
  }, [])

  const removeBacklogItem = useCallback(async (id) => {
    await deleteBacklogItem(id)
    setBacklog(await getAllBacklog())
  }, [])

  const updateBacklogStatus = useCallback(async (id, status) => {
    const all = await getAllBacklog()
    const item = all.find(i => i.id === id)
    if (!item) return
    await saveBacklogItem({ ...item, status, done: status === 'done' })
    setBacklog(await getAllBacklog())
  }, [])

  const upsertErrandRun = useCallback(async (run) => {
    await saveErrandRun(run)
    setErrandRuns(await getAllErrandRuns())
  }, [])

  const removeErrandRun = useCallback(async (id) => {
    await deleteErrandRun(id)
    setErrandRuns(await getAllErrandRuns())
  }, [])

  const addUtilityItem = useCallback(async (type, title, category, meta = {}) => {
    await saveUtilityItem({ type, title, category, meta, done: false })
    setUtilityItems(await getAllUtilityItems())
  }, [])

  const toggleUtilityItem = useCallback(async (id) => {
    const all = await getAllUtilityItems()
    const item = all.find(i => i.id === id)
    if (!item) return
    await saveUtilityItem({ ...item, done: !item.done })
    setUtilityItems(await getAllUtilityItems())
  }, [])

  const removeUtilityItem = useCallback(async (id) => {
    await deleteUtilityItem(id)
    setUtilityItems(await getAllUtilityItems())
  }, [])

  // Derived gamification data
  const totalXP = entries.reduce((s, e) => s + calculateDayXP(e), 0)
  const levelInfo = getLevelInfo(totalXP)
  const streaks = computeStreaks(entries)
  const earnedBadges = evaluateBadges(entries)
  const todayXP = todayEntry ? calculateDayXP(todayEntry) : 0

  const logStreak = streaks.find(s => s.key === 'logging')?.current || 0

  return {
    entries, experiences, tasks, goTasks, backlog, errandRuns, utilityItems, profile, loading, todayEntry,
    totalXP, levelInfo, streaks, earnedBadges, todayXP, logStreak,
    logEntry, updateProfile, addExperience, removeExperience,
    addTask, toggleTask, removeTask,
    addGoTask, toggleGoTask, removeGoTask, updateGoTaskComment, reorderGoTask,
    addBacklogItem, toggleBacklogItem, removeBacklogItem, updateBacklogStatus,
    upsertErrandRun, removeErrandRun,
    addUtilityItem, toggleUtilityItem, removeUtilityItem,
    reload,
  }
}
