// Parses a free-text capture line into a structured item: where it should
// land, when to be reminded, and how much money is involved. Every guess is
// shown back to the user as an editable chip before saving — the parser is
// allowed to be wrong, it is never allowed to be silent.

// ─── Destinations ──────────────────────────────────────────────────
// `kind: 'backlog'` writes to the backlog store, `kind: 'utility'` writes to
// utility_items with the given type/category. These mirror the buckets that
// already exist in Tools, so nothing lands somewhere the user can't find it.

export const DESTINATIONS = [
  { id: 'inbox',       label: 'Inbox',      emoji: '📥', kind: 'backlog', status: 'backlog', tag: 'inbox' },
  { id: 'today',       label: 'Today',      emoji: '🔥', kind: 'backlog', status: 'today',   tag: 'personal', todaySection: 'mustdo' },
  { id: 'shopping',    label: 'Shopping',   emoji: '🛒', kind: 'utility', type: 'shopping',    category: 'other' },
  { id: 'money',       label: 'Money',      emoji: '💰', kind: 'utility', type: 'money',       category: 'expense' },
  { id: 'debt_owe',    label: 'I Owe',      emoji: '📤', kind: 'utility', type: 'debts',       category: 'i_owe' },
  { id: 'debt_owed',   label: 'Owed to Me', emoji: '📥', kind: 'utility', type: 'debts',       category: 'owed_to_me' },
  { id: 'followup',    label: 'Follow-up',  emoji: '📞', kind: 'utility', type: 'people',      category: 'active' },
  { id: 'learning',    label: 'Learning',   emoji: '📚', kind: 'utility', type: 'learning',    category: 'captured' },
  { id: 'maintenance', label: 'Maintenance',emoji: '🔧', kind: 'utility', type: 'maintenance', category: 'home' },
  { id: 'fitness',     label: 'Fitness',    emoji: '🏃', kind: 'utility', type: 'fitness',     category: 'training' },
  { id: 'lifeadmin',   label: 'Life Admin', emoji: '🧹', kind: 'utility', type: 'lifeadmin',   category: 'other' },
  { id: 'decision',    label: 'Decision',   emoji: '🧠', kind: 'utility', type: 'decisions',   category: 'open' },
  { id: 'travel',      label: 'Travel',     emoji: '🧳', kind: 'utility', type: 'travel',      category: 'before' },
  { id: 'spiritual',   label: 'Spiritual',  emoji: '✝️', kind: 'utility', type: 'spiritual',   category: 'capture' },
]

export function getDestination(id) {
  return DESTINATIONS.find(d => d.id === id) || DESTINATIONS[0]
}

// Keyword → destination. First match wins, so the more specific patterns
// (debts, decisions) are listed before the broad ones (shopping, money).
const ROUTES = [
  { dest: 'debt_owed',   re: /\b(owes? me|lent (to )?|gave .* to|borrowed from me|to collect|get back from)\b/i },
  { dest: 'debt_owe',    re: /\b(i owe|owe |to repay|repay|pay back|borrowed|return money)\b/i },
  { dest: 'decision',    re: /\b(should i|decide|decision|choose between|worth it\??|or not\b|think through)\b/i },
  { dest: 'followup',    re: /\b(call|ring|phone|text|message|msg|whatsapp|email|mail|follow ?up|ask |remind .* to|check with|ping)\b/i },
  { dest: 'maintenance', re: /\b(service|servicing|repair|fix|replace|clean(ing)?|oil change|filter|maintenance|puc|battery)\b/i },
  { dest: 'fitness',     re: /\b(gym|workout|run\b|running|badminton|cricket|swim|yoga|stretch|walk\b|training|steps)\b/i },
  { dest: 'spiritual',   re: /\b(pray|prayer|church|bible|scripture|devotion|fast(ing)?|worship)\b/i },
  // Life Admin before Travel so "renew passport" is paperwork, not a trip.
  { dest: 'lifeadmin',   re: /\b(renew|insurance|policy|aadhaar|pan\b|licen[cs]e|tax|itr|bank|kyc|appointment|dentist|doctor|form\b|document)\b/i },
  // Travel before Learning so "book a flight" isn't read as "book to read".
  { dest: 'travel',      re: /\b(flight|trip|travel|hotel|visa|passport|itinerary|pack(ing)?|book\s+\w*\s*(flight|ticket|cab|train|hotel|room))\b/i },
  { dest: 'learning',    re: /\b(learn|study|read|course|tutorial|revise|practice|book\b|docs?\b|leetcode)\b/i },
  { dest: 'shopping',    re: /\b(buy|order|purchase|get \d|groceries|grocery|shopping|amazon|flipkart|refill|restock)\b/i },
  { dest: 'money',       re: /\b(pay|paid|bill|rent|emi|subscription|recharge|invoice|spent|expense|sip|invest)\b/i },
]

// Destinations where a bare number almost certainly means money — and the
// only ones whose screens actually render an amount, so the chip never
// promises a figure the destination will swallow.
const MONEY_DESTS = new Set(['money', 'debt_owe', 'debt_owed'])

