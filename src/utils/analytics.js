import { format, subDays, parseISO, isValid, addDays } from 'date-fns'
import { calcSleepHours } from './gamification'

// Sleep value: prefer explicit field, fall back to wake/bed calc
function getSleepValue(entry) {
  if (entry.sleep_hours) return entry.sleep_hours
  if (entry.wake_time && entry.bed_time) return calcSleepHours(entry.bed_time, entry.wake_time)
  return null
}

function getMetricValue(entry, metricKey) {
  if (metricKey === 'sleep_hours') return getSleepValue(entry)
  return entry[metricKey] ?? null
}

// Returns last N days of data for a metric, filling gaps with null
export function getMetricSeries(entries, metricKey, days = 30) {
  const byDate = Object.fromEntries(entries.map(e => [e.date, e]))
  const series = []
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const entry = byDate[date]
    series.push({
      date,
      label: format(subDays(new Date(), i), 'MMM d'),
      value: entry ? getMetricValue(entry, metricKey) : null,
    })
  }
  return series
}

// Returns weekly averages for a metric
export function getWeeklyAverages(entries, metricKey, weeks = 8) {
  const result = []
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = subDays(new Date(), w * 7 + 6)
    const weekEnd = subDays(new Date(), w * 7)
    const weekLabel = format(weekStart, 'MMM d')
    const weekEntries = entries.filter(e => {
      const d = parseISO(e.date)
      return isValid(d) && d >= weekStart && d <= weekEnd
    })
    const values = weekEntries.map(e => getMetricValue(e, metricKey)).filter(v => v != null && v !== 0)
    result.push({
      week: weekLabel,
      avg: values.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null,
      count: values.length,
    })
  }
  return result
}

// Returns summary stats for a metric
export function getMetricStats(entries, metricKey) {
  const values = entries.map(e => getMetricValue(e, metricKey)).filter(v => v != null && typeof v === 'number' && v > 0)
  if (!values.length) return { avg: 0, best: 0, total: 0, count: 0 }
  return {
    avg: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
    best: Math.max(...values),
    total: +values.reduce((a, b) => a + b, 0).toFixed(0),
    count: values.length,
  }
}

// Compute a simple Pearson correlation between two metrics
export function correlate(entries, keyA, keyB) {
  const pairs = entries
    .filter(e => e[keyA] != null && e[keyB] != null && typeof e[keyA] === 'number' && typeof e[keyB] === 'number')
    .map(e => [e[keyA], e[keyB]])

  if (pairs.length < 5) return null

  const n = pairs.length
  const sumA = pairs.reduce((s, [a]) => s + a, 0)
  const sumB = pairs.reduce((s, [, b]) => s + b, 0)
  const sumAB = pairs.reduce((s, [a, b]) => s + a * b, 0)
  const sumA2 = pairs.reduce((s, [a]) => s + a * a, 0)
  const sumB2 = pairs.reduce((s, [, b]) => s + b * b, 0)
  const num = n * sumAB - sumA * sumB
  const den = Math.sqrt((n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2))
  return den === 0 ? null : +(num / den).toFixed(2)
}

// Generate natural-language insight for chart screen
export function generateInsight(entries, activeMetric) {
  if (entries.length < 7) return null

  const recent7 = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
  const prev7 = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(7, 14)

  const avg = (arr, key) => {
    const vals = arr.map(e => e[key]).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }

  const recentAvg = avg(recent7, activeMetric)
  const prevAvg = avg(prev7, activeMetric)

  const insights = {
    sleep_hours: () => {
      const r = correlate(entries, 'sleep_hours', 'mood_score')
      if (r !== null && r > 0.4) return `Sleep strongly boosts your mood (r=${r}). Protect 7-9h.`
      if (recentAvg > prevAvg) return `Sleep improved this week (+${(recentAvg - prevAvg).toFixed(1)}h avg). Keep it up.`
      if (recentAvg < prevAvg) return `Sleep dipped this week. Aim to be in bed 30min earlier.`
      return `Your sleep has been consistent this week.`
    },
    energy_score: () => {
      const r = correlate(entries, 'sleep_hours', 'energy_score')
      if (r !== null && r > 0.4) return `Sleep quality is your #1 energy lever (r=${r}).`
      if (recentAvg > prevAvg) return `Energy trending up this week 🔥`
      return `Track sleep and hydration — they predict your energy most.`
    },
    mood_score: () => {
      const r = correlate(entries, 'movement_minutes', 'mood_score')
      if (r !== null && r > 0.35) return `Exercise clearly lifts your mood (r=${r}). Move daily.`
      if (recentAvg > prevAvg) return `Mood has improved this week. What's working? Note it.`
      return `Reflection and movement are your top mood predictors.`
    },
    deep_work_hours: () => {
      if (recentAvg > prevAvg) return `Deep work up ${(recentAvg - prevAvg).toFixed(1)}h/day vs last week. Compounding.`
      if (recentAvg < prevAvg - 0.5) return `Deep work slipped. Block 9am-12pm as your sacred focus window.`
      return `Consistency beats bursts. Even 2h/day = 60h/month.`
    },
    learning_minutes: () => {
      const total = entries.reduce((s, e) => s + (e.learning_minutes || 0), 0)
      return `${Math.round(total / 60)}h of learning logged in total. Every day compounds.`
    },
  }

  return (insights[activeMetric] || (() => null))()
}

