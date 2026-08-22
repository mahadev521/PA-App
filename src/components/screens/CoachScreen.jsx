import { useState, useMemo } from 'react'
import { Search, Lightbulb, Tag, Brain, AlertTriangle, BarChart2, ListChecks, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { getQueryDataPattern } from '../../utils/analytics'

// ─── Tokenizer ───────────────────────────────────────────────────

const STOP = new Set(['i','me','my','to','a','an','the','is','are','was','were','will','be','have','has','do','does','in','on','at','for','and','or','but','with','from','of','this','that','am','going','want','plan','it','can','should','would','could','need','how','what','when','why','which'])

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9₹\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w))
}

// ─── Experience scorer ───────────────────────────────────────────

const CAT_KEYWORDS = {
  god:     ['prayer','god','spirit','spiritual','bible','church','faith','scripture','meditation'],
  health:  ['health','fitness','workout','diet','sleep','water','exercise','body','weight'],
  wealth:  ['money','finance','invest','save','spend','scam','fraud','debt','rupee','bank','salary'],
  family:  ['family','parents','wife','husband','kids','children','home','relationship'],
  pro:     ['work','job','career','learn','study','code','project','focus','office','task'],
  travel:  ['travel','trip','hyderabad','bangalore','mumbai','flight','train','hotel','pack','luggage'],
  mistake: ['scam','fraud','mistake','wrong','regret','fail','warn','loss'],
}

function scoreMatch(exp, tokens) {
  let score = 0
  const tags = exp.tags ? exp.tags.split(',').map(t => t.trim().toLowerCase()) : []
  for (const t of tokens) {
    if (tags.some(tag => tag.includes(t))) score += 5
    if (exp.title?.toLowerCase().includes(t)) score += 3
    if (exp.lesson?.toLowerCase().includes(t)) score += 2
    if (exp.context?.toLowerCase().includes(t)) score += 1
    for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
      if (kws.includes(t)) {
        if (exp.category === cat) score += 4
        else score += 1
      }
    }
  }
  // Impact only used for tie-breaking within real matches — NOT as a base score
  return score > 0 ? score + (exp.impact || 5) * 0.05 : 0
}

// ─── Lesson extractor ────────────────────────────────────────────

function extractChecklist(experiences) {
  const items = []
  for (const exp of experiences) {
    if (!exp.lesson) continue
    const numbered = exp.lesson.match(/\d+\.\s+[^\n]+/g)
    if (numbered?.length >= 2) { items.push(...numbered.map(s => s.replace(/^\d+\.\s+/, ''))); continue }
    const bulleted = exp.lesson.split('\n').filter(l => /^[-•*]/.test(l.trim()))
    if (bulleted.length >= 2) { items.push(...bulleted.map(s => s.replace(/^[-•*]\s*/, '').trim())); continue }
    const parts = exp.lesson.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 8)
    if (parts.length >= 3) { items.push(...parts); continue }
    if (exp.lesson.length > 10) items.push(exp.lesson)
  }
  // Dedupe and cap
  return [...new Set(items)].slice(0, 8)
}

// ─── Coach response generator ────────────────────────────────────

function buildCoachResponse(query, experiences, entries) {
  const tokens = tokenize(query)
  const matched = experiences
    .map(exp => ({ exp, score: scoreMatch(exp, tokens) }))
    .filter(({ score }) => score >= 2)  // requires at least 1 real keyword match
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ exp }) => exp)

  const dataPattern = entries.length >= 3 ? getQueryDataPattern(entries, tokens) : null
  const warnings = matched.filter(e => e.category === 'mistake' || (e.impact || 0) >= 7)
  const checklist = extractChecklist(matched)

  // Build the advice paragraph (the "AI voice")
  let advice = ''
  if (!matched.length && !dataPattern) {
    advice = "I don't have enough in your log yet about this. Every experience you log — wins, mistakes, lessons — trains your coach. Come back after you've captured a few entries on this topic."
  } else {
    const parts = []
    if (warnings.length > 0) {
      parts.push(`You have ${warnings.length} high-impact ${warnings.length === 1 ? 'experience' : 'experiences'} relevant to this — your past self is warning you. Study the checklist below carefully.`)
    } else if (matched.length > 0) {
      parts.push(`You have ${matched.length} relevant ${matched.length === 1 ? 'experience' : 'experiences'} in your log that speak to this.`)
    }
    if (dataPattern) {
      parts.push(dataPattern.text)
    }
    if (!parts.length && matched.length > 0) {
      parts.push(`Your past self has already learned something here. The lessons below are yours — not borrowed from a book, but earned through living.`)
    }
    advice = parts.join(' ')
  }

  return { matched, dataPattern, warnings, checklist, advice }
}

