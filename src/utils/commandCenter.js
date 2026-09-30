const URGENCY_RANK = { overdue: 0, today: 1, info: 2 }
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const BACKUP_STALE_MS = 21 * 24 * 60 * 60 * 1000

function backlogStatus(item) {
  return item.status || (item.done ? 'done' : 'backlog')
}

// Aggregates "what needs attention right now" across the existing stores —
// no new due-date concepts, just surfacing signals that already exist.
const DAY_MS = 24 * 60 * 60 * 1000

export function getPendingFeed({ backlog = [], utilityItems = [], errandRuns = [], goals = [], people = [], profile = null, now = Date.now() } = {}) {
  const feed = []

  const overdueBacklog = backlog.filter(i => i.remind_at && i.remind_at <= now && backlogStatus(i) !== 'done')
  const overdueUtility = utilityItems.filter(i => i.meta?.remind_at && i.meta.remind_at <= now && !i.done)
  const overdueCount = overdueBacklog.length + overdueUtility.length
  if (overdueCount > 0) {
    feed.push({
      id: 'overdue-reminders',
      emoji: '⏰',
      text: `${overdueCount} reminder${overdueCount > 1 ? 's' : ''} overdue`,
      urgency: 'overdue',
      target: 'agenda',
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
      utility: 'today',
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
      utility: 'errand',
    })
  }

  // Decisions whose review date has arrived. This is the whole point of the
  // decision journal — an unreviewed decision teaches you nothing.
  const decisionsDue = utilityItems.filter(
    i => i.type === 'decisions' && i.meta?.review_at && i.meta.review_at <= now && !i.meta?.outcome
  )
  if (decisionsDue.length > 0) {
    feed.push({
      id: 'decisions-due',
      emoji: '🧠',
      text: decisionsDue.length === 1
        ? `Time to review: "${decisionsDue[0].title}"`
        : `${decisionsDue.length} decisions ready to review`,
      urgency: 'today',
      target: 'utilities',
      utility: 'decisions',
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
      utility: 'backlog',
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
      utility: 'debts',
    })
  }

  const owedCount = people.reduce((s, p) => s + (p.events || []).filter(e => e.owed && !e.owed.settled).length, 0)
  if (owedCount > 0) {
    feed.push({
      id: 'people-owed',
      emoji: '🤝',
      text: `${owedCount} favor${owedCount > 1 ? 's' : ''} owed with people`,
      urgency: 'info',
      target: 'utilities',
      utility: 'people-crm',
    })
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const nearestDeadline = activeGoals
    .filter(g => g.target_date)
    .map(g => ({ goal: g, daysLeft: Math.round((new Date(g.target_date + 'T00:00:00') - now) / DAY_MS) }))
    .filter(g => g.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0]
  if (nearestDeadline) {
    feed.push({
      id: 'goal-deadline',
      emoji: '🎯',
      text: nearestDeadline.daysLeft < 0
        ? `"${nearestDeadline.goal.title}" is overdue`
        : `${nearestDeadline.daysLeft} day${nearestDeadline.daysLeft === 1 ? '' : 's'} left on "${nearestDeadline.goal.title}"`,
      urgency: nearestDeadline.daysLeft < 0 ? 'overdue' : 'today',
      target: 'life',
    })
  } else if (activeGoals.length === 0) {
    feed.push({
      id: 'no-goals',
      emoji: '🎯',
      text: 'No goals set yet',
      urgency: 'info',
      target: 'life',
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

  // Everything lives in this device's IndexedDB. A browser data purge or a lost
  // phone is the one failure that can't be undone, so nag about it.
  const lastBackup = profile?.last_backup_at
  if (!lastBackup || (now - lastBackup) > BACKUP_STALE_MS) {
    const days = lastBackup ? Math.floor((now - lastBackup) / DAY_MS) : null
    feed.push({
      id: 'backup-stale',
      emoji: '🔐',
      text: days === null
        ? 'No backup yet — one bad day could erase everything'
        : `Last backup was ${days} days ago`,
      urgency: lastBackup ? 'info' : 'today',
      target: 'settings',
    })
  }

  return feed.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency])
}
