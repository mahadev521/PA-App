import { openDB } from 'idb'

const DB_NAME = 'lifeos-pa'
const DB_VERSION = 5
const STORE = 'entries'
const PROFILE_STORE = 'profile'
const EXP_STORE = 'experiences'
const TASKS_STORE = 'tasks'
const GO_TASKS_STORE = 'go_tasks'
const BACKLOG_STORE = 'backlog'
const ERRAND_STORE = 'errand_runs'
const UTILITY_STORE = 'utility_items'

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
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
    },
  })
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

export async function exportData() {
  const [entries, profile, experiences] = await Promise.all([getAllEntries(), getProfile(), getAllExperiences()])
  const blob = new Blob(
    [JSON.stringify({ profile, entries, experiences }, null, 2)],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(jsonString) {
  const data = JSON.parse(jsonString)
  const db = await getDB()
  if (data.entries?.length) {
    const tx = db.transaction(STORE, 'readwrite')
    await Promise.all(data.entries.map(e => tx.store.put(e)))
    await tx.done
  }
  if (data.experiences?.length) {
    const tx2 = db.transaction(EXP_STORE, 'readwrite')
    await Promise.all(data.experiences.map(e => tx2.store.put(e)))
    await tx2.done
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