// Section hints within Shopping / Maintenance, so items land in the right tab.
const SUB_CATEGORY = {
  shopping: [
    { category: 'grocery',     re: /\b(milk|bread|eggs|rice|dal|vegetable|veggies|fruit|grocer|oil|sugar|salt|atta|curd|snack)\b/i },
    { category: 'electronics', re: /\b(charger|cable|laptop|phone|headphone|earbud|mouse|keyboard|monitor|ssd|battery)\b/i },
    { category: 'personal',    re: /\b(shirt|pant|shoe|clothes|jacket|socks|watch|perfume|trimmer)\b/i },
    { category: 'sports',      re: /\b(racket|racquet|shuttle|ball|jersey|gym|dumbbell|mat)\b/i },
    { category: 'home',        re: /\b(bulb|detergent|cleaner|utensil|curtain|mattress|pillow|furniture)\b/i },
  ],
  maintenance: [
    { category: 'vehicle', re: /\b(car|bike|scooter|tyre|tire|oil change|puc|petrol|vehicle|insurance)\b/i },
    { category: 'tech',    re: /\b(laptop|backup|password|update|phone|router|wifi|disk|software)\b/i },
  ],
  money: [
    { category: 'bills',     re: /\b(rent|bill|emi|subscription|electricity|water bill|gas|broadband|recharge|premium)\b/i },
    { category: 'reminders', re: /\b(transfer|file|review|check|update)\b/i },
  ],
}

const WEEKDAYS = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
}

const DEFAULT_HOUR = 9        // bare dates ("tomorrow") remind at 9am
const EVENING_HOUR = 19       // "tonight" / "evening"

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function atTime(day, hour, minute = 0) {
  const x = new Date(day)
  x.setHours(hour, minute, 0, 0)
  return x
}

/** Pulls a time-of-day out of the text, e.g. "5pm", "at 7", "17:30". */
function extractTime(text) {
  const m = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (m) {
    let hour = +m[1] % 12
    if (/pm/i.test(m[3])) hour += 12
    return { hour, minute: m[2] ? +m[2] : 0, match: m[0] }
  }
  const m24 = text.match(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (m24) return { hour: +m24[1], minute: +m24[2], match: m24[0] }
  const bare = text.match(/\bat\s+(\d{1,2})\b/i)
  if (bare) {
    const h = +bare[1]
    // "at 7" almost always means the evening in a personal to-do context.
    return { hour: h >= 1 && h <= 7 ? h + 12 : h, minute: 0, match: bare[0] }
  }
  return null
}

/** Pulls a day out of the text, returning the matched substring to strip. */
function extractDay(text, now) {
  const today = startOfDay(now)

  const rel = text.match(/\bin\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?|weeks?|months?)\b/i)
  if (rel) {
    const n = +rel[1]
    const unit = rel[2].toLowerCase()
    const d = new Date(now)
    if (unit.startsWith('min')) d.setMinutes(d.getMinutes() + n)
    else if (unit.startsWith('h')) d.setHours(d.getHours() + n)
    else if (unit.startsWith('d')) d.setDate(d.getDate() + n)
    else if (unit.startsWith('w')) d.setDate(d.getDate() + n * 7)
    else d.setMonth(d.getMonth() + n)
    // Minute/hour offsets already carry a precise time — keep it.
    return { day: d, exact: unit.startsWith('min') || unit.startsWith('h'), match: rel[0] }
  }

  const named = [
    { re: /\btonight\b/i,               day: today, hour: EVENING_HOUR },
    { re: /\bthis evening\b/i,          day: today, hour: EVENING_HOUR },
    { re: /\btoday\b/i,                 day: today },
    { re: /\b(tomorrow|tmrw|tmr)\b/i,   day: new Date(today.getTime() + 864e5) },
    { re: /\bday after tomorrow\b/i,    day: new Date(today.getTime() + 2 * 864e5) },
    { re: /\bnext week\b/i,             day: new Date(today.getTime() + 7 * 864e5) },
    { re: /\bnext month\b/i,            day: (() => { const d = new Date(today); d.setMonth(d.getMonth() + 1); return d })() },
    { re: /\bweekend\b/i,               day: (() => { const d = new Date(today); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d })() },
  ]
  for (const n of named) {
    const m = text.match(n.re)
    if (m) return { day: n.day, hour: n.hour, match: m[0] }
  }

  const wd = text.match(/\b(?:on\s+|next\s+)?(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)\b/i)
  if (wd) {
    const target = WEEKDAYS[wd[1].toLowerCase()]
    const d = new Date(today)
    const delta = (target - d.getDay() + 7) % 7 || 7  // always the *next* one
    d.setDate(d.getDate() + delta)
    return { day: d, match: wd[0] }
  }

  // "on 5th", "on 23"
  const dom = text.match(/\bon\s+(\d{1,2})(?:st|nd|rd|th)?\b/i)
  if (dom) {
    const target = +dom[1]
    if (target >= 1 && target <= 31) {
      const d = new Date(today)
      d.setDate(target)
      if (d < today) d.setMonth(d.getMonth() + 1)
      return { day: d, match: dom[0] }
    }
  }

  return null
}

