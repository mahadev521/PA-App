// One index over every store, so anything ever captured stays findable.
// A second brain you can't query is just a landfill.

const UTILITY_META = {
  shopping:    { emoji: '🛒', label: 'Shopping'    },
  money:       { emoji: '💰', label: 'Money'       },
  people:      { emoji: '📞', label: 'Follow-ups'  },
  learning:    { emoji: '📚', label: 'Learning'    },
  maintenance: { emoji: '🔧', label: 'Maintenance' },
  travel:      { emoji: '🧳', label: 'Travel'      },
  decisions:   { emoji: '🧠', label: 'Decisions'   },
  lifeadmin:   { emoji: '🧹', label: 'Life Admin'  },
  fitness:     { emoji: '🏃', label: 'Fitness'     },
  spiritual:   { emoji: '✝️', label: 'Spiritual'   },
  debts:       { emoji: '🧾', label: 'Debts'       },
  today:       { emoji: '🗓️', label: 'Today'       },
}

function utilMeta(type) {
  return UTILITY_META[type] || { emoji: '📌', label: type || 'Item' }
}

function join(...parts) {
  return parts.filter(Boolean).join(' ')
}

/**
 * Flattens every store into search documents.
 * Each doc: { id, title, body, emoji, group, subtitle, ts, done, nav }
 * `nav` tells the app where to go: { tab, utility?, mode? }
 */
export function buildSearchIndex(data = {}) {
  const {
    backlog = [], utilityItems = [], experiences = [], goals = [],
    people = [], checklists = [], errandRuns = [], investments = [], entries = [],
  } = data

  const docs = []

  for (const i of backlog) {
    const status = i.status || (i.done ? 'done' : 'backlog')
    docs.push({
      id: `bl_${i.id}`,
      title: i.title || '',
      body: join(i.tag, status),
      emoji: status === 'today' ? '🔥' : '📥',
      group: status === 'today' ? 'Today' : 'Backlog',
      subtitle: join(i.tag && `#${i.tag}`, status !== 'backlog' && status),
      ts: i.created_at || 0,
      done: status === 'done',
      nav: { tab: 'utilities', utility: status === 'today' ? 'today' : 'backlog' },
    })
  }

  for (const i of utilityItems) {
    const meta = utilMeta(i.type)
    docs.push({
      id: `ui_${i.id}`,
      title: i.title || '',
      body: join(i.type, i.category, i.meta?.expected, i.meta?.outcome, i.meta?.options),
      emoji: meta.emoji,
      group: meta.label,
      subtitle: join(i.category, i.meta?.amount != null && `₹${Number(i.meta.amount).toLocaleString('en-IN')}`),
      ts: i.created_at || 0,
      done: !!i.done,
      nav: { tab: 'utilities', utility: i.type },
    })
  }

  for (const e of experiences) {
    docs.push({
      id: `exp_${e.id}`,
      title: e.title || '',
      body: join(e.context, e.lesson, e.tags, e.category),
      emoji: e.category === 'mistake' ? '⚠️' : '📖',
      group: 'Journal',
      subtitle: join(e.date, e.lesson && 'has a lesson'),
      ts: e.created_at || 0,
      nav: { tab: 'daily', mode: 'journal' },
    })
  }

  for (const g of goals) {
    docs.push({
      id: `goal_${g.id}`,
      title: g.title || '',
      body: join(g.description, g.direction, (g.milestones || []).map(m => m.label).join(' ')),
      emoji: '🎯',
      group: 'Goals',
      subtitle: join(g.horizon === 'long' ? 'long-term' : 'short-term', g.target_date && `by ${g.target_date}`),
      ts: g.created_at || 0,
      done: g.status === 'done',
      nav: { tab: 'life', mode: 'goals' },
    })
  }

  for (const p of people) {
    const events = p.events || []
    docs.push({
      id: `ppl_${p.id}`,
      title: p.name || '',
      body: join(p.relationship, p.notes, events.map(e => join(e.text, e.owed?.desc)).join(' ')),
      emoji: '🤝',
      group: 'People',
      subtitle: join(p.relationship, events.length && `${events.length} logged`),
      ts: p.created_at || 0,
      nav: { tab: 'utilities', utility: 'people-crm' },
    })
  }

  for (const c of checklists) {
    const items = c.items || []
    docs.push({
      id: `cl_${c.id}`,
      title: c.name || c.title || '',
      body: items.map(it => it.label || it.title || it.text || '').join(' '),
      emoji: '✅',
      group: 'Checklists',
      subtitle: items.length ? `${items.length} steps` : '',
      ts: c.created_at || 0,
      nav: { tab: 'utilities', utility: 'checklists' },
    })
  }

  for (const r of errandRuns) {
    const stops = r.stops || []
    docs.push({
      id: `er_${r.id}`,
      title: r.name || '',
      body: stops.map(s => join(s.name, s.note, (s.items || []).join(' '))).join(' '),
      emoji: '🚗',
      group: 'Errand Runs',
      subtitle: stops.length ? `${stops.length} stops` : '',
      ts: r.created_at || 0,
      done: !!r.completed,
      nav: { tab: 'utilities', utility: 'errand' },
    })
  }

  for (const inv of investments) {
    docs.push({
      id: `inv_${inv.id}`,
      title: inv.name || inv.title || '',
      body: join(inv.category, inv.notes, inv.platform),
      emoji: '📈',
      group: 'Portfolio',
      subtitle: inv.category || '',
      ts: inv.created_at || 0,
      nav: { tab: 'portfolio' },
    })
  }

  // Daily-log free text is where the most valuable memories hide —
  // "what was my big rock the week I burned out?" should be answerable.
  for (const e of entries) {
    if (e.big_rock?.trim()) {
      docs.push({
        id: `rock_${e.date}`,
        title: e.big_rock.trim(),
        body: `big rock ${e.date}`,
        emoji: '🎯',
        group: 'Big Rocks',
        subtitle: e.date,
        ts: new Date(e.date).getTime() || 0,
        nav: { tab: 'daily', mode: 'log', date: e.date },
      })
    }
    if (e.daily_win?.trim()) {
      docs.push({
        id: `win_${e.date}`,
        title: e.daily_win.trim(),
        body: `win ${e.date}`,
        emoji: '🏆',
        group: 'Wins',
        subtitle: e.date,
        ts: new Date(e.date).getTime() || 0,
        nav: { tab: 'daily', mode: 'log', date: e.date },
      })
    }
  }

  return docs
}

