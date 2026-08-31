// ─── XP Calculation ────────────────────────────────────────────────

const BOOL_XP = {
  morning_ritual:       50,
  prayer_done:          30,
  reflection_completed: 30,
  paid_yourself_first:  30,
  avoided_impulse:      20,
  financial_learning:   15,
  temper_controlled:    45, // hardest habit — high reward
  family_kindness:      25,
  supplements:          10,
  no_junk_food:         20,
  breakfast:            10,
  lunch:                10,
  dinner:               10,
}

const RATE_XP = {
  deep_work_hours:     { rate: 10,  cap: 80 },
  learning_minutes:    { rate: 0.5, cap: 60 },
  pages_read:          { rate: 2,   cap: 50 },
  leetcode_problems:   { rate: 15,  cap: 45 },
  god_minutes:         { rate: 0.5, cap: 30 },
  scripture_minutes:   { rate: 0.5, cap: 20 },
  meditation_minutes:  { rate: 0.5, cap: 25 },
  workout_minutes:     { rate: 0.5, cap: 30 },
  family_time:         { rate: 0.3, cap: 25 },
}

export function calculateDayXP(entry) {
  if (!entry) return 0
  let xp = 10 // base for logging

  for (const [key, pts] of Object.entries(BOOL_XP)) {
    if (entry[key] === true) xp += pts
  }

  const sleep = entry.sleep_hours || 0
  if (sleep >= 7 && sleep <= 9) xp += 30

  if ((entry.water_liters || 0) >= 2) xp += 25
  if ((entry.steps || 0) >= 8000) xp += 25
  if ((entry.energy_score || 0) >= 8) xp += 20
  if ((entry.mood_score || 0) >= 8) xp += 20

  for (const [key, { rate, cap }] of Object.entries(RATE_XP)) {
    xp += Math.min((entry[key] || 0) * rate, cap)
  }

  return Math.round(xp)
}

// ─── Levels ────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, title: 'Initiate',     emoji: '🌱', min: 0,      max: 500   },
  { level: 2, title: 'Apprentice',   emoji: '⚡', min: 500,    max: 1500  },
  { level: 3, title: 'Practitioner', emoji: '🔥', min: 1500,   max: 3500  },
  { level: 4, title: 'Adept',        emoji: '🎯', min: 3500,   max: 7000  },
  { level: 5, title: 'Expert',       emoji: '💎', min: 7000,   max: 12000 },
  { level: 6, title: 'Master',       emoji: '🏆', min: 12000,  max: 20000 },
  { level: 7, title: 'Grandmaster',  emoji: '🌟', min: 20000,  max: 32000 },
  { level: 8, title: 'Sage',         emoji: '🔮', min: 32000,  max: 50000 },
  { level: 9, title: 'Legend',       emoji: '👑', min: 50000,  max: Infinity },
]

export function getLevelInfo(totalXP) {
  let found = LEVELS[0]
  for (const lvl of LEVELS) {
    if (totalXP >= lvl.min) found = lvl
  }
  const isMax = found.max === Infinity
  const progress = isMax ? 1 : (totalXP - found.min) / (found.max - found.min)
  return {
    ...found,
    totalXP,
    progress: Math.min(progress, 1),
    xpInLevel: totalXP - found.min,
    xpToNext: isMax ? 0 : found.max - totalXP,
    rangeSize: isMax ? 0 : found.max - found.min,
  }
}

// ─── Streaks ───────────────────────────────────────────────────────

const STREAK_DEFS = [
  { key: 'logging',        label: 'Daily Log',      emoji: '📝', fn: () => true },
  { key: 'morning_ritual', label: 'Morning Ritual', emoji: '🌅', fn: e => e.morning_ritual === true },
  { key: 'meditation',     label: 'Meditation',     emoji: '😌', fn: e => (e.meditation_minutes || 0) > 0 },
  { key: 'reflection',     label: 'Reflection',     emoji: '✍️', fn: e => e.reflection_completed === true },
  { key: 'prayer',         label: 'Prayer',         emoji: '🙏', fn: e => e.prayer_done === true },
  { key: 'learning',       label: 'Learning',       emoji: '📚', fn: e => (e.learning_minutes || 0) > 0 },
  { key: 'deep_work',      label: 'Deep Work',      emoji: '🔥', fn: e => (e.deep_work_hours || 0) >= 2 },
  { key: 'hydration',      label: 'Hydration',      emoji: '💧', fn: e => (e.water_liters || 0) >= 2 },
]