/** Pulls a currency amount: "₹450", "rs 450", "450rs", "$20", "2.5k". */
function extractAmount(text) {
  const m = text.match(/(?:₹|rs\.?\s?|inr\s?|\$)\s?(\d[\d,]*(?:\.\d+)?)\s?(k|l|lakh)?/i)
    || text.match(/\b(\d[\d,]*(?:\.\d+)?)\s?(k|rs\.?|rupees|inr)\b/i)
  if (!m) return null
  let value = parseFloat(m[1].replace(/,/g, ''))
  const suffix = (m[2] || '').toLowerCase()
  if (suffix === 'k') value *= 1000
  if (suffix === 'l' || suffix === 'lakh') value *= 100000
  return { amount: value, match: m[0] }
}

/**
 * Last resort for money buckets only: "kiran owes me 15000" has no symbol or
 * suffix, but in a debt line a bare number is the amount. Kept away from the
 * general path so "prayer 10 mins" never becomes ₹10.
 */
function extractBareAmount(text) {
  const m = text.match(/\b(\d{2,}(?:,\d{3})*(?:\.\d+)?)\b/)
  if (!m) return null
  return { amount: parseFloat(m[1].replace(/,/g, '')), match: m[0] }
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * @returns {{
 *   title: string, raw: string, destId: string, autoDest: boolean,
 *   remindAt: number|null, amount: number|null, chips: Array<{kind:string,label:string}>
 * }}
 */
export function parseCapture(raw, now = new Date()) {
  const text = (raw || '').trim()
  if (!text) {
    return { title: '', raw: '', destId: 'inbox', autoDest: false, remindAt: null, amount: null, chips: [] }
  }

  const strip = []
  const chips = []

  // ── When ──
  const dayHit = extractDay(text, now)
  const timeHit = extractTime(text)
  let remindAt = null
  if (dayHit || timeHit) {
    let base = dayHit ? dayHit.day : startOfDay(now)
    if (dayHit?.exact) {
      remindAt = base.getTime()
    } else if (timeHit) {
      remindAt = atTime(base, timeHit.hour, timeHit.minute).getTime()
      // "monday 8am" already passed today → the parser meant the next one.
      if (!dayHit && remindAt <= now.getTime()) remindAt += 864e5
    } else {
      remindAt = atTime(base, dayHit?.hour ?? DEFAULT_HOUR).getTime()
    }
    if (dayHit) strip.push(dayHit.match)
    if (timeHit) strip.push(timeHit.match)
    chips.push({ kind: 'time', label: formatRemind(remindAt) })
  }

  // ── How much ──
  let amountHit = extractAmount(text)

  // ── Where ──
  let destId = 'inbox'
  let autoDest = false
  for (const r of ROUTES) {
    if (r.re.test(text)) { destId = r.dest; autoDest = true; break }
  }
  // A bare "do X today" with no other signal belongs on Today, not the Inbox.
  if (!autoDest && /\b(today|tonight|now|asap)\b/i.test(text)) { destId = 'today'; autoDest = true }
  // An amount with no clearer home is an expense.
  if (!autoDest && amountHit) { destId = 'money'; autoDest = true }

  const moneyDest = MONEY_DESTS.has(destId)
  if (!amountHit && moneyDest) amountHit = extractBareAmount(text)
  // Outside the money buckets the figure stays in the title, where it is at
  // least visible — "rs 1200 groceries" shouldn't quietly lose its number.
  const amount = amountHit && moneyDest ? amountHit.amount : null
  if (amount != null) {
    strip.push(amountHit.match)
    chips.push({ kind: 'amount', label: `₹${amount.toLocaleString('en-IN')}` })
  }

  const dest = getDestination(destId)
  let category = dest.category
  for (const sub of SUB_CATEGORY[dest.type] || []) {
    if (sub.re.test(text)) { category = sub.category; break }
  }

  // ── Clean title ──
  let title = text
  for (const s of strip) title = title.replace(s, ' ')
  title = title
    .replace(/\s+/g, ' ')
    .replace(/^(remind me to|remind me|please|pls|todo:?|note:?)\s+/i, '')
    .replace(/\s+(on|at|by|in|for|to|of)\s*$/i, '')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()
  if (!title) title = text

  return {
    title: titleCase(title),
    raw: text,
    destId,
    category,
    autoDest,
    remindAt,
    amount,
    chips,
  }
}

export function formatRemind(ts) {
  const d = new Date(ts)
  const today = startOfDay(new Date())
  const days = Math.round((startOfDay(d) - today) / 864e5)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (days === 0) return `Today ${time}`
  if (days === 1) return `Tomorrow ${time}`
  if (days === -1) return `Yesterday ${time}`
  if (days > 1 && days < 7) return `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}
