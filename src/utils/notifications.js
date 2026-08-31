export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.requestPermission()
}

// Fires an OS notification for every item whose reminder is due and hasn't
// fired yet. Returns the ids that fired so the caller can persist
// remind_fired and avoid re-notifying on the next check.
export function fireDueReminders(items) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return []
  const now = Date.now()
  const due = items.filter(i => i.remind_at && !i.remind_fired && i.remind_at <= now)
  due.forEach(i => {
    try {
      new Notification('Reminder', { body: i.title, tag: i.id })
    } catch {
      // Notification constructor can throw in some contexts (e.g. Android Chrome PWA) — ignore.
    }
  })
  return due.map(i => i.id)
}
