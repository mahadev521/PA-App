import { useState, useEffect, useCallback } from 'react'
import { getAllEntries, saveEntry, getProfile, saveProfile, getAllExperiences, saveExperience, deleteExperience, getAllTasks, saveTask, deleteTask, getAllGoTasks, saveGoTask, deleteGoTask, getAllBacklog, saveBacklogItem, deleteBacklogItem, getAllErrandRuns, saveErrandRun, deleteErrandRun, getAllUtilityItems, saveUtilityItem, deleteUtilityItem, getAllChecklists, saveChecklist, deleteChecklist, getAllInvestments, saveInvestment, deleteInvestment, getAllGoals, saveGoal, deleteGoal, getAllPeople, savePerson, deletePerson } from '../utils/storage'
import {
  calculateDayXP,
  getLevelInfo,
  computeStreaks,
  evaluateBadges,
  todayStr,
} from '../utils/gamification'
import { getPermission, requestPermission, fireDueReminders } from '../utils/notifications'

export function useApp() {
  const [entries, setEntries] = useState([])
  const [experiences, setExperiences] = useState([])
  const [tasks, setTasks] = useState([])
  const [goTasks, setGoTasks] = useState([])
  const [backlog, setBacklog] = useState([])
  const [errandRuns, setErrandRuns] = useState([])
  const [utilityItems, setUtilityItems] = useState([])
  const [checklists, setChecklists] = useState([])
  const [investments, setInvestments] = useState([])
  const [goals, setGoals] = useState([])
  const [people, setPeople] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayEntry, setTodayEntry] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState(getPermission())

  const reload = useCallback(async () => {
    const [all, prof, exps, tsks, gts, bl, er, ui, cls, inv, gls, ppl] = await Promise.all([
      getAllEntries(), getProfile(), getAllExperiences(), getAllTasks(),
      getAllGoTasks(), getAllBacklog(), getAllErrandRuns(), getAllUtilityItems(),
      getAllChecklists(), getAllInvestments(), getAllGoals(), getAllPeople(),
    ])
    setEntries(all)
    setProfile(prof)
    setExperiences(exps)
    setTasks(tsks)
    setGoTasks(gts)
    setBacklog(bl)
    setErrandRuns(er)
    setUtilityItems(ui)
    setChecklists(cls)
    setInvestments(inv)
    setGoals(gls)
    setPeople(ppl)
    const today = all.find(e => e.date === todayStr()) || null
    setTodayEntry(today)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  // In-app reminder check: fires an OS notification for any due item, then
  // marks it fired so it doesn't repeat. Runs on load, whenever the watched
  // lists change, and every 60s while the app stays open.
  useEffect(() => {
    async function checkReminders() {
      const candidates = [
        ...backlog.map(i => ({ id: i.id, title: i.title, remind_at: i.remind_at, remind_fired: i.remind_fired, _src: 'backlog' })),
        ...utilityItems.map(i => ({ id: i.id, title: i.title, remind_at: i.meta?.remind_at, remind_fired: i.meta?.remind_fired, _src: 'utility' })),
      ]
      const firedIds = fireDueReminders(candidates)
      if (!firedIds.length) return
      for (const id of firedIds) {
        const item = candidates.find(c => c.id === id)
        if (item._src === 'backlog') {
          const full = backlog.find(i => i.id === id)
          if (full) await saveBacklogItem({ ...full, remind_fired: true })
        } else {
          const full = utilityItems.find(i => i.id === id)
          if (full) await saveUtilityItem({ ...full, meta: { ...full.meta, remind_fired: true } })
        }
      }
      setBacklog(await getAllBacklog())
      setUtilityItems(await getAllUtilityItems())
    }
    checkReminders()
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [backlog, utilityItems])

  const requestNotificationPermission = useCallback(async () => {
    const perm = await requestPermission()
    setNotificationPermission(perm)
    return perm
  }, [])

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

  const setBacklogReminder = useCallback(async (id, remind_at) => {
    const all = await getAllBacklog()
    const item = all.find(i => i.id === id)
    if (!item) return
    await saveBacklogItem({ ...item, remind_at, remind_fired: false })
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

  const setUtilityItemReminder = useCallback(async (id, remind_at) => {
    const all = await getAllUtilityItems()
    const item = all.find(i => i.id === id)
    if (!item) return
    await saveUtilityItem({ ...item, meta: { ...item.meta, remind_at, remind_fired: false } })
    setUtilityItems(await getAllUtilityItems())
  }, [])

  const upsertChecklist = useCallback(async (checklist) => {
    await saveChecklist(checklist)
    setChecklists(await getAllChecklists())
  }, [])

  const removeChecklist = useCallback(async (id) => {
    await deleteChecklist(id)
    setChecklists(await getAllChecklists())
  }, [])

  const upsertInvestment = useCallback(async (investment) => {
    await saveInvestment(investment)
    setInvestments(await getAllInvestments())
  }, [])

  const removeInvestment = useCallback(async (id) => {
    await deleteInvestment(id)
    setInvestments(await getAllInvestments())
  }, [])

  const upsertGoal = useCallback(async (goal) => {
    await saveGoal(goal)
    setGoals(await getAllGoals())
  }, [])

  const removeGoal = useCallback(async (id) => {
    await deleteGoal(id)
    setGoals(await getAllGoals())
  }, [])

  const toggleMilestone = useCallback(async (goalId, milestoneId) => {
    const all = await getAllGoals()
    const goal = all.find(g => g.id === goalId)
    if (!goal) return
    const milestones = goal.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m)
    await saveGoal({ ...goal, milestones })
    setGoals(await getAllGoals())
  }, [])

  const upsertPerson = useCallback(async (person) => {
    await savePerson(person)
    setPeople(await getAllPeople())
  }, [])

  const removePerson = useCallback(async (id) => {
    await deletePerson(id)
    setPeople(await getAllPeople())
  }, [])

  // Derived gamification data
  const totalXP = entries.reduce((s, e) => s + calculateDayXP(e), 0)
  const levelInfo = getLevelInfo(totalXP)
  const streaks = computeStreaks(entries)
  const earnedBadges = evaluateBadges(entries)
  const todayXP = todayEntry ? calculateDayXP(todayEntry) : 0

  const logStreak = streaks.find(s => s.key === 'logging')?.current || 0

  return {
    entries, experiences, tasks, goTasks, backlog, errandRuns, utilityItems, checklists, investments, goals, people, profile, loading, todayEntry,
    totalXP, levelInfo, streaks, earnedBadges, todayXP, logStreak,
    notificationPermission, requestNotificationPermission,
    logEntry, updateProfile, addExperience, removeExperience,
    addTask, toggleTask, removeTask,
    addGoTask, toggleGoTask, removeGoTask, updateGoTaskComment, reorderGoTask,
    addBacklogItem, toggleBacklogItem, removeBacklogItem, updateBacklogStatus, setBacklogReminder,
    upsertErrandRun, removeErrandRun,
    addUtilityItem, toggleUtilityItem, removeUtilityItem, setUtilityItemReminder,
    upsertChecklist, removeChecklist,
    upsertInvestment, removeInvestment,
    upsertGoal, removeGoal, toggleMilestone,
    upsertPerson, removePerson,
    reload,
  }
}