function maxConsecutive(sorted, fn) {
  let best = 0, cur = 0
  for (const e of sorted) {
    if (fn(e)) { cur++; best = Math.max(best, cur) } else cur = 0
  }
  return best
}

function currentConsecutive(sortedDesc, fn) {
  const today = todayStr()
  const yesterday = offsetDayStr(-1)
  if (!sortedDesc.length) return 0
  const first = sortedDesc[0].date
  if (first !== today && first !== yesterday) return 0

  let streak = 0
  let expected = first
  for (const e of sortedDesc) {
    if (e.date === expected && fn(e)) {
      streak++
      expected = offsetDateStr(expected, -1)
    } else if (e.date === expected && !fn(e)) {
      break
    }
  }
  return streak
}

export function computeStreaks(entries) {
  if (!entries.length) return STREAK_DEFS.map(d => ({ ...d, current: 0, best: 0 }))
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const sortedDesc = [...sorted].reverse()
  return STREAK_DEFS.map(d => ({
    ...d,
    current: currentConsecutive(sortedDesc, d.fn),
    best: maxConsecutive(sorted, d.fn),
  }))
}

// ─── Badges ────────────────────────────────────────────────────────

export const BADGE_DEFS = [
  // Milestones
  { id: 'first_step',    name: 'First Step',     emoji: '🌟', desc: 'Log your first day',               cat: 'milestone' },
  { id: 'one_week',      name: 'Week Warrior',   emoji: '🔑', desc: '7 consecutive days logged',        cat: 'milestone' },
  { id: 'month_warrior', name: 'Month Warrior',  emoji: '🏆', desc: '30 consecutive days logged',       cat: 'milestone' },
  { id: 'century_club',  name: 'Century Club',   emoji: '💎', desc: '100 total days logged',             cat: 'milestone' },
  { id: 'legendary',     name: 'Legendary',      emoji: '👑', desc: '365 total days logged',             cat: 'milestone' },
  // Health
  { id: 'hydration_hero',  name: 'Hydration Hero',  emoji: '💧', desc: '14 consecutive days 2L+ water', cat: 'health' },
  { id: 'sleep_guardian',  name: 'Sleep Guardian',  emoji: '😴', desc: '7 consecutive nights 7-9h',     cat: 'health' },
  { id: 'step_master',     name: 'Step Master',     emoji: '👟', desc: '7 consecutive days 8k+ steps',  cat: 'health' },
  { id: 'active_week',     name: 'Active Week',     emoji: '🏃', desc: '5+ movement days in a week',    cat: 'health' },
  // Mind
  { id: 'zen_mind',        name: 'Zen Mind',        emoji: '😌', desc: '7 consecutive days meditating', cat: 'mind' },
  { id: 'sunrise_warrior', name: 'Sunrise Warrior', emoji: '🌅', desc: '14 consecutive morning rituals',cat: 'mind' },
  { id: 'resilient',       name: 'Resilient',       emoji: '💪', desc: '30 total reflections',          cat: 'mind' },
  { id: 'peak_state',      name: 'Peak State',      emoji: '⚡', desc: '5 days energy score 9+',        cat: 'mind' },
  // Work
  { id: 'deep_worker',     name: 'Deep Worker',     emoji: '🔥', desc: '10 consecutive days 4h+ deep work', cat: 'work' },
  { id: 'focus_machine',   name: 'Focus Machine',   emoji: '🎯', desc: '3h+ deep work for 30 total days',  cat: 'work' },
  // Learning
  { id: 'scholar',         name: 'Scholar',         emoji: '📚', desc: '30 consecutive days learning',  cat: 'learning' },
  { id: 'page_turner',     name: 'Page Turner',     emoji: '📖', desc: '500 total pages read',          cat: 'learning' },
  { id: 'daily_learner',   name: 'Daily Learner',   emoji: '🧠', desc: '14 consecutive days 1h+ learning', cat: 'learning' },
  { id: 'code_warrior',    name: 'Code Warrior',    emoji: '💻', desc: '10 total LeetCode problems',    cat: 'learning' },
  // Spirit
  { id: 'devotion',        name: 'Devotion',        emoji: '🙏', desc: '21 consecutive days prayer',    cat: 'spirit' },
  { id: 'reflector',       name: 'Reflector',       emoji: '✍️', desc: '21 consecutive days reflection',cat: 'spirit' },
]

