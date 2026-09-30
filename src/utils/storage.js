import { openDB } from 'idb'
import { encryptJSON, decryptJSON } from './crypto'

const DB_NAME = 'jarvis-pa'
const DB_VERSION = 8
const STORE = 'entries'
const PROFILE_STORE = 'profile'
const EXP_STORE = 'experiences'
const TASKS_STORE = 'tasks'
const GO_TASKS_STORE = 'go_tasks'
const BACKLOG_STORE = 'backlog'
const ERRAND_STORE = 'errand_runs'
const UTILITY_STORE = 'utility_items'
const CHECKLIST_STORE = 'checklists'
const INVESTMENT_STORE = 'investments'
const GOALS_STORE = 'goals'
const PEOPLE_STORE = 'people'

// Registry of every store included in export/import backups — add new stores
// here so a future addition doesn't silently get left out of backups again.
const EXPORTABLE_STORES = {
  entries: STORE,
  experiences: EXP_STORE,
  tasks: TASKS_STORE,
  go_tasks: GO_TASKS_STORE,
  backlog: BACKLOG_STORE,
  errand_runs: ERRAND_STORE,
  utility_items: UTILITY_STORE,
  checklists: CHECKLIST_STORE,
  investments: INVESTMENT_STORE,
  goals: GOALS_STORE,
  people: PEOPLE_STORE,
}

// One connection per page, reused by every read and write.
//
// This used to call openDB() on every single operation and never close anything,
// so a page accumulated dozens of live connections. Those connections hold the
// database open, which means the next release that bumps DB_VERSION to add a
// store would find its upgrade blocked — and because nothing handled `blocked`,
// the open never settled and the app hung on the loading screen forever.
let dbPromise = null

function getDB() {
  if (dbPromise) return dbPromise

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    // Another tab (or a newly deployed version) wants to upgrade the schema.
    // Let go of our connection so its upgrade can run instead of both sides
    // waiting on each other.
    blocking() {
      const current = dbPromise
      dbPromise = null
      current?.then(db => db.close()).catch(() => {})
    },
    // Our own open is blocked by a connection we don't control (another tab on
    // the old version). Surface it rather than hanging silently.
    blocked() {
      console.warn('[storage] Database upgrade is blocked by another open tab. Close other tabs and reload.')
    },
    // Connection died (tab discarded, storage evicted) — drop the cache so the
    // next call reconnects instead of reusing a dead handle.
    terminated() {
      dbPromise = null
    },
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'date' })
        store.createIndex('date', 'date')
      }
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(EXP_STORE)) {
        const expStore = db.createObjectStore(EXP_STORE, { keyPath: 'id' })
        expStore.createIndex('date', 'date')
        expStore.createIndex('category', 'category')
      }
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        db.createObjectStore(TASKS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(GO_TASKS_STORE)) {
        db.createObjectStore(GO_TASKS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(BACKLOG_STORE)) {
        db.createObjectStore(BACKLOG_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(ERRAND_STORE)) {
        db.createObjectStore(ERRAND_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(UTILITY_STORE)) {
        const us = db.createObjectStore(UTILITY_STORE, { keyPath: 'id' })
        us.createIndex('type', 'type')
      }
      if (!db.objectStoreNames.contains(CHECKLIST_STORE)) {
        db.createObjectStore(CHECKLIST_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(INVESTMENT_STORE)) {
        const invStore = db.createObjectStore(INVESTMENT_STORE, { keyPath: 'id' })
        invStore.createIndex('category', 'category')
      }
      if (!db.objectStoreNames.contains(GOALS_STORE)) {
        db.createObjectStore(GOALS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PEOPLE_STORE)) {
        db.createObjectStore(PEOPLE_STORE, { keyPath: 'id' })
      }
    },
  }).catch(err => {
    // Never cache a rejected promise, or the app is permanently broken until reload.
    dbPromise = null
    throw err
  })

  return dbPromise
}

export async function saveEntry(entry) {
  const db = await getDB()
  const now = Date.now()
  return db.put(STORE, { ...entry, updated_at: now })
}

export async function getEntry(date) {
  const db = await getDB()
  return db.get(STORE, date)
}

export async function getAllEntries() {
  const db = await getDB()
  return db.getAll(STORE)
}

export async function deleteEntry(date) {
  const db = await getDB()
  return db.delete(STORE, date)
}

export async function getProfile() {
  const db = await getDB()
  const profile = await db.get(PROFILE_STORE, 'main')
  return profile || { id: 'main', name: 'You', created_at: Date.now() }
}

export async function saveProfile(data) {
  const db = await getDB()
  const existing = await getProfile()
  return db.put(PROFILE_STORE, { ...existing, ...data })
}

export async function saveExperience(exp) {
  const db = await getDB()
  const entry = { ...exp, id: exp.id || `exp_${Date.now()}`, created_at: exp.created_at || Date.now() }
  return db.put(EXP_STORE, entry)
}

export async function getAllExperiences() {
  const db = await getDB()
  return db.getAll(EXP_STORE)
}

export async function deleteExperience(id) {
  const db = await getDB()
  return db.delete(EXP_STORE, id)
}

