import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, CheckCircle, MessageSquare, Trash2, X } from 'lucide-react'

const PRIORITY = {
  high:   { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
  medium: { label: 'Med',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  low:    { label: 'Low',  color: '#6ee7b7', bg: 'rgba(110,231,183,0.15)' },
}

// Tapping the status circle cycles through these three states
const STATUS_CYCLE  = { pending: 'done', done: 'skipped', skipped: 'pending' }
const STATUS_STYLE  = {
  pending: { label: 'Pending',     symbol: '○', color: 'rgba(255,255,255,0.4)', bg: 'transparent',             border: 'rgba(255,255,255,0.3)'  },
  done:    { label: 'Done',        symbol: '✓', color: '#10b981',              bg: 'rgba(16,185,129,0.2)',     border: '#10b981'                 },
  skipped: { label: "Couldn't do", symbol: '✕', color: '#ef4444',              bg: 'rgba(239,68,68,0.15)',     border: '#ef4444'                 },
}

export default function ErrandRunScreen({ runs, onSaveRun, onDeleteRun }) {
  const [currentRun, setCurrentRun]       = useState(null)
  const [showModal, setShowModal]         = useState(false)
  const [runName, setRunName]             = useState('')
  const [stopTitle, setStopTitle]         = useState('')
  const [stopPriority, setStopPriority]   = useState('medium')
  const [commentingId, setCommentingId]   = useState(null)
  const [commentText, setCommentText]     = useState('')

  // ── helpers ───────────────────────────────────────────────────

  function persist(updatedRun) {
    setCurrentRun(updatedRun)
    onSaveRun(updatedRun)
  }

  function createRun() {
    if (!runName.trim()) return
    const run = {
      id: `er_${Date.now()}`,
      name: runName.trim(),
      stops: [],
      completed: false,
      created_at: Date.now(),
    }
    setCurrentRun(run)
    onSaveRun(run)
    setShowModal(false)
    setRunName('')
  }

  function addStop() {
    if (!stopTitle.trim() || !currentRun) return
    const stop = {
      id: `s_${Date.now()}`,
      title: stopTitle.trim(),
      priority: stopPriority,
      status: 'pending',
      comment: '',
    }
    persist({ ...currentRun, stops: [...currentRun.stops, stop] })
    setStopTitle('')
    setStopPriority('medium')
  }

  function cycleStatus(stopId) {
    persist({
      ...currentRun,
      stops: currentRun.stops.map(s =>
        s.id === stopId ? { ...s, status: STATUS_CYCLE[s.status] } : s
      ),
    })
  }

  function moveStop(stopId, dir) {
    const stops = [...currentRun.stops]
    const idx = stops.findIndex(s => s.id === stopId)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= stops.length) return
    ;[stops[idx], stops[swapIdx]] = [stops[swapIdx], stops[idx]]
    persist({ ...currentRun, stops })
  }

  function saveComment() {
    persist({
      ...currentRun,
      stops: currentRun.stops.map(s =>
        s.id === commentingId ? { ...s, comment: commentText.trim() } : s
      ),
    })
    setCommentingId(null)
    setCommentText('')
  }

  function removeStop(stopId) {
    persist({ ...currentRun, stops: currentRun.stops.filter(s => s.id !== stopId) })
  }

  function finishRun() {
    persist({ ...currentRun, completed: true })
    setCurrentRun(null)
  }

  // ── Run list ──────────────────────────────────────────────────

  if (!currentRun) {
    const active  = (runs || []).filter(r => !r.completed).sort((a, b) => b.created_at - a.created_at)
    const history = (runs || []).filter(r => r.completed).sort((a, b) => b.created_at - a.created_at)

    return (
      <div className="px-4 pb-8">
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
          style={{ background: 'rgba(124,58,237,0.65)', border: '1px solid rgba(124,58,237,0.3)' }}
        >
          <Plus size={16} /> Start New Errand Run
        </button>

        {active.length === 0 && history.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🚗</div>
            <p className="text-gray-500 text-sm">No errand runs yet.</p>
            <p className="mt-1 text-xs text-gray-600">Create one before heading out.</p>
          </div>
        )}

        {active.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">Active</p>
            <div className="flex flex-col gap-2">
              {active.map(run => {
                const done = (run.stops || []).filter(s => s.status === 'done').length
                return (
                  <button
                    key={run.id}
                    onClick={() => setCurrentRun(run)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl w-full text-left"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
                  >
                    <span className="text-2xl">🚗</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{run.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {run.stops.length} stops · {done} done · {new Date(run.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                  </button>
                )
              })}
            </div>
          </>
        )}

        {history.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">History</p>
            <div className="flex flex-col gap-2">
              {history.slice(0, 8).map(run => {
                const done    = (run.stops || []).filter(s => s.status === 'done').length
                const skipped = (run.stops || []).filter(s => s.status === 'skipped').length
                return (
                  <button
                    key={run.id}
                    onClick={() => setCurrentRun(run)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl w-full text-left"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-xl opacity-70">✅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70">{run.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {done} done · {skipped} skipped · {new Date(run.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteRun(run.id) }}
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Create modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <div
              className="w-full max-w-[400px] p-5 rounded-3xl"
              style={{ background: 'rgba(17,21,48,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-white">New Errand Run</span>
                <button onClick={() => setShowModal(false)}><X size={18} color="rgba(255,255,255,0.4)" /></button>
              </div>
              <p className="text-xs italic mb-3" style={{ color: 'rgba(167,139,250,0.7)' }}>
                You have things waiting. Name this run and go get them done.
              </p>
              <div className="flex gap-2"
                style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden' }}>
                <input
                  value={runName}
                  onChange={e => setRunName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createRun()}
                  placeholder="e.g. Saturday Errands"
                  autoFocus
                  className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-3"
                />
                <button
                  onClick={createRun}
                  className="px-4 text-sm font-semibold text-white flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.85)' }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Run detail ────────────────────────────────────────────────

  const pendingCount = currentRun.stops.filter(s => s.status === 'pending').length
  const doneCount    = currentRun.stops.filter(s => s.status === 'done').length
  const skippedCount = currentRun.stops.filter(s => s.status === 'skipped').length

  return (
    <div className="px-4 pb-8">
      {/* Back bar */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        <button
          onClick={() => setCurrentRun(null)}
          className="p-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{currentRun.name}</p>
          <p className="text-xs text-gray-500">
            {doneCount} done · {skippedCount} skipped · {pendingCount} left
          </p>
        </div>
        {!currentRun.completed && pendingCount === 0 && currentRun.stops.length > 0 && (
          <button
            onClick={finishRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <CheckCircle size={13} /> Finish Run
          </button>
        )}
      </div>

      {/* Route preview */}
      {currentRun.stops.length > 0 && (
        <div
          className="mb-4 p-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">📍 Route sequence</p>
          <div className="flex flex-wrap gap-x-1.5 gap-y-1 items-center text-xs">
            <span className="text-white/50">🏠 Home</span>
            {currentRun.stops.map(stop => (
              <span key={stop.id} className="flex items-center gap-1">
                <span className="text-gray-600">→</span>
                <span style={{
                  color: stop.status === 'done' ? '#10b981' : stop.status === 'skipped' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                  textDecoration: stop.status === 'skipped' ? 'line-through' : 'none',
                }}>
                  {stop.title}
                </span>
              </span>
            ))}
            <span className="text-gray-600">→</span>
            <span className="text-white/50">🏠 Home</span>
          </div>
        </div>
      )}

      {/* Add stop form */}
      {!currentRun.completed && (
        <div
          className="mb-4 p-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] italic mb-2" style={{ color: 'rgba(167,139,250,0.65)' }}>
            Every stop you don't add now is a trip you'll have to make again.
          </p>
          <div className="flex gap-2 mb-2"
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
            <input
              value={stopTitle}
              onChange={e => setStopTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStop()}
              placeholder="Add a stop…"
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-2.5"
            />
            <button
              onClick={addStop}
              className="px-4 text-sm font-semibold text-white flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.75)' }}
            >
              Add
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {Object.entries(PRIORITY).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setStopPriority(key)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: stopPriority === key ? p.bg : 'rgba(255,255,255,0.05)',
                  color:      stopPriority === key ? p.color : 'rgba(255,255,255,0.4)',
                  border:     stopPriority === key ? `1px solid ${p.color}50` : '1px solid transparent',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentRun.stops.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">Add your stops above ↑</div>
      )}

      {/* Stops */}
      <div className="flex flex-col gap-2">
        {currentRun.stops.map((stop, idx) => {
          const st = STATUS_STYLE[stop.status]
          const p  = PRIORITY[stop.priority] || PRIORITY.medium
          return (
            <div key={stop.id}>
              <div
                className="flex items-center gap-2.5 p-3 rounded-2xl transition-all"
                style={{
                  background: stop.status === 'done'    ? 'rgba(16,185,129,0.06)'
                             : stop.status === 'skipped' ? 'rgba(239,68,68,0.04)'
                             : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${
                    stop.status === 'done'    ? 'rgba(16,185,129,0.2)'
                  : stop.status === 'skipped' ? 'rgba(239,68,68,0.15)'
                  : 'rgba(255,255,255,0.07)'}`,
                  opacity: stop.status === 'skipped' ? 0.7 : 1,
                }}
              >
                {/* Status button */}
                <button
                  onClick={() => !currentRun.completed && cycleStatus(stop.id)}
                  className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                  style={{ borderColor: st.border, background: st.bg, color: st.color }}
                  title={`${st.label} — tap to change`}
                >
                  {st.symbol}
                </button>

                {/* Number */}
                <span className="flex-shrink-0 text-xs text-gray-600 w-4 text-right">{idx + 1}</span>

                {/* Title */}
                <span
                  className="flex-1 text-sm leading-snug"
                  style={{
                    color: stop.status === 'done' ? '#10b981' : stop.status === 'skipped' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                    textDecoration: stop.status === 'skipped' ? 'line-through' : 'none',
                  }}
                >
                  {stop.title}
                </span>

                {/* Priority */}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex-shrink-0"
                  style={{ background: p.bg, color: p.color }}
                >
                  {p.label}
                </span>

                {/* Reorder */}
                {!currentRun.completed && (
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveStop(stop.id, 'up')} disabled={idx === 0}
                      className="disabled:opacity-20" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveStop(stop.id, 'down')} disabled={idx === currentRun.stops.length - 1}
                      className="disabled:opacity-20" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}

                {/* Comment */}
                <button
                  onClick={() => { setCommentingId(stop.id); setCommentText(stop.comment || '') }}
                  className="flex-shrink-0"
                  style={{ color: stop.comment ? '#a78bfa' : 'rgba(255,255,255,0.2)' }}
                >
                  <MessageSquare size={15} />
                </button>

                {/* Delete (active runs only) */}
                {!currentRun.completed && (
                  <button onClick={() => removeStop(stop.id)} className="flex-shrink-0"
                    style={{ color: 'rgba(255,255,255,0.2)' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Comment display */}
              {stop.comment && (
                <div
                  className="ml-10 mt-1 px-3 py-1.5 text-xs text-gray-400 rounded-xl"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}
                >
                  💬 {stop.comment}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary for completed runs */}
      {currentRun.completed && (
        <div className="mt-4 p-3 rounded-2xl text-sm"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-emerald-400 font-semibold mb-1">✅ Run completed</p>
          <p className="text-gray-400 text-xs">
            {doneCount} completed · {skippedCount} skipped · {new Date(currentRun.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Comment modal */}
      {commentingId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-[400px] p-5 rounded-3xl"
            style={{ background: 'rgba(17,21,48,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-white">Note for this stop</span>
              <button onClick={() => setCommentingId(null)}><X size={18} color="rgba(255,255,255,0.4)" /></button>
            </div>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Why couldn't you complete it? Any notes…"
              rows={3}
              autoFocus
              className="w-full bg-transparent text-white text-sm placeholder-gray-500 outline-none resize-none rounded-xl px-3 py-2.5"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setCommentingId(null)}
                className="flex-1 py-2 rounded-xl text-sm text-gray-400"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                Cancel
              </button>
              <button onClick={saveComment}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'rgba(124,58,237,0.7)' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
