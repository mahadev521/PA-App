import { useState, useEffect } from 'react'
import { Check, Plus, Trash2, RefreshCw, ChevronLeft, ChevronUp, ChevronDown, RotateCcw, X } from 'lucide-react'

// ─── Built-in checklist templates ────────────────────────────────

const DEFAULT_CHECKLISTS = [
  {
    id: 'cl_travel_pre',
    emoji: '✈️',
    title: 'Travel Pre-Trip',
    desc: 'Before you leave for the airport',
    isDefault: true,
    items: [
      { id: 'tp_passport',    label: 'Passport / ID ready' },
      { id: 'tp_tickets',     label: 'Tickets / boarding pass downloaded' },
      { id: 'tp_hotel',       label: 'Hotel booking confirmed' },
      { id: 'tp_cab',         label: 'Cab / transport to airport booked' },
      { id: 'tp_forex',       label: 'Forex / cash organized' },
      { id: 'tp_chargers',    label: 'Phone & laptop chargers packed' },
      { id: 'tp_clothes',     label: 'Clothes packed (check weather)' },
      { id: 'tp_medicines',   label: 'Medicines / travel kit packed' },
      { id: 'tp_powerbank',   label: 'Power bank charged & packed' },
      { id: 'tp_earphones',   label: 'Earphones packed' },
      { id: 'tp_snacks',      label: 'Snacks for the journey' },
      { id: 'tp_locks',       label: 'Home locked & AC/appliances off' },
      { id: 'tp_notify',      label: 'Someone knows you\'re traveling' },
      { id: 'tp_insurance',   label: 'Travel insurance (if international)' },
    ],
  },
  {
    id: 'cl_work_start',
    emoji: '🚀',
    title: 'Work Session Start',
    desc: 'Before you begin deep work',
    isDefault: true,
    items: [
      { id: 'ws_phone',     label: 'Phone on silent / DND' },
      { id: 'ws_outcome',   label: 'Written: ONE outcome this session produces' },
      { id: 'ws_desk',      label: 'Desk clear / tabs closed' },
      { id: 'ws_water',     label: 'Water within reach' },
      { id: 'ws_headphones',label: 'Headphones on' },
      { id: 'ws_timer',     label: 'Timer set (25–90 min)' },
      { id: 'ws_email',     label: 'Email closed' },
      { id: 'ws_frog',      label: 'Starting with the hardest sub-task' },
    ],
  },
  {
    id: 'cl_work_end',
    emoji: '🔐',
    title: 'Work Session End',
    desc: 'Shutdown ritual — clear the mind',
    isDefault: true,
    items: [
      { id: 'we_accomplished', label: 'Reviewed what was accomplished' },
      { id: 'we_openloops',    label: 'All open loops captured (written down)' },
      { id: 'we_tomorrow',     label: 'Tomorrow\'s ONE Big Rock written' },
      { id: 'we_inbox',        label: 'Final inbox check done' },
      { id: 'we_desk',         label: 'Workspace cleared' },
      { id: 'we_shutdown',     label: 'Said out loud: "Shutdown complete."' },
    ],
  },
  {
    id: 'cl_leaving_home',
    emoji: '🏠',
    title: 'Leaving Home',
    desc: 'Quick check before stepping out',
    isDefault: true,
    items: [
      { id: 'lh_phone',    label: 'Phone' },
      { id: 'lh_wallet',   label: 'Wallet / UPI ready' },
      { id: 'lh_keys',     label: 'Keys' },
      { id: 'lh_locked',   label: 'Door locked' },
      { id: 'lh_water',    label: 'Water bottle' },
      { id: 'lh_ac',       label: 'AC / fans off' },
      { id: 'lh_charger',  label: 'Phone charged enough' },
      { id: 'lh_errand',   label: 'Errands list checked' },
    ],
  },
  {
    id: 'cl_gym_bag',
    emoji: '🏋️',
    title: 'Gym / Sports Bag',
    desc: 'Before heading to the gym or court',
    isDefault: true,
    items: [
      { id: 'gb_shoes',     label: 'Sports shoes' },
      { id: 'gb_clothes',   label: 'Workout clothes' },
      { id: 'gb_water',     label: 'Water bottle (full)' },
      { id: 'gb_towel',     label: 'Towel' },
      { id: 'gb_earphones', label: 'Earphones / music ready' },
      { id: 'gb_phone',     label: 'Phone charged' },
      { id: 'gb_racket',    label: 'Racket / equipment (if sport)' },
      { id: 'gb_snack',     label: 'Post-workout snack / protein' },
    ],
  },
  {
    id: 'cl_weekly_review',
    emoji: '📋',
    title: 'Weekly Review',
    desc: 'Sunday / weekend planning session',
    isDefault: true,
    items: [
      { id: 'wr_brain_dump',  label: 'Brain dump — everything on my mind written' },
      { id: 'wr_last_week',   label: 'Last week reviewed: wins + misses' },
      { id: 'wr_goals',       label: 'Annual goals reviewed — on track?' },
      { id: 'wr_next_rocks',  label: 'Next week\'s 3 Big Rocks decided' },
      { id: 'wr_calendar',    label: 'Next week\'s calendar checked' },
      { id: 'wr_backlog',     label: 'Backlog processed / pruned' },
      { id: 'wr_finance',     label: 'Spending & savings checked' },
      { id: 'wr_people',      label: 'Follow-ups / relationships checked' },
      { id: 'wr_health',      label: 'Health & fitness plan for next week' },
    ],
  },
]

