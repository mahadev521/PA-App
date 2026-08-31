const URGENCY_RANK = { overdue: 0, today: 1, info: 2 }
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function backlogStatus(item) {
  return item.status || (item.done ? 'done' : 'backlog')
}

// Aggregates "what needs attention right now" across the existing stores —
// no new due-date concepts, just surfacing signals that already exist.
export function getPendingFeed({ backlog = [], utilityItems = [], errandRuns = [], profile = null, now = Date.now() } = {}) {
  const feed = []

  const overdueBacklog = backlog.filter(i => i.remind_at && i.remind_at <= now)
  const overdueUtility = utilityItems.filter(i => i.meta?.remind_at && i.meta.remind_at <= now)
  const overdueCount = overdueBacklog.length + overdueUtility.length
  if (overdueCount > 0) {
    feed.push({
      id: 'overdue-reminders',
      emoji: '⏰',
      text: `${overdueCount} reminder${overdueCount > 1 ? 's' : ''} overdue`,
      urgency: 'overdue',
      target: 'utilities',
    })
  }

  const todayCount = backlog.filter(i => backlogStatus(i) === 'today').length
  if (todayCount > 0) {
    feed.push({
      id: 'today-mustdo',
      emoji: '🔥',
      text: `${todayCount} must-do item${todayCount > 1 ? 's' : ''} for today`,
      urgency: 'today',
      target: 'utilities',
    })
  }

  const activeRun = errandRuns.find(r => !r.completed && (r.stops || []).some(s => s.status === 'pending'))
  if (activeRun) {
    const left = activeRun.stops.filter(s => s.status === 'pending').length
    feed.push({
      id: 'active-errand',
      emoji: '🚗',
      text: `"${activeRun.name}" has ${left} stop${left > 1 ? 's' : ''} left`,
      urgency: 'today',
      target: 'utilities',
    })
  }

  const inboxCount = backlog.filter(i => backlogStatus(i) === 'backlog').length
  if (inboxCount > 0) {
    feed.push({
      id: 'untriaged-inbox',
      emoji: '📥',
      text: `${inboxCount} item${inboxCount > 1 ? 's' : ''} waiting to be triaged`,
      urgency: 'info',
      target: 'utilities',
    })
  }

  const debtItems = utilityItems.filter(i => i.type === 'debts' && !i.done)
  const iOwe = debtItems.filter(i => i.category === 'i_owe').reduce((s, i) => s + (Number(i.meta?.amount) || 0), 0)
  const owedToMe = debtItems.filter(i => i.category === 'owed_to_me').reduce((s, i) => s + (Number(i.meta?.amount) || 0), 0)
  if (iOwe > 0 || owedToMe > 0) {
    const parts = []
    if (iOwe > 0) parts.push(`₹${iOwe.toLocaleString()} you owe`)
    if (owedToMe > 0) parts.push(`₹${owedToMe.toLocaleString()} owed to you`)
    feed.push({
      id: 'debts-pending',
      emoji: '🧾',
      text: parts.join(' · '),
      urgency: 'info',
      target: 'utilities',
    })
  }

  const lastReview = profile?.last_weekly_review_at
  if (!lastReview || (now - lastReview) > WEEK_MS) {
    feed.push({
      id: 'weekly-review',
      emoji: '🧭',
      text: lastReview ? 'Weekly Review is overdue' : 'Start your first Weekly Review',
      urgency: 'today',
      target: 'weekly-review',
    })
  }

  return feed.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency])
}
