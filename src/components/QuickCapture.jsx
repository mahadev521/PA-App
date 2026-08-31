import { useState } from 'react'
import { Plus, X, Bell } from 'lucide-react'

export default function QuickCapture({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [remindAt, setRemindAt] = useState('')

  function close() {
    setOpen(false)
    setText('')
    setRemindAt('')
  }

  async function handleSave() {
    if (!text.trim()) return
    await onAdd(text.trim(), 'inbox', 'backlog', remindAt ? { remind_at: new Date(remindAt).getTime() } : {})
    close()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
        style={{
          position: 'fixed',
          right: '1rem',
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px) + 12px)',
          width: 52, height: 52,
          background: 'linear-gradient(145deg, #7c3aed, #6d28d9)',
          boxShadow: '0 6px 24px rgba(124,58,237,0.5)',
          zIndex: 40,
        }}
        aria-label="Quick capture"
      >
        <Plus size={24} color="#fff" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-[400px] p-5 rounded-3xl"
            style={{ background: 'rgba(17,21,48,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold text-white">📥 Quick Capture</p>
              <button onClick={close}><X size={18} className="text-gray-400" /></button>
            </div>

            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            <div className="flex items-center gap-2 mt-3">
              <Bell size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type="datetime-local"
                value={remindAt}
                onChange={e => setRemindAt(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none px-2 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              {remindAt && (
                <button onClick={() => setRemindAt('')} className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Clear
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-500 mt-2">Lands in Tools → Backlog, tagged Inbox, to sort later.</p>

            <button onClick={handleSave} disabled={!text.trim()}
              className={`btn-primary w-full mt-4 ${!text.trim() ? 'opacity-40' : ''}`}>
              Save
            </button>
          </div>
        </div>
      )}
    </>
  )
}