export function evaluateBadges(entries) {
  if (!entries.length) return new Set()
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const earned = new Set()

  if (sorted.length >= 1) earned.add('first_step')
  if (sorted.length >= 100) earned.add('century_club')
  if (sorted.length >= 365) earned.add('legendary')

  if (maxConsecutive(sorted, () => true) >= 7) earned.add('one_week')
  if (maxConsecutive(sorted, () => true) >= 30) earned.add('month_warrior')

  if (maxConsecutive(sorted, e => (e.water_liters || 0) >= 2) >= 14) earned.add('hydration_hero')
  if (maxConsecutive(sorted, e => { const s = e.sleep_hours||0; return s>=7&&s<=9 }) >= 7) earned.add('sleep_guardian')
  if (maxConsecutive(sorted, e => (e.steps || 0) >= 8000) >= 7) earned.add('step_master')

  // active_week: any ISO week with 5+ workout days
  const weekMap = {}
  for (const e of sorted) {
    const wk = getWeekKey(e.date)
    if (!weekMap[wk]) weekMap[wk] = 0
    if ((e.workout_minutes || 0) > 0) weekMap[wk]++
  }
  if (Object.values(weekMap).some(v => v >= 5)) earned.add('active_week')

  if (maxConsecutive(sorted, e => (e.meditation_minutes || 0) > 0) >= 7) earned.add('zen_mind')
  if (maxConsecutive(sorted, e => e.morning_ritual === true) >= 14) earned.add('sunrise_warrior')
  if (sorted.filter(e => e.reflection_completed === true).length >= 30) earned.add('resilient')
  if (sorted.filter(e => (e.energy_score || 0) >= 9).length >= 5) earned.add('peak_state')

  if (maxConsecutive(sorted, e => (e.deep_work_hours || 0) >= 4) >= 10) earned.add('deep_worker')
  if (sorted.filter(e => (e.deep_work_hours || 0) >= 3).length >= 30) earned.add('focus_machine')

  if (maxConsecutive(sorted, e => (e.learning_minutes || 0) > 0) >= 30) earned.add('scholar')
  if (sorted.reduce((s, e) => s + (e.pages_read || 0), 0) >= 500) earned.add('page_turner')
  if (maxConsecutive(sorted, e => (e.learning_minutes || 0) >= 60) >= 14) earned.add('daily_learner')
  if (sorted.reduce((s, e) => s + (e.leetcode_problems || 0), 0) >= 10) earned.add('code_warrior')

  if (maxConsecutive(sorted, e => e.prayer_done === true) >= 21) earned.add('devotion')
  if (maxConsecutive(sorted, e => e.reflection_completed === true) >= 21) earned.add('reflector')

  return earned
}

// ─── Sleep Auto-Calc ──────────────────────────────────────────────

export function calcSleepHours(bedTime, wakeTime) {
  if (!bedTime || !wakeTime) return null
  const [bh, bm] = bedTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  const bedMins = bh * 60 + bm
  const wakeMins = wh * 60 + wm
  // Assume crossing midnight when wake <= bed
  const sleepMins = wakeMins <= bedMins ? (1440 - bedMins + wakeMins) : (wakeMins - bedMins)
  return +(sleepMins / 60).toFixed(2)
}

// ─── Helpers ───────────────────────────────────────────────────────

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function offsetDayStr(days) {
  return offsetDateStr(todayStr(), days)
}

function offsetDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}