// ─── Merge defaults with saved state ─────────────────────────────

function mergeWithSaved(saved) {
  const savedMap = Object.fromEntries(saved.map(c => [c.id, c]))
  const defaults = DEFAULT_CHECKLISTS.map(def => {
    const existing = savedMap[def.id]
    if (!existing) {
      // First load: init from template, record canonical order
      const items = def.items.map(i => ({ ...i, checked: false }))
      return { ...def, items, baseOrder: items.map(i => i.id) }
    }
    // Use saved items as-is so user deletions / additions / reorders persist
    const items = existing.items || def.items.map(i => ({ ...i, checked: false }))
    const baseOrder = existing.baseOrder || items.map(i => i.id)
    return { ...def, items, baseOrder }
  })
  const defaultIds = new Set(DEFAULT_CHECKLISTS.map(d => d.id))
  const custom = saved.filter(c => !defaultIds.has(c.id)).map(c => ({
    ...c,
    baseOrder: c.baseOrder || (c.items || []).map(i => i.id),
  }))
  return [...defaults, ...custom]
}

// ─── Checklist Hub ────────────────────────────────────────────────

function ChecklistHub({ checklists, onSelect, onNew }) {
  return (
    <div className="px-4 pb-8 pt-3">
      <p className="text-xs text-gray-500 mb-4">
        Reusable checklists — check items off, then reset for next time.
      </p>
      <div className="flex flex-col gap-3">
        {checklists.map(cl => {
          const total   = cl.items.length
          const done    = cl.items.filter(i => i.checked).length
          const allDone = done === total && total > 0
          const pct     = total ? Math.round((done / total) * 100) : 0
          return (
            <button
              key={cl.id}
              onClick={() => onSelect(cl)}
              className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: allDone ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-2xl flex-shrink-0 leading-none">{cl.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-white leading-tight">{cl.title}</p>
                  <span className={`text-xs font-bold ml-2 flex-shrink-0 ${allDone ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {done}/{total}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: allDone ? '#10b981' : '#7c3aed' }}
                  />
                </div>
                {cl.desc && <p className="text-[11px] text-gray-500 mt-1 leading-tight">{cl.desc}</p>}
              </div>
            </button>
          )
        })}
      </div>

      {/* New checklist */}
      <button
        onClick={onNew}
        className="mt-4 w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
        style={{ background: 'rgba(124,58,237,0.15)', border: '1px dashed rgba(167,139,250,0.3)', color: '#a78bfa' }}
      >
        <Plus size={16} />
        New Checklist
      </button>
    </div>
  )
}

// ─── Single Checklist Detail ──────────────────────────────────────

function ChecklistDetail({ checklist, onUpdate, onDelete, onBack }) {
  const [items, setItems]               = useState(checklist.items || [])
  const [baseOrder, setBaseOrder]       = useState(
    () => checklist.baseOrder || (checklist.items || []).map(i => i.id)
  )
  const [newItemLabel, setNewItemLabel] = useState('')
  const [showAddItem, setShowAddItem]   = useState(false)

  const done    = items.filter(i => i.checked).length
  const total   = items.length
  const allDone = done === total && total > 0
  const pct     = total ? Math.round((done / total) * 100) : 0

  function persist(newItems, newBase) {
    setItems(newItems)
    setBaseOrder(newBase)
    onUpdate({ ...checklist, items: newItems, baseOrder: newBase })
  }

  function toggleItem(itemId) {
    const updated = items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
    setItems(updated)
    onUpdate({ ...checklist, items: updated, baseOrder })
  }

  function resetAll() {
    // Uncheck all and restore the stored base order
    const itemMap = Object.fromEntries(items.map(i => [i.id, i]))
    const reordered = baseOrder
      .filter(id => itemMap[id])
      .map(id => ({ ...itemMap[id], checked: false }))
    setItems(reordered)
    onUpdate({ ...checklist, items: reordered, baseOrder })
  }

  function addItem() {
    if (!newItemLabel.trim()) return
    const newItem = { id: `item_${Date.now()}`, label: newItemLabel.trim(), checked: false }
    const newItems = [...items, newItem]
    const newBase  = [...baseOrder, newItem.id]
    persist(newItems, newBase)
    setNewItemLabel('')
    setShowAddItem(false)
  }

  function deleteItem(itemId) {
    persist(items.filter(i => i.id !== itemId), baseOrder.filter(id => id !== itemId))
  }

  function moveItem(itemId, direction) {
    const idx = items.findIndex(i => i.id === itemId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === items.length - 1) return
    const next = [...items]
    const swap = direction === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    persist(next, next.map(i => i.id))
  }

  return (
    <div className="px-4 pb-8 pt-2">
      {/* Progress bar */}
      <div className="mb-4 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Progress</span>
          <span className={`text-sm font-bold ${allDone ? 'text-emerald-400' : 'text-violet-400'}`}>{pct}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: allDone ? '#10b981' : '#7c3aed' }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1.5">
          <span>{done} done</span><span>{total - done} remaining</span>
        </div>
      </div>

      {allDone && (
        <div className="mb-3 p-3 rounded-2xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-emerald-400 font-bold text-sm">✅ All done! Ready to reset for next time.</p>
        </div>
      )}

      {/* Items */}
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
            style={{
              background: item.checked ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.05)',
              border: item.checked ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleItem(item.id)}
              className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: item.checked ? '#10b981' : 'rgba(255,255,255,0.3)',
                background: item.checked ? 'rgba(16,185,129,0.2)' : 'transparent',
              }}
            >
              {item.checked && <Check size={12} color="#10b981" strokeWidth={3} />}
            </button>

            {/* Label */}
            <span className={`flex-1 text-sm leading-snug ${item.checked ? 'line-through text-gray-500' : 'text-white'}`}>
              {item.label}
            </span>

            {/* Move up / down */}
            <div className="flex flex-col gap-px flex-shrink-0">
              <button
                onClick={() => moveItem(item.id, 'up')}
                className="w-5 h-5 flex items-center justify-center rounded transition-all active:scale-90"
                style={{ color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.38)' }}
              >
                <ChevronUp size={13} />
              </button>
              <button
                onClick={() => moveItem(item.id, 'down')}
                className="w-5 h-5 flex items-center justify-center rounded transition-all active:scale-90"
                style={{ color: idx === items.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.38)' }}
              >
                <ChevronDown size={13} />
              </button>
            </div>

            {/* Delete — available on all items */}
            <button
              onClick={() => deleteItem(item.id)}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-xl transition-all active:scale-90"
              style={{ color: 'rgba(244,63,94,0.45)' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      {showAddItem ? (
        <div className="mt-3 flex gap-2"
          style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
          <input
            autoFocus
            value={newItemLabel}
            onChange={e => setNewItemLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setShowAddItem(false) }}
            placeholder="New item…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-3"
          />
          <button onClick={() => setShowAddItem(false)} className="px-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <X size={16} />
          </button>
          <button onClick={addItem} className="px-4 text-sm font-semibold text-white flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.85)' }}>Add</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddItem(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px dashed rgba(167,139,250,0.25)', color: '#a78bfa' }}
        >
          <Plus size={14} /> Add Item
        </button>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={resetAll}
          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
        >
          <RotateCcw size={14} /> Reset All
        </button>
        {!checklist.isDefault && (
          <button
            onClick={() => { onDelete(checklist.id); onBack() }}
            className="flex items-center justify-center gap-2 px-4 p-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── New Checklist Form ───────────────────────────────────────────

function NewChecklistForm({ onSave, onCancel }) {
  const [title, setTitle]   = useState('')
  const [emoji, setEmoji]   = useState('📝')
  const [desc, setDesc]     = useState('')
  const [items, setItems]   = useState([{ id: `item_${Date.now()}`, label: '', checked: false }])

  const EMOJIS = ['📝', '✅', '🎯', '🗂️', '🏠', '🚗', '✈️', '🏋️', '💼', '📚', '🛒', '🎒', '🌙', '🔐', '💰']

  function updateItem(idx, label) {
    const updated = [...items]
    updated[idx] = { ...updated[idx], label }
    setItems(updated)
  }

  function addItemRow() {
    setItems([...items, { id: `item_${Date.now()}`, label: '', checked: false }])
  }

  function removeItemRow(idx) {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  function handleSave() {
    if (!title.trim()) return
    const validItems = items.filter(i => i.label.trim()).map(i => ({ ...i, label: i.label.trim() }))
    if (validItems.length === 0) return
    onSave({ title: title.trim(), emoji, desc: desc.trim(), isDefault: false, items: validItems })
  }

  return (
    <div className="px-4 pb-8 pt-2">
      {/* Emoji picker */}
      <div className="flex gap-2 flex-wrap mb-4">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)}
            className="text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: emoji === e ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)', border: emoji === e ? '1px solid rgba(167,139,250,0.4)' : '1px solid transparent' }}>
            {e}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Checklist title…"
          className="w-full bg-transparent text-white placeholder-gray-500 text-base font-semibold outline-none px-3 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Short description (optional)"
          className="w-full bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      </div>

      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Items</p>
      <div className="flex flex-col gap-2 mb-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex gap-2 items-center">
            <span className="text-gray-600 text-xs w-4 text-right flex-shrink-0">{idx + 1}.</span>
            <input
              value={item.label}
              onChange={e => updateItem(idx, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItemRow()}
              placeholder={`Item ${idx + 1}…`}
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <button onClick={() => removeItemRow(idx)} style={{ color: 'rgba(255,255,255,0.2)' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addItemRow} className="flex items-center gap-2 text-xs font-semibold mb-5"
        style={{ color: 'rgba(167,139,250,0.7)' }}>
        <Plus size={13} /> Add item
      </button>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 p-3 rounded-2xl text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
          Cancel
        </button>
        <button onClick={handleSave} className="flex-1 p-3 rounded-2xl text-sm font-semibold text-white"
          style={{ background: 'rgba(124,58,237,0.85)' }}>
          Create Checklist
        </button>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────

export default function ChecklistsScreen({ checklists, onSave, onDelete }) {
  const [view, setView]               = useState('hub')   // 'hub' | 'detail' | 'new'
  const [activeChecklist, setActive]  = useState(null)
  const [activeTitle, setActiveTitle] = useState('')

  const merged = mergeWithSaved(checklists || [])

  function openDetail(cl) {
    setActive(cl)
    setActiveTitle(`${cl.emoji} ${cl.title}`)
    setView('detail')
  }

  function handleUpdate(updated) {
    onSave(updated)
    // Keep local active in sync
    setActive(updated)
  }

  function handleNewSave(data) {
    const id = `cl_${Date.now()}`
    onSave({ ...data, id })
    setView('hub')
  }

  const title = view === 'new' ? '+ New Checklist' : view === 'detail' ? activeTitle : null

  return { view, merged, activeChecklist, title, openDetail, handleUpdate, handleNewSave, setView }
}

// Named export for embedding inside UtilitiesScreen
export function ChecklistsView({ checklists, onSave, onDelete, onBack }) {
  const [view, setView]              = useState('hub')
  const [activeChecklist, setActive] = useState(null)
  const [headerTitle, setHeaderTitle] = useState(null)

  const merged = mergeWithSaved(checklists || [])

  function openDetail(cl) {
    // Get the freshest state from merged
    const fresh = merged.find(m => m.id === cl.id) || cl
    setActive(fresh)
    setHeaderTitle(`${fresh.emoji} ${fresh.title}`)
    setView('detail')
  }

  function handleUpdate(updated) {
    onSave(updated)
    setActive(updated)
  }

  function handleNewSave(data) {
    onSave({ ...data, id: `cl_${Date.now()}` })
    setView('hub')
  }

  // Sync activeChecklist when checklists prop changes (after save)
  useEffect(() => {
    if (activeChecklist) {
      const fresh = merged.find(m => m.id === activeChecklist.id)
      if (fresh) setActive(fresh)
    }
  }, [checklists])

  if (view === 'new') {
    return (
      <>
        <div className="sticky top-0 z-10 px-4 pb-3"
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))', background: 'rgba(9,11,26,0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('hub')} className="p-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
            </button>
            <h1 className="text-base font-bold text-white">New Checklist</h1>
          </div>
        </div>
        <NewChecklistForm onSave={handleNewSave} onCancel={() => setView('hub')} />
      </>
    )
  }

  if (view === 'detail' && activeChecklist) {
    return (
      <>
        <div className="sticky top-0 z-10 px-4 pb-3"
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))', background: 'rgba(9,11,26,0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('hub')} className="p-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
            </button>
            <h1 className="text-base font-bold text-white">{headerTitle}</h1>
          </div>
        </div>
        <ChecklistDetail
          checklist={activeChecklist}
          onUpdate={handleUpdate}
          onDelete={onDelete}
          onBack={() => setView('hub')}
        />
      </>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-10 px-4 pb-3"
        style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))', background: 'rgba(9,11,26,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">✅ Checklists</h1>
            <p className="text-[11px] text-gray-500">Reusable — check off, then reset for next time</p>
          </div>
        </div>
      </div>
      <ChecklistHub checklists={merged} onSelect={openDetail} onNew={() => setView('new')} />
    </>
  )
}
