import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X, Bell, Sparkles, Check } from 'lucide-react'
import { parseCapture, formatRemind, DESTINATIONS, getDestination } from '../utils/nlp'
import { haptic } from '../utils/haptics'
import { useToast } from '../hooks/useToast'

export default function QuickCapture({ onAddBacklog, onAddUtilityItem }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [destOverride, setDestOverride] = useState(null)
  const [remindOverride, setRemindOverride] = useState(null)  // null = follow parser, '' = explicitly none
  const [showDestPicker, setShowDestPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const areaRef = useRef(null)
  const { toast } = useToast()

  const parsed = useMemo(() => parseCapture(text), [text])
  const destId = destOverride || parsed.destId
  const dest = getDestination(destId)
  const remindAt = remindOverride === null ? parsed.remindAt : (remindOverride || null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => areaRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [open])

  function close() {
    setOpen(false)
    setText('')
    setDestOverride(null)
    setRemindOverride(null)
    setShowDestPicker(false)
  }

  async function handleSave() {
    const title = parsed.title.trim()
    if (!title || saving) return
    setSaving(true)
    try {
      if (dest.kind === 'backlog') {
        const extra = { todaySection: dest.todaySection }
        if (remindAt) { extra.remind_at = remindAt; extra.remind_fired = false }
        await onAddBacklog(title, dest.tag, dest.status, extra)
      } else {
        const meta = {}
        if (remindAt) { meta.remind_at = remindAt; meta.remind_fired = false }
        if (parsed.amount != null) meta.amount = parsed.amount
        const category = destOverride ? dest.category : (parsed.category || dest.category)
        await onAddUtilityItem(dest.type, title, category, meta)
      }
      haptic('success')
      toast(`Saved to ${dest.emoji} ${dest.label}${remindAt ? ` · ${formatRemind(remindAt)}` : ''}`, { variant: 'success' })
      close()
    } finally {
      setSaving(false)
    }
  }

  const canSave = !!parsed.title.trim() && !saving

  return (
    <>
      <button
        onClick={() => { haptic('tap'); setOpen(true) }}
        className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
        style={{
          position: 'fixed',
          right: '1rem',
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px) + 12px)',
          width: 56, height: 56,
          background: 'linear-gradient(145deg, #7c3aed, #6d28d9)',
          boxShadow: '0 6px 24px rgba(124,58,237,0.5)',
          zIndex: 40,
        }}
        aria-label="Quick capture"
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
          onClick={close}>
          <div
            className="w-full max-w-[440px] p-5 rounded-t-[28px] sm:rounded-3xl animate-slide-up"
            style={{
              background: 'rgba(14,17,40,0.99)',
              border: '1px solid rgba(255,255,255,0.12)',
              paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={15} style={{ color: '#a78bfa' }} /> Quick Capture
              </p>
              <button onClick={close} className="p-1.5 -m-1.5" aria-label="Close capture">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <textarea
              ref={areaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSave() }
              }}
              placeholder={'Say it how you think it…\n"call Ravi tomorrow 6pm"\n"₹450 dinner"\n"buy milk and eggs"'}
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-white placeholder-gray-600 outline-none resize-none leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16 }}
            />

            {/* What the parser understood — always visible, always editable */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={() => setShowDestPicker(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                style={{
                  background: 'rgba(124,58,237,0.2)',
                  color: '#c4b5fd',
                  border: `1px solid ${parsed.autoDest && !destOverride ? 'rgba(167,139,250,0.45)' : 'rgba(167,139,250,0.22)'}`,
                }}>
                {dest.emoji} {dest.label}
                {parsed.autoDest && !destOverride && <span style={{ color: 'rgba(196,181,253,0.55)' }}>auto</span>}
              </button>

              {remindAt && (
                <button
                  onClick={() => setRemindOverride('')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(6,182,212,0.15)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.28)' }}
                  title="Tap to remove reminder">
                  <Bell size={11} /> {formatRemind(remindAt)} <X size={10} />
                </button>
              )}

              {parsed.amount != null && dest.kind === 'utility' && (
                <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.14)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.26)' }}>
                  ₹{parsed.amount.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {showDestPicker && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 p-2.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {DESTINATIONS.map(d => (
                  <button key={d.id}
                    onClick={() => { setDestOverride(d.id); setShowDestPicker(false); haptic('select') }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
                    style={{
                      background: destId === d.id ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.05)',
                      color: destId === d.id ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                    }}>
                    {d.emoji} {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Manual reminder when the text didn't imply one */}
            {!remindAt && (
              <div className="flex items-center gap-2 mt-2.5">
                <Bell size={13} style={{ color: 'rgba(255,255,255,0.32)' }} />
                <input
                  type="datetime-local"
                  value=""
                  onChange={e => setRemindOverride(e.target.value ? new Date(e.target.value).getTime() : null)}
                  className="flex-1 text-xs outline-none px-2.5 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            )}

            <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: 'rgba(240,244,255,0.3)' }}>
              {parsed.title.trim()
                ? <>Saving <span className="text-white/70">"{parsed.title}"</span> to {dest.emoji} {dest.label}. Tap any chip to change it.</>
                : 'Dates, times, amounts and the right bucket are read from what you type.'}
            </p>

            <button onClick={handleSave} disabled={!canSave}
              className={`btn-primary w-full mt-3.5 flex items-center justify-center gap-2 ${!canSave ? 'opacity-40' : ''}`}>
              <Check size={16} /> {saving ? 'Saving…' : 'Capture'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
