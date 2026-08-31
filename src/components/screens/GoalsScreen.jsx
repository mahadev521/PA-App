import { useState } from 'react'
import { Plus, Trash2, X, Check, Target } from 'lucide-react'

const DIRECTIONS = [
  { id: 'god',     emoji: '🕊️', label: 'God',     color: '#fbbf24' },
  { id: 'health',  emoji: '💪',  label: 'Health',  color: '#06b6d4' },
  { id: 'wealth',  emoji: '💰',  label: 'Wealth',  color: '#10b981' },
  { id: 'family',  emoji: '❤️',  label: 'Family',  color: '#f472b6' },
  { id: 'pro',     emoji: '💼',  label: 'Work',    color: '#818cf8' },
  { id: 'general', emoji: '🎯',  label: 'General', color: '#94a3b8' },
]

function dirInfo(id) {
  return DIRECTIONS.find(d => d.id === id) || DIRECTIONS[5]
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const ms = new Date(dateStr + 'T00:00:00') - new Date(new Date().toDateString())
  return Math.round(ms / 86400000)
}

const emptyForm = { title: '', description: '', direction: 'general', horizon: 'short', target_date: '', milestones: [] }

export default function GoalsScreen({ goals, onSaveGoal, onDeleteGoal, onToggleMilestone }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [milestoneInput, setMilestoneInput] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const active = (goals || []).filter(g => g.status !== 'done' && g.status !== 'abandoned')
  const shortTerm = active.filter(g => g.horizon === 'short')
  const longTerm = active.filter(g => g.horizon === 'long')
  const done = (goals || []).filter(g => g.status === 'done')

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setMilestoneInput('')
    setShowForm(true)
  }

  function openEdit(goal) {
    setEditingId(goal.id)
    setForm({
      title: goal.title, description: goal.description || '', direction: goal.direction,
      horizon: goal.horizon, target_date: goal.target_date || '', milestones: goal.milestones || [],
    })
    setMilestoneInput('')
    setShowForm(true)
  }

  function addMilestone() {
    if (!milestoneInput.trim()) return
    setForm(f => ({ ...f, milestones: [...f.milestones, { id: `ms_${Date.now()}`, label: milestoneInput.trim(), done: false }] }))
    setMilestoneInput('')
  }

  function removeMilestone(id) {
    setForm(f => ({ ...f, milestones: f.milestones.filter(m => m.id !== id) }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    const existing = editingId ? goals.find(g => g.id === editingId) : null
    await onSaveGoal({
      id: editingId || undefined,
      title: form.title.trim(),
      description: form.description.trim(),
      direction: form.direction,
      horizon: form.horizon,
      target_date: form.target_date || null,
      milestones: form.milestones,
      status: existing?.status || 'active',
      created_at: existing?.created_at,
    })
    setShowForm(false)
    setForm(emptyForm)
    setEditingId(null)
  }

  async function markComplete(goal) {
    await onSaveGoal({ ...goal, status: 'done' })
  }

  function GoalCard({ goal }) {
    const dir = dirInfo(goal.direction)
    const milestones = goal.milestones || []
    const doneCount = milestones.filter(m => m.done).length
    const days = daysUntil(goal.target_date)
    const expanded = expandedId === goal.id

    return (
      <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-start gap-3">
          <button className="flex-1 text-left" onClick={() => setExpandedId(expanded ? null : goal.id)}>
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{dir.emoji}</span>
              <p className="text-sm font-semibold text-white/90 leading-snug">{goal.title}</p>
            </div>
            {milestones.length > 0 && (
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', maxWidth: 160 }}>
                <div className="h-full rounded-full" style={{ width: `${(doneCount / milestones.length) * 100}%`, background: dir.color }} />
              </div>
            )}
          </button>
          {days != null && (
            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{
                background: days < 0 ? 'rgba(244,63,94,0.15)' : days <= 14 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                color: days < 0 ? '#fb7185' : days <= 14 ? '#f59e0b' : 'rgba(255,255,255,0.5)',
              }}>
              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
            </span>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-2">
            {goal.description && <p className="text-xs text-gray-400">{goal.description}</p>}
            {milestones.map(m => (
              <button key={m.id} onClick={() => onToggleMilestone(goal.id, m.id)}
                className="flex items-center gap-2 w-full text-left">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.done ? '' : 'border-gray-500'}`}
                  style={m.done ? { background: dir.color, borderColor: dir.color } : {}}>
                  {m.done && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <span className={`text-xs ${m.done ? 'line-through text-gray-500' : 'text-gray-300'}`}>{m.label}</span>
              </button>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={() => openEdit(goal)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>Edit</button>
              <button onClick={() => markComplete(goal)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Mark Complete</button>
              <button onClick={() => onDeleteGoal(goal.id)} className="ml-auto"><Trash2 size={14} style={{ color: 'rgba(255,255,255,0.3)' }} /></button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-8 pt-3 space-y-4">
      <button onClick={openAdd} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus size={18} /> Add Goal
      </button>

      {showForm && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-title mb-0">{editingId ? 'Edit Goal' : 'New Goal'}</p>
            <button onClick={() => { setShowForm(false); setEditingId(null) }}>
              <X size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>

          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Goal title"
            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Why this matters (optional)" rows={2}
            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

          <div className="flex gap-1.5 flex-wrap">
            {DIRECTIONS.map(d => (
              <button key={d.id} onClick={() => setForm(f => ({ ...f, direction: d.id }))}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: form.direction === d.id ? `${d.color}33` : 'rgba(255,255,255,0.05)',
                  color: form.direction === d.id ? d.color : 'rgba(255,255,255,0.5)',
                  border: form.direction === d.id ? `1px solid ${d.color}55` : '1px solid transparent',
                }}>
                {d.emoji} {d.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {['short', 'long'].map(h => (
              <button key={h} onClick={() => setForm(f => ({ ...f, horizon: h }))}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: form.horizon === h ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
                  color: form.horizon === h ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                }}>
                {h === 'short' ? '🎯 Short-Term' : '🌅 Long-Term'}
              </button>
            ))}
          </div>

          <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
            className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

          <div>
            <p className="text-xs text-gray-400 mb-2">Milestones</p>
            <div className="space-y-1.5 mb-2">
              {form.milestones.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="flex-1 text-xs text-white/80">{m.label}</span>
                  <button onClick={() => removeMilestone(m.id)}><X size={13} style={{ color: 'rgba(255,255,255,0.3)' }} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={milestoneInput} onChange={e => setMilestoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                placeholder="Add a milestone…"
                className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={addMilestone} className="px-3 rounded-xl text-xs font-semibold text-white" style={{ background: 'rgba(124,58,237,0.85)' }}>Add</button>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full">{editingId ? 'Save Changes' : 'Add Goal'}</button>
        </div>
      )}

      {active.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-600 text-sm">
          <Target size={28} className="mx-auto mb-2 opacity-40" />
          No goals set yet — add one above ↑
        </div>
      )}

      {shortTerm.length > 0 && (
        <div className="space-y-2">
          <p className="section-title">🎯 Short-Term</p>
          <div className="space-y-2">{shortTerm.map(g => <GoalCard key={g.id} goal={g} />)}</div>
        </div>
      )}

      {longTerm.length > 0 && (
        <div className="space-y-2">
          <p className="section-title">🌅 Long-Term</p>
          <div className="space-y-2">{longTerm.map(g => <GoalCard key={g.id} goal={g} />)}</div>
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="section-title">✅ Completed ({done.length})</p>
          <div className="space-y-2">{done.map(g => <GoalCard key={g.id} goal={g} />)}</div>
        </div>
      )}
    </div>
  )
}