// Returns habit completion rates for heatmap
export function getHabitHeatmap(entries, habitKey, days = 90) {
  const byDate = Object.fromEntries(entries.map(e => [e.date, e]))
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const entry = byDate[date]
    result.push({
      date,
      done: entry ? !!entry[habitKey] : false,
      logged: !!entry,
    })
  }
  return result
}

// ─── Compound Effect Projection ──────────────────────────────────

export function getProjection(entries, metricKey, futureDays = 30) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-14).map(e => getMetricValue(e, metricKey)).filter(v => v != null && v > 0)
  if (recent.length < 3) return []
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  return Array.from({ length: futureDays }, (_, i) => ({
    label: format(addDays(new Date(), i + 1), 'MMM d'),
    value: null,
    projected: +avg.toFixed(1),
  }))
}

export function getCompoundSummary(entries, metricKey) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-14).map(e => getMetricValue(e, metricKey)).filter(v => v != null && v > 0)
  if (recent.length < 3) return null
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  const msgs = {
    learning_minutes: `${Math.round(avg * 30 / 60)}h of learning in 30 days → ${Math.round(avg * 365 / 60)}h/year. Non-readers have no advantage.`,
    pages_read: `${Math.round(avg * 30)} pages in 30 days → ~${Math.round(avg * 365 / 300)} books/year at this pace.`,
    deep_work_hours: `${(avg * 30).toFixed(0)}h deep work in 30 days → ${(avg * 365).toFixed(0)}h/year = ${Math.round(avg * 365 / 8)} full 8h focus days.`,
    sleep_hours: avg >= 7 && avg <= 9 ? `Averaging ${avg.toFixed(1)}h — optimal range. Protect this.` : avg < 7 ? `Averaging ${avg.toFixed(1)}h. Sleep debt costs more than prevention.` : `Averaging ${avg.toFixed(1)}h. Target 7.5-8.5h peak.`,
    god_minutes: `${Math.round(avg * 365 / 60)}h/year with God at this rate. This is the foundation.`,
    family_time: `${Math.round(avg * 365 / 60)}h/year with family. What would you pay for this time in 10 years?`,
  }
  return msgs[metricKey] || null
}

// ─── Smart Insights (for Home screen) ────────────────────────────

export function getSmartInsights(entries, streaks) {
  if (entries.length < 3) return []
  const insights = []
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const last7 = sorted.slice(0, 7)

  // Days since last family time logged
  const noFamilyIdx = sorted.findIndex(e => (e.family_time || 0) > 0)
  if (noFamilyIdx >= 3) {
    insights.push({ type: 'warn', emoji: '❤️', text: `No family time logged in ${noFamilyIdx} days. Someone at home needs you present, not just present.` })
  }

  // Sleep inconsistency
  const sleepVals = last7.map(e => getSleepValue(e)).filter(Boolean)
  if (sleepVals.length >= 4) {
    const range = Math.max(...sleepVals) - Math.min(...sleepVals)
    if (range >= 2.5) {
      insights.push({ type: 'warn', emoji: '😴', text: `Sleep range this week: ${Math.min(...sleepVals).toFixed(1)}-${Math.max(...sleepVals).toFixed(1)}h. Inconsistency harms recovery more than short duration.` })
    }
  }

  // Deep work trend vs previous week
  const workVals7 = last7.map(e => e.deep_work_hours || 0)
  const workPrev = sorted.slice(7, 14).map(e => e.deep_work_hours || 0)
  if (workVals7.length >= 4 && workPrev.length >= 4) {
    const avg7 = workVals7.reduce((a, b) => a + b, 0) / workVals7.length
    const avgP = workPrev.reduce((a, b) => a + b, 0) / workPrev.length
    if (avg7 < avgP * 0.65 && avgP > 0.5) {
      insights.push({ type: 'warn', emoji: '🔥', text: `Deep work down ${Math.round((1 - avg7 / avgP) * 100)}% from last week. Are you eating the frog, or feeding it?` })
    } else if (avg7 > avgP * 1.25 && avgP > 0) {
      insights.push({ type: 'pos', emoji: '🔥', text: `Deep work up ${Math.round((avg7 / avgP - 1) * 100)}% this week. You're in a compound effect cycle. Protect it.` })
    }
  }

  // Morning ritual streak
  const mrStreak = streaks?.find(s => s.key === 'morning_ritual')
  if (mrStreak?.current >= 5) {
    insights.push({ type: 'pos', emoji: '🌅', text: `${mrStreak.current}-day morning ritual streak. "Win the morning, win the day." — Tim Ferriss` })
  } else if (mrStreak?.current === 0 && (mrStreak?.best || 0) > 3) {
    insights.push({ type: 'warn', emoji: '🌅', text: `Morning ritual streak broken. You had ${mrStreak.best} days before. Get back on the horse today.` })
  }

  // Sleep → mood correlation
  const sleepMoodPairs = last7.filter(e => getSleepValue(e) && e.mood_score)
  if (sleepMoodPairs.length >= 4) {
    const goodMood = sleepMoodPairs.filter(e => getSleepValue(e) >= 7.5).map(e => e.mood_score)
    const badMood = sleepMoodPairs.filter(e => getSleepValue(e) < 7).map(e => e.mood_score)
    if (goodMood.length >= 2 && badMood.length >= 2) {
      const diff = goodMood.reduce((a, b) => a + b, 0) / goodMood.length - badMood.reduce((a, b) => a + b, 0) / badMood.length
      if (diff >= 1.5) insights.push({ type: 'info', emoji: '💡', text: `Your mood is ${diff.toFixed(1)} pts higher on 7.5h+ sleep nights. Sleep is your single most powerful mood lever.` })
    }
  }

  // No-spend streak
  const noSpend = last7.filter(e => e.no_spend_day).length
  if (noSpend >= 4) insights.push({ type: 'pos', emoji: '💰', text: `${noSpend} no-spend days this week. "A part of all you earn is yours to keep." — Richest Man in Babylon` })

  return insights.slice(0, 3)
}

