// Everything with a date attached, on one timeline. Reminders used to be
// invisible until they were already overdue — this makes the next seven days
// something you can actually look at.

const DAY = 864e5

function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const BUCKETS = [
  { id: 'overdue',  label: 'Overdue',     emoji: '⏰', tone: 'rose'    },
  { id: 'today',    label: 'Today',       emoji: '🔥', tone: 'accent'  },
  { id: 'tomorrow', label: 'Tomorrow',    emoji: '🌅', tone: 'gold'    },
  { id: 'week',     label: 'This week',   emoji: '📅', tone: 'sky'     },
  { id: 'later',    label: 'Later',       emoji: '🗓️', tone: 'muted'   },
]

function bucketFor(item, now) {
  const today = startOfDay(now)
  const day = startOfDay(item.at)
  if (day < today) return 'overdue'
  // Only something with a real clock time can be overdue *within* today. An
  // item merely claimed for today is still today's work, not a failure.
  if (day === today) return item.dated && item.at < now ? 'overdue' : 'today'
  if (day === today + DAY) return 'tomorrow'
  if (day <= today + 7 * DAY) return 'week'
  return 'later'
}

/**
 * @returns {Array<{id,label,emoji,tone,items:Array}>} only non-empty buckets
 */
export function buildAgenda({
  backlog = [], utilityItems = [], goals = [], people = [], now = Date.now(),
} = {}) {
  const items = []

  for (const i of backlog) {
    const status = i.status || (i.done ? 'done' : 'backlog')
    if (status === 'done') continue
    if (i.remind_at) {
      items.push({
        key: `bl_${i.id}`, title: i.title, at: i.remind_at, dated: true,
        emoji: '🔔', source: status === 'today' ? 'Today' : 'Backlog',
        nav: { tab: 'utilities', utility: status === 'today' ? 'today' : 'backlog' },
      })
    } else if (status === 'today') {
      // No clock time, but it is explicitly claimed for today.
      items.push({
        key: `bl_${i.id}`, title: i.title, at: startOfDay(now), dated: false,
        emoji: '🔥', source: 'Today',
        nav: { tab: 'utilities', utility: 'today' },
      })
    }
  }

  for (const i of utilityItems) {
    if (i.done) continue
    if (i.meta?.remind_at) {
      items.push({
        key: `ui_${i.id}`, title: i.title, at: i.meta.remind_at, dated: true,
        emoji: '🔔', source: i.type,
        nav: { tab: 'utilities', utility: i.type },
      })
    }
    if (i.type === 'decisions' && i.meta?.review_at && !i.meta?.outcome) {
      items.push({
        key: `dec_${i.id}`, title: `Review: ${i.title}`, at: i.meta.review_at, dated: false,
        emoji: '🧠', source: 'Decision review',
        nav: { tab: 'utilities', utility: 'decisions' },
      })
    }
  }

  for (const g of goals) {
    if (g.status === 'done' || g.status === 'abandoned' || !g.target_date) continue
    items.push({
      key: `goal_${g.id}`, title: g.title, at: new Date(g.target_date + 'T09:00:00').getTime(), dated: false,
      emoji: '🎯', source: 'Goal deadline',
      nav: { tab: 'life', mode: 'goals' },
    })
  }

  for (const p of people) {
    for (const ev of p.events || []) {
      if (ev.owed && !ev.owed.settled && ev.owed.due_at) {
        items.push({
          key: `ppl_${p.id}_${ev.id}`, title: `${p.name}: ${ev.owed.desc || 'favour owed'}`,
          at: ev.owed.due_at, dated: true, emoji: '🤝', source: 'People',
          nav: { tab: 'utilities', utility: 'people-crm' },
        })
      }
    }
  }

  items.sort((a, b) => a.at - b.at)

  return BUCKETS
    .map(b => ({ ...b, items: items.filter(i => bucketFor(i, now) === b.id) }))
    .filter(b => b.items.length > 0)
}

export function agendaCounts(buckets) {
  const total = buckets.reduce((s, b) => s + b.items.length, 0)
  const overdue = buckets.find(b => b.id === 'overdue')?.items.length || 0
  const today = buckets.find(b => b.id === 'today')?.items.length || 0
  return { total, overdue, today }
}
