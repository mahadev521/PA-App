import { useState, useMemo } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X, Check } from 'lucide-react'
import { format } from 'date-fns'

const CATEGORIES = [
  { key: 'god',      label: 'God & Spirit',   emoji: '🕊️' },
  { key: 'health',   label: 'Health',          emoji: '💪' },
  { key: 'wealth',   label: 'Wealth',          emoji: '💰' },
  { key: 'family',   label: 'Family',          emoji: '❤️' },
  { key: 'pro',      label: 'Professional',    emoji: '💼' },
  { key: 'travel',   label: 'Travel',          emoji: '✈️' },
  { key: 'mistake',  label: 'Mistake/Warning', emoji: '⚠️' },
  { key: 'insight',  label: 'Life Insight',    emoji: '💡' },
]

const CAT_FILTERS = [{ key: 'all', label: 'All', emoji: '📋' }, ...CATEGORIES]

const EMPTY_FORM = {
  title: '',
  context: '',
  lesson: '',
  tags: '',
  category: 'insight',
  impact: 5,
}

function ImpactDots({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} onClick={() => onChange(n)}
          className={`flex-1 h-6 rounded-md text-[10px] font-bold transition-all ${
            value >= n
              ? n <= 3 ? 'bg-rose' : n <= 6 ? 'bg-gold' : 'bg-emerald'
              : 'bg-border text-gray-500'
          } text-black`}>{n}</button>
      ))}
    </div>
  )
}

function ExpCard({ exp, onDelete }) {
  const [open, setOpen] = useState(false)
  const cat = CATEGORIES.find(c => c.key === exp.category) || CATEGORIES[7]
  const tags = exp.tags ? exp.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const impactColor = exp.impact >= 8 ? 'text-rose' : exp.impact >= 5 ? 'text-gold' : 'text-gray-400'

  return (
    <div className={`card border ${exp.category === 'mistake' ? 'border-rose/20' : 'border-border'} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setOpen(o => !o)} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-base">{cat.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{exp.title}</p>
              <p className="text-[10px] text-gray-500">
                {exp.date ? format(new Date(exp.date + 'T12:00:00'), 'MMM d, yyyy') : ''}
                {' · '}
                <span className={impactColor}>Impact {exp.impact}/10</span>
              </p>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {open ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          <button onClick={() => onDelete(exp.id)} className="p-1 rounded-lg text-gray-600 active:text-rose">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-2 pt-1 border-t border-border">
          {exp.context && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">What happened</p>
              <p className="text-sm text-gray-300">{exp.context}</p>
            </div>
          )}
          {exp.lesson && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-2.5">
              <p className="text-[10px] text-accent uppercase tracking-wide mb-0.5">💡 Lesson</p>
              <p className="text-sm text-gray-200">{exp.lesson}</p>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span key={t} className="text-[10px] bg-elevated border border-border text-gray-400 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddForm({ onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const today = new Date().toISOString().slice(0, 10)

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  function handleSave() {
    if (!form.title.trim()) return
    onSave({ ...form, date: today })
    onClose()
  }

  const cat = CATEGORIES.find(c => c.key === form.category)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base animate-slide-up" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-white">New Experience</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={!form.title.trim()}
            className={`btn-primary px-4 py-1.5 text-sm ${!form.title.trim() ? 'opacity-40' : ''}`}>
            <Check size={14} className="inline mr-1" />Save
          </button>
          <button onClick={onClose} className="p-2 rounded-xl bg-elevated">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Title *</label>
          <input type="text" placeholder="e.g. Got scammed for ₹1500 online"
            value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => set('category', c.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  form.category === c.key ? 'bg-accent/20 border-accent text-white' : 'bg-elevated border-border text-gray-400'
                }`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">What happened</label>
          <textarea rows={3} placeholder="Describe what occurred..."
            value={form.context} onChange={e => set('context', e.target.value)}
            className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent resize-none" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Lesson learned</label>
          <textarea rows={3} placeholder="What will you do differently? You can use bullet points or numbered list."
            value={form.lesson} onChange={e => set('lesson', e.target.value)}
            className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent resize-none" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Tags (comma separated)</label>
          <input type="text" placeholder="e.g. travel, packing, hyderabad"
            value={form.tags} onChange={e => set('tags', e.target.value)}
            className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">Impact on your life</label>
            <span className="text-sm font-bold text-white">{form.impact}/10</span>
          </div>
          <ImpactDots value={form.impact} onChange={v => set('impact', v)} />
        </div>
      </div>
    </div>
  )
}

export default function ExperienceScreen({ experiences, onAdd, onDelete, embedded }) {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = [...experiences].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    if (catFilter !== 'all') list = list.filter(e => e.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.context?.toLowerCase().includes(q) ||
        e.lesson?.toLowerCase().includes(q) ||
        e.tags?.toLowerCase().includes(q)
      )
    }
    return list
  }, [experiences, catFilter, search])

  return (
    <div
      className={embedded ? 'px-4 pb-24 space-y-4 animate-fade-in' : 'screen space-y-4 animate-fade-in'}
      style={embedded ? { paddingTop: '1.25rem', paddingBottom: '2rem' } : {}}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Experience Log</h1>
          <p className="text-xs text-gray-400">{experiences.length} entries</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Search experiences..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-elevated rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent" />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CAT_FILTERS.map(f => (
          <button key={f.key} onClick={() => setCatFilter(f.key)}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              catFilter === f.key ? 'bg-accent text-white' : 'bg-elevated text-gray-400'
            }`}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <span className="text-4xl">📖</span>
          <p className="text-gray-400 text-sm text-center">
            {experiences.length === 0
              ? 'No experiences yet. Start logging what you learn.'
              : 'No matches found.'}
          </p>
          {experiences.length === 0 && (
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2">
              Log first experience
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(exp => (
            <ExpCard key={exp.id} exp={exp} onDelete={onDelete} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddForm onSave={onAdd} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}