export async function exportData(passphrase) {
  if (!passphrase) throw new Error('A passphrase is required to export a backup.')

  const db = await getDB()
  const profile = await getProfile()
  const storeData = await Promise.all(
    Object.values(EXPORTABLE_STORES).map(storeName => db.getAll(storeName))
  )
  const data = { profile }
  Object.keys(EXPORTABLE_STORES).forEach((key, i) => { data[key] = storeData[i] })

  const envelope = await encryptJSON(data, passphrase)
  const blob = new Blob([JSON.stringify(envelope)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jarvis-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)

  // Stamped so the app can tell you how exposed you are (see commandCenter).
  await saveProfile({ last_backup_at: Date.now() })
}

export async function importData(jsonString, passphrase) {
  const parsed = JSON.parse(jsonString)
  const data = parsed.__encrypted ? await decryptJSON(parsed, passphrase) : parsed

  const db = await getDB()
  if (data.profile) {
    await saveProfile(data.profile)
  }
  for (const [key, storeName] of Object.entries(EXPORTABLE_STORES)) {
    const items = data[key]
    if (items?.length) {
      const tx = db.transaction(storeName, 'readwrite')
      await Promise.all(items.map(item => tx.store.put(item)))
      await tx.done
    }
  }
}

export async function clearAllEntries() {
  const db = await getDB()
  return db.clear(STORE)
}

export async function getAllTasks() {
  const db = await getDB()
  return db.getAll(TASKS_STORE)
}

export async function saveTask(task) {
  const db = await getDB()
  return db.put(TASKS_STORE, { ...task, id: task.id || `task_${Date.now()}`, created_at: task.created_at || Date.now() })
}

export async function deleteTask(id) {
  const db = await getDB()
  return db.delete(TASKS_STORE, id)
}

export async function getAllGoTasks() {
  const db = await getDB()
  return db.getAll(GO_TASKS_STORE)
}

export async function saveGoTask(task) {
  const db = await getDB()
  const now = Date.now()
  return db.put(GO_TASKS_STORE, { ...task, id: task.id || `gt_${now}`, created_at: task.created_at || now, order: task.order ?? task.created_at ?? now })
}

export async function deleteGoTask(id) {
  const db = await getDB()
  return db.delete(GO_TASKS_STORE, id)
}

export async function getAllBacklog() {
  const db = await getDB()
  return db.getAll(BACKLOG_STORE)
}

export async function saveBacklogItem(item) {
  const db = await getDB()
  const now = Date.now()
  return db.put(BACKLOG_STORE, { ...item, id: item.id || `bl_${now}`, created_at: item.created_at || now })
}

export async function deleteBacklogItem(id) {
  const db = await getDB()
  return db.delete(BACKLOG_STORE, id)
}

export async function getAllErrandRuns() {
  const db = await getDB()
  return db.getAll(ERRAND_STORE)
}

export async function saveErrandRun(run) {
  const db = await getDB()
  const now = Date.now()
  return db.put(ERRAND_STORE, { ...run, id: run.id || `er_${now}`, created_at: run.created_at || now })
}

export async function deleteErrandRun(id) {
  const db = await getDB()
  return db.delete(ERRAND_STORE, id)
}

export async function getAllUtilityItems() {
  const db = await getDB()
  return db.getAll(UTILITY_STORE)
}

export async function saveUtilityItem(item) {
  const db = await getDB()
  const now = Date.now()
  return db.put(UTILITY_STORE, { ...item, id: item.id || `ui_${now}`, created_at: item.created_at || now })
}

export async function deleteUtilityItem(id) {
  const db = await getDB()
  return db.delete(UTILITY_STORE, id)
}

export async function getAllChecklists() {
  const db = await getDB()
  return db.getAll(CHECKLIST_STORE)
}

export async function saveChecklist(checklist) {
  const db = await getDB()
  const now = Date.now()
  return db.put(CHECKLIST_STORE, { ...checklist, id: checklist.id || `cl_${now}`, created_at: checklist.created_at || now })
}

export async function deleteChecklist(id) {
  const db = await getDB()
  return db.delete(CHECKLIST_STORE, id)
}

export async function getAllInvestments() {
  const db = await getDB()
  return db.getAll(INVESTMENT_STORE)
}

export async function saveInvestment(investment) {
  const db = await getDB()
  const now = Date.now()
  return db.put(INVESTMENT_STORE, {
    ...investment,
    id: investment.id || `inv_${now}`,
    created_at: investment.created_at || now,
    updated_at: now,
  })
}

export async function deleteInvestment(id) {
  const db = await getDB()
  return db.delete(INVESTMENT_STORE, id)
}

export async function getAllGoals() {
  const db = await getDB()
  return db.getAll(GOALS_STORE)
}

export async function saveGoal(goal) {
  const db = await getDB()
  const now = Date.now()
  return db.put(GOALS_STORE, {
    ...goal,
    id: goal.id || `goal_${now}`,
    created_at: goal.created_at || now,
  })
}

export async function deleteGoal(id) {
  const db = await getDB()
  return db.delete(GOALS_STORE, id)
}

export async function getAllPeople() {
  const db = await getDB()
  return db.getAll(PEOPLE_STORE)
}

export async function savePerson(person) {
  const db = await getDB()
  const now = Date.now()
  return db.put(PEOPLE_STORE, {
    ...person,
    id: person.id || `person_${now}`,
    events: person.events || [],
    created_at: person.created_at || now,
  })
}

export async function deletePerson(id) {
  const db = await getDB()
  return db.delete(PEOPLE_STORE, id)
}