// ─── Quick prompts ───────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: '✈️ Travel', query: 'travel trip packing plan' },
  { label: '💰 Money', query: 'money invest spend finance wealth' },
  { label: '😴 Sleep', query: 'sleep tired rest energy recovery' },
  { label: '🔥 Focus', query: 'focus deep work productive distraction' },
  { label: '❤️ Family', query: 'family relationship time connection' },
  { label: '💼 Work', query: 'work career professional growth learning' },
  { label: '🙏 God', query: 'god prayer spirit faith devotion' },
  { label: '⚠️ Mistakes', query: 'mistake regret wrong scam lesson' },
]

// ─── Thinking animation ──────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Brain size={16} className="text-sky" />
      <div className="flex gap-1.5">
        <div className="thinking-dot" />
        <div className="thinking-dot" />
        <div className="thinking-dot" />
      </div>
      <span className="text-xs text-gray-500">Searching your second brain...</span>
    </div>
  )
}

// ─── Response Sections ───────────────────────────────────────────

function ExperienceCard({ exp }) {
  const [open, setOpen] = useState(false)
  const catEmoji = { god:'🕊️', health:'💪', wealth:'💰', family:'❤️', pro:'💼', travel:'✈️', mistake:'⚠️', insight:'💡' }[exp.category] || '💡'
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${exp.category === 'mistake' ? 'border-rose/25' : 'border-border'} bg-elevated`}>
      <button className="flex items-center gap-3 w-full p-3" onClick={() => setOpen(o => !o)}>
        <span className="text-base flex-shrink-0">{catEmoji}</span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">{exp.title}</p>
          {exp.impact >= 7 && <span className="text-[10px] text-rose font-medium">⚠️ High impact</span>}
        </div>
        {open ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
      </button>
      {open && exp.lesson && (
        <div className="px-3 pb-3 border-t border-border pt-2">
          <p className="text-[10px] text-accent uppercase tracking-wide mb-1">💡 Lesson</p>
          <p className="text-xs text-gray-200 leading-relaxed">{exp.lesson}</p>
        </div>
      )}
    </div>
  )
}

// ─── Screen ──────────────────────────────────────────────────────

export default function CoachScreen({ experiences, entries, embedded }) {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [thinking, setThinking] = useState(false)
  const [response, setResponse] = useState(null)

  function ask(q) {
    if (!q.trim()) return
    setQuery(q)
    setSubmitted(q)
    setResponse(null)
    setThinking(true)
    // Simulate analysis delay for the "AI" feel
    setTimeout(() => {
      setResponse(buildCoachResponse(q, experiences, entries || []))
      setThinking(false)
    }, 900)
  }

  const rootClass = embedded
    ? 'px-4 pb-24 space-y-5 animate-fade-in'
    : 'screen space-y-5 animate-fade-in'

  return (
    <div className={rootClass}>
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain size={20} className="text-sky" /> Your Coach
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Fine-tuned on your own experiences. The more you log, the smarter it gets.</p>
      </div>

      {/* Input */}
      <div className="card-elevated space-y-3">
        <textarea
          rows={3}
          placeholder="Ask anything... 'I want to travel to Hyderabad' / 'How do I wake up early?' / 'What mistakes should I avoid with money?'"
          value={query}
          onChange={e => { setQuery(e.target.value); setResponse(null) }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(query) } }}
          className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-sky resize-none"
        />
        <button
          onClick={() => ask(query)}
          disabled={!query.trim() || thinking}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97] ${
            !query.trim() || thinking ? 'opacity-40 bg-sky/20 text-sky' : 'bg-sky/20 border border-sky/30 text-sky hover:bg-sky/30'
          }`}
        >
          <Sparkles size={15} /> Ask Your Second Brain
        </button>
      </div>

      {/* Quick prompts */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Quick prompts</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_PROMPTS.map(p => (
            <button key={p.label} onClick={() => ask(p.query)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-elevated text-xs text-gray-300 border border-border active:bg-border transition-all">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thinking */}
      {thinking && (
        <div className="card-coach animate-fade-in">
          <ThinkingDots />
        </div>
      )}

      {/* Response */}
      {response && !thinking && (
        <div className="space-y-4 animate-fade-in">
          {/* Coach's take */}
          <div className="card-coach">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sky/20 border border-sky/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain size={14} className="text-sky" />
              </div>
              <div>
                <p className="text-[10px] text-sky font-semibold uppercase tracking-wider mb-2">Coach's Take</p>
                <p className="text-sm text-gray-100 leading-relaxed">{response.advice}</p>
              </div>
            </div>
          </div>

          {/* Data from your logs */}
          {response.dataPattern && (
            <div className="card border border-accent/20">
              <div className="flex items-start gap-2">
                <BarChart2 size={14} className="text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-accent font-semibold uppercase tracking-wider mb-1">Your Data Says</p>
                  <p className="text-sm text-gray-200">{response.dataPattern.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {response.warnings.length > 0 && (
            <div className="card border border-rose/20 bg-rose/5">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle size={14} className="text-rose mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-rose font-semibold uppercase tracking-wider">
                  {response.warnings.length} Warning{response.warnings.length > 1 ? 's' : ''} from Your Log
                </p>
              </div>
              <div className="space-y-2">
                {response.warnings.map(exp => <ExperienceCard key={exp.id} exp={exp} />)}
              </div>
            </div>
          )}

          {/* Checklist from lessons */}
          {response.checklist.length > 0 && (
            <div className="card border border-emerald/20">
              <div className="flex items-start gap-2 mb-3">
                <ListChecks size={14} className="text-emerald mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-emerald font-semibold uppercase tracking-wider">Your Personal Checklist</p>
              </div>
              <div className="space-y-2">
                {response.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded border border-emerald/40 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-200 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other matching experiences */}
          {response.matched.filter(e => !response.warnings.includes(e)).length > 0 && (
            <div className="card">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-3">
                📖 Related Experiences ({response.matched.filter(e => !response.warnings.includes(e)).length})
              </p>
              <div className="space-y-2">
                {response.matched.filter(e => !response.warnings.includes(e)).map(exp => (
                  <ExperienceCard key={exp.id} exp={exp} />
                ))}
              </div>
            </div>
          )}

          {!response.matched.length && !response.dataPattern && (
            <div className="card flex flex-col items-center gap-3 py-8">
              <Lightbulb size={28} className="text-gray-600" />
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                No matching entries yet. Go to <strong className="text-white">Journal → Add</strong> and log your experiences — wins, mistakes, lessons, travel tips, money events. Your Coach gets smarter with every entry.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!submitted && experiences.length === 0 && (
        <div className="card border border-dashed border-border flex flex-col items-center gap-3 py-10">
          <span className="text-4xl">🧠</span>
          <p className="text-gray-400 text-sm text-center leading-relaxed">
            Your second brain is empty. Start by logging experiences in <strong className="text-white">Journal</strong> — every lesson you capture becomes fuel for your coach.
          </p>
          <p className="text-[11px] text-gray-500 text-center max-w-[260px]">
            "Pain + Reflection = Progress." — Ray Dalio
          </p>
        </div>
      )}
    </div>
  )
}