// ─── Coach: data-pattern context for a query ─────────────────────

const METRIC_KEYWORDS = [
  { keywords: ['sleep', 'tired', 'rest', 'bed', 'wake'],       metric: 'sleep_hours',      label: 'Sleep', unit: 'h' },
  { keywords: ['energy', 'energetic', 'fatigue', 'tired'],      metric: 'energy_score',     label: 'Energy', unit: '/10' },
  { keywords: ['mood', 'feel', 'emotion', 'happy', 'sad'],      metric: 'mood_score',       label: 'Mood', unit: '/10' },
  { keywords: ['focus', 'deep', 'work', 'productive'],          metric: 'deep_work_hours',  label: 'Deep Work', unit: 'h' },
  { keywords: ['learn', 'study', 'read', 'book'],               metric: 'learning_minutes', label: 'Learning', unit: 'min' },
  { keywords: ['water', 'hydrat', 'drink'],                     metric: 'water_liters',     label: 'Water', unit: 'L' },
  { keywords: ['step', 'walk', 'move', 'exercise', 'workout'],  metric: 'workout_minutes',  label: 'Exercise', unit: 'min' },
  { keywords: ['family', 'parent', 'home', 'wife', 'husband'],  metric: 'family_time',      label: 'Family Time', unit: 'min' },
  { keywords: ['god', 'pray', 'scripture', 'spirit'],           metric: 'god_minutes',      label: 'God Time', unit: 'min' },
  { keywords: ['money', 'invest', 'spend', 'finance', 'wealth'],metric: 'paid_yourself_first', label: 'Financial Discipline', unit: '' },
]

export function getQueryDataPattern(entries, tokens) {
  if (!entries.length || !tokens.length) return null
  const lower = tokens.map(t => t.toLowerCase())

  const matched = METRIC_KEYWORDS.find(({ keywords }) =>
    keywords.some(kw => lower.some(t => t.includes(kw)))
  )
  if (!matched) return null

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const last14 = sorted.slice(0, 14)
  const last7 = last14.slice(0, 7)

  const get = e => matched.metric === 'sleep_hours' ? getSleepValue(e) : e[matched.metric]

  const vals7 = last7.map(get).filter(v => v != null && (typeof v === 'boolean' ? true : v > 0))
  const vals14 = last14.map(get).filter(v => v != null && (typeof v === 'boolean' ? true : v > 0))

  if (!vals7.length) return null

  if (typeof vals7[0] === 'boolean') {
    const rate = Math.round(vals7.filter(Boolean).length / vals7.length * 100)
    return { label: matched.label, text: `${matched.label}: ${rate}% consistency this week (${vals7.filter(Boolean).length}/${vals7.length} days).` }
  }

  const avg7 = +(vals7.reduce((a, b) => a + b, 0) / vals7.length).toFixed(1)
  const avg14 = vals14.length > vals7.length
    ? +(vals14.slice(vals7.length).reduce((a, b) => a + b, 0) / vals14.slice(vals7.length).length).toFixed(1)
    : null

  const trend = avg14 ? (avg7 > avg14 * 1.08 ? '↑ improving' : avg7 < avg14 * 0.92 ? '↓ declining' : '→ stable') : ''
  return { label: matched.label, text: `${matched.label}: avg ${avg7}${matched.unit}/day this week ${trend ? `(${trend} vs prev week)` : ''}.` }
}
