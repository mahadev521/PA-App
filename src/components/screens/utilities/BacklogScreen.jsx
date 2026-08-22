import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'

const TAGS = [
  { id: 'buy',      label: 'Buy',      emoji: '🛒' },
  { id: 'fix',      label: 'Fix',      emoji: '🔧' },
  { id: 'call',     label: 'Call',     emoji: '📞' },
  { id: 'message',  label: 'Message',  emoji: '💬' },
  { id: 'home',     label: 'Home',     emoji: '🏠' },
  { id: 'work',     label: 'Work',     emoji: '💼' },
  { id: 'finance',  label: 'Finance',  emoji: '💰' },
  { id: 'vehicle',  label: 'Vehicle',  emoji: '🚗' },
  { id: 'travel',   label: 'Travel',   emoji: '🧳' },
  { id: 'learn',    label: 'Learn',    emoji: '📚' },
  { id: 'fitness',  label: 'Fitness',  emoji: '🏸' },
  { id: 'family',   label: 'Family',   emoji: '👨‍👩‍👦' },
  { id: 'spiritual',label: 'Spiritual',emoji: '✝️' },
  { id: 'personal', label: 'Personal', emoji: '🧠' },
  { id: 'someday',  label: 'Someday',  emoji: '⚡' },
]

const STATUS = {
  backlog: { label: 'Backlog', color: 'rgba(255,255,255,0.4)',  bg: 'rgba(255,255,255,0.08)' },
  planned: { label: 'Planned', color: '#f59e0b',               bg: 'rgba(245,158,11,0.15)'  },
  today:   { label: 'Today',   color: '#a78bfa',               bg: 'rgba(124,58,237,0.2)'   },
  done:    { label: 'Done',    color: '#10b981',               bg: 'rgba(16,185,129,0.15)'  },
}
const STATUS_CYCLE = { backlog: 'planned', planned: 'today', today: 'done', done: 'backlog' }
const STATUS_ORDER = ['backlog', 'planned', 'today', 'done']

// Normalize legacy items that only have a `done` boolean
function getStatus(item) {
  if (item.status) return item.status
  return item.done ? 'done' : 'backlog'
}

export default function BacklogScreen({ backlog, onAdd, onDelete, onUpdateStatus }) {
  const [title, setTitle]         = useState('')
  const [tag, setTag]             = useState('buy')
  const [filterTag, setFilterTag] = useState('all')
  const [filterStatus, setFilterStatus] = useState('active') // 'active' | 'done' | 'all'

  function handleAdd() {
    if (!title.trim()) return
    onAdd(title.trim(), tag)
    setTitle('')
  }

  const items = (backlog || []).map(i => ({ ...i, _status: getStatus(i) }))

  const active = items.filter(i => i._status !== 'done')
  const done   = items.filter(i => i._status === 'done')

  const visibleItems = filterStatus === 'done'
    ? done
    : filterStatus === 'all'
    ? items
    : active

  const filtered = filterTag === 'all'
    ? visibleItems
    : visibleItems.filter(i => i.tag === filterTag)

  // Counts per tag (active only, for the filter bar)
  function tagCount(tagId) {
    return active.filter(i => i.tag === tagId).length
  }

  return (
    <div className="px-4 pb-32">
      {/* Add form */}
      <div
        className="mt-4 p-3 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-[11px] italic mb-2" style={{ color: 'rgba(167,139,250,0.7)' }}>
          If it's in your head, it's costing you focus. Get it out here.
        </p>
        {/* Tag picker */}
        <div className="flex gap-1.5 flex-wrap mb-2.5">
          {TAGS.map(t => (
            <button
              key={t.id}
              onClick={() => setTag(t.id)}
              className="px-2 py-1 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tag === t.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
                color:      tag === t.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                border:     tag === t.id ? '1px solid rgba(167,139,250,0.35)' : '1px solid transparent',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2"
          style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Capture anything — don't let it stay in your head…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-3"
          />
          <button
            onClick={handleAdd}
            className="px-4 text-sm font-semibold text-white flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.85)' }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mt-3">
        {[['active', `Active (${active.length})`], ['done', `Done (${done.length})`], ['all', 'All']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filterStatus === val ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
              color:      filterStatus === val ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Tag filter scroll */}
      <div className="flex gap-2 mt-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterTag('all')}
          className="px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
          style={{
            background: filterTag === 'all' ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
            color:      filterTag === 'all' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
          }}
        >
          All
        </button>
        {TAGS.map(t => {
          const cnt = tagCount(t.id)
          return (
            <button
              key={t.id}
              onClick={() => setFilterTag(t.id)}
              className="px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: filterTag === t.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
                color:      filterTag === t.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              }}
            >
              {t.emoji}{cnt > 0 ? ` ${cnt}` : ''}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          {filterStatus === 'active' ? 'All clear — add something above ↑' : 'Nothing here.'}
        </div>
      )}

      {/* Items grouped by status */}
      {filterStatus !== 'done' && STATUS_ORDER.filter(s => s !== 'done').map(status => {
        const group = filtered.filter(i => i._status === status)
        if (group.length === 0) return null
        const st = STATUS[status]
        return (
          <div key={status} className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: st.color }}>
              {st.label} ({group.length})
            </p>
            <div className="flex flex-col gap-2">
              {group.sort((a, b) => b.created_at - a.created_at).map(item => (
                <BacklogItem key={item.id} item={item} st={st} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Done items (flat list) */}
      {filterStatus === 'done' && (
        <div className="flex flex-col gap-2">
          {filtered.sort((a, b) => b.created_at - a.created_at).map(item => {
            const st = STATUS['done']
            return <BacklogItem key={item.id} item={item} st={st} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
          })}
        </div>
      )}
    </div>
  )
}

function BacklogItem({ item, st, onUpdateStatus, onDelete }) {
  const tagInfo = TAGS.find(t => t.id === item.tag) || TAGS[0]
  const isDone  = item._status === 'done'
  const nextStatus = STATUS_CYCLE[item._status]
  const nextSt     = STATUS[nextStatus]

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{
        background: isDone ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.07)',
        opacity: isDone ? 0.55 : 1,
      }}
    >
      {/* Status cycle button */}
      <button
        onClick={() => onUpdateStatus(item.id, nextStatus)}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          borderColor: isDone ? '#a78bfa' : 'rgba(255,255,255,0.3)',
          background:  isDone ? 'rgba(124,58,237,0.4)' : 'transparent',
        }}
        title={`Move to: ${nextSt.label}`}
      >
        {isDone && <Check size={10} color="#a78bfa" strokeWidth={3} />}
      </button>

      {/* Tag emoji */}
      <span className="text-base leading-none flex-shrink-0">{tagInfo.emoji}</span>

      {/* Title */}
      <span
        className="flex-1 text-sm leading-snug"
        style={{
          color:          isDone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)',
          textDecoration: isDone ? 'line-through' : 'none',
        }}
      >
        {item.title}
      </span>

      {/* Status badge — tapping promotes to next stage */}
      {!isDone && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {item._status !== 'today' && (
            <button
              onClick={() => onUpdateStatus(item.id, 'today')}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}
              title="Move to Today"
            >
              → Today
            </button>
          )}
          <button
            onClick={() => onUpdateStatus(item.id, nextStatus)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all"
            style={{ background: st.bg, color: st.color }}
            title={`Promote → ${nextSt.label}`}
          >
            {st.label} →
          </button>
        </div>
      )}

      {/* Delete */}
      <button onClick={() => onDelete(item.id)} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
        <Trash2 size={14} />
      </button>
    </div>
  )
}