function scoreDoc(doc, terms, phrase) {
  const title = (doc.title || '').toLowerCase()
  const body = (doc.body || '').toLowerCase()
  if (!title && !body) return 0

  let score = 0
  if (title === phrase) score += 200
  else if (title.startsWith(phrase)) score += 120
  else if (title.includes(phrase)) score += 80
  else if (body.includes(phrase)) score += 30

  for (const t of terms) {
    if (title.includes(t)) score += title.startsWith(t) ? 30 : 20
    else if (body.includes(t)) score += 8
    else return 0   // every term must appear somewhere — AND, not OR
  }

  if (doc.done) score -= 25            // completed things rank below live ones
  score += Math.min(12, doc.ts ? (doc.ts / Date.now()) * 12 : 0)  // gentle recency nudge
  return score
}

export function searchIndex(docs, query, limit = 40) {
  const phrase = (query || '').trim().toLowerCase()
  if (phrase.length < 2) return []
  const terms = phrase.split(/\s+/).filter(Boolean)

  return docs
    .map(doc => ({ doc, score: scoreDoc(doc, terms, phrase) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || b.doc.ts - a.doc.ts)
    .slice(0, limit)
    .map(r => r.doc)
}

/** Groups ranked results by source, preserving rank order of the groups. */
export function groupResults(results) {
  const groups = []
  const byName = new Map()
  for (const doc of results) {
    let g = byName.get(doc.group)
    if (!g) {
      g = { name: doc.group, items: [] }
      byName.set(doc.group, g)
      groups.push(g)
    }
    g.items.push(doc)
  }
  return groups
}
