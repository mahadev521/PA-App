import { useMemo, useState } from 'react'
import { Plus, X, Trash2, Check, Brain, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { haptic } from '../../../utils/haptics'

// A decision journal, not a to-do list. You record the call *and what you
// expected* before you know the answer, then come back on the review date and
// grade it. Over time this is the only honest record of your judgement —
// memory rewrites every decision to look inevitable.

const HORIZONS = [
  { days: 7,   label: '1 week'   },
  { days: 30,  label: '1 month'  },
  { days: 90,  label: '3 months' },
  { days: 365, label: '1 year'   },
]

const VERDICTS = [
  { id: 'great',   emoji: '🎉', label: 'Better than expected', color: '#10b981' },
  { id: 'good',    emoji: '👍', label: 'About right',          color: '#06b6d4' },
  { id: 'mixed',   emoji: '🤷', label: 'Mixed',                color: '#f59e0b' },
  { id: 'regret',  emoji: '😖', label: 'I regret it',          color: '#f43f5e' },
]

function verdictInfo(id) {
  return VERDICTS.find(v => v.id === id) || null
}

function dateInput(ts) {
  return ts ? new Date(ts).toISOString().slice(0, 10) : ''
}

function fmt(ts) {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const emptyForm = { title: '', options: '', expected: '', reviewDays: 30, reviewDate: '' }

const TONES = {
  due:      { bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.22)'   },
  waiting:  { bg: 'rgba(255,255,255,0.045)', border: 'rgba(255,255,255,0.08)'  },
  reviewed: { bg: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.06)'  },
}

// Defined at module scope on purpose. While this lived inside DecisionsScreen it
// was a new function identity on every render, so React unmounted and remounted
// the whole card each time `reviewText` changed — the outcome textarea lost
// focus (and the mobile keyboard closed) after every single keystroke, which
// made the review step impossible to complete.
function Card({
  d, tone, expanded, isReviewing, reviewText, reviewVerdict,
  onToggleExpand, onOpenReview, onSnooze, onDelete, onSaveReview, onCancelReview,
  onChangeReviewText, onChangeVerdict,
}) {
    const v = verdictInfo(d.meta?.verdict)

    return (
      <div className="rounded-2xl overflow-hidden"
        style={{ background: tone.bg, border: `1px solid ${tone.border}` }}>
        <button onClick={onToggleExpand}
          className="w-full flex items-start gap-3 p-3.5 text-left">
          <span className="text-base leading-none flex-shrink-0 mt-0.5">{v ? v.emoji : '🧠'}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-white/90 leading-snug">{d.title}</span>
            <span className="block text-[11px] mt-1" style={{ color: 'rgba(240,244,255,0.34)' }}>
              {d.meta?.decided_at ? `Decided ${fmt(d.meta.decided_at)}` : ''}
              {d.meta?.review_at && !d.meta?.outcome && ` · review ${fmt(d.meta.review_at)}`}
              {v && ` · ${v.label}`}
            </span>
          </span>
          {expanded
            ? <ChevronUp size={15} style={{ color: 'rgba(255,255,255,0.3)' }} className="flex-shrink-0 mt-1" />
            : <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.3)' }} className="flex-shrink-0 mt-1" />}
        </button>

        {expanded && (
          <div className="px-3.5 pb-3.5 space-y-2.5">
            {d.meta?.options && (
              <div>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(240,244,255,0.3)' }}>Options I weighed</p>
                <p className="text-xs text-gray-300 leading-relaxed">{d.meta.options}</p>
              </div>
            )}
            {d.meta?.expected && (
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#a78bfa' }}>What I expected</p>
                <p className="text-xs text-gray-200 leading-relaxed">{d.meta.expected}</p>
              </div>
            )}
            {d.meta?.outcome && (
              <div className="rounded-xl p-2.5" style={{ background: `${v?.color || '#10b981'}14`, border: `1px solid ${v?.color || '#10b981'}33` }}>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: v?.color }}>What actually happened</p>
                <p className="text-xs text-gray-200 leading-relaxed">{d.meta.outcome}</p>
              </div>
            )}

            {!d.meta?.outcome && !isReviewing && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                <button onClick={onOpenReview}
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.16)', color: '#10b981' }}>
                  Record the outcome
                </button>
                <button onClick={onSnooze}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                  <Clock size={11} /> +30 days
                </button>
                <button onClick={onDelete} className="ml-auto p-1.5"
                  style={{ color: 'rgba(255,255,255,0.25)' }} aria-label="Delete decision">
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {d.meta?.outcome && (
              <button onClick={onDelete} className="flex items-center gap-1 text-[11px]"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                <Trash2 size={12} /> Delete
              </button>
            )}

            {isReviewing && (
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {VERDICTS.map(vd => (
                    <button key={vd.id} onClick={() => onChangeVerdict(vd.id)}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
                      style={{
                        background: reviewVerdict === vd.id ? `${vd.color}26` : 'rgba(255,255,255,0.05)',
                        color: reviewVerdict === vd.id ? vd.color : 'rgba(255,255,255,0.5)',
                        border: reviewVerdict === vd.id ? `1px solid ${vd.color}55` : '1px solid transparent',
                      }}>
                      {vd.emoji} {vd.label}
                    </button>
                  ))}
                </div>
                <textarea value={reviewText} onChange={e => onChangeReviewText(e.target.value)}
                  rows={3} placeholder="What actually happened? Was your expectation right — and what would you do differently?"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <div className="flex gap-2">
                  <button onClick={onSaveReview} disabled={!reviewText.trim()}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${!reviewText.trim() ? 'opacity-40' : ''}`}
                    style={{ background: 'rgba(16,185,129,0.18)', color: '#10b981' }}>
                    <Check size={14} /> Save review
                  </button>
                  <button onClick={onCancelReview}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

export default function DecisionsScreen({ items, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [expandedId, setExpandedId] = useState(null)
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewVerdict, setReviewVerdict] = useState('good')

  const decisions = useMemo(
    () => (items || []).filter(i => i.type === 'decisions').sort((a, b) => (b.created_at || 0) - (a.created_at || 0)),
    [items]
  )

  const now = Date.now()
  const dueForReview = decisions.filter(d => !d.meta?.outcome && d.meta?.review_at && d.meta.review_at <= now)
  const waiting      = decisions.filter(d => !d.meta?.outcome && (!d.meta?.review_at || d.meta.review_at > now))
  const reviewed     = decisions.filter(d => d.meta?.outcome)

  const regretRate = reviewed.length
    ? Math.round(reviewed.filter(d => d.meta.verdict === 'regret').length / reviewed.length * 100)
    : null

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleAdd() {
    if (!form.title.trim()) return
    const reviewAt = form.reviewDate
      ? new Date(form.reviewDate + 'T09:00:00').getTime()
      : Date.now() + form.reviewDays * 864e5
    await onAdd('decisions', form.title.trim(), 'open', {
      options: form.options.trim(),
      expected: form.expected.trim(),
      review_at: reviewAt,
      decided_at: Date.now(),
    })
    haptic('success')
    setForm(emptyForm)
    setShowForm(false)
  }

  function openReview(d) {
    setReviewingId(d.id)
    setReviewText('')
    setReviewVerdict('good')
    haptic('tap')
  }

  async function saveReview(d) {
    if (!reviewText.trim()) return
    await onUpdate({
      ...d,
      category: 'decided',
      done: true,
      meta: { ...d.meta, outcome: reviewText.trim(), verdict: reviewVerdict, reviewed_at: Date.now() },
    })
    haptic('success')
    setReviewingId(null)
  }

  async function snooze(d, days) {
    await onUpdate({ ...d, meta: { ...d.meta, review_at: Date.now() + days * 864e5 } })
    haptic('tap')
  }


  // One place that binds a decision to the card's callbacks, so the three
  // lists below can't drift apart.
  const cardProps = d => ({
    d,
    expanded: expandedId === d.id,
    isReviewing: reviewingId === d.id,
    reviewText,
    reviewVerdict,
    onToggleExpand: () => setExpandedId(expandedId === d.id ? null : d.id),
    onOpenReview: () => openReview(d),
    onSnooze: () => snooze(d, 30),
    onDelete: () => onDelete(d.id),
    onSaveReview: () => saveReview(d),
    onCancelReview: () => setReviewingId(null),
    onChangeReviewText: setReviewText,
    onChangeVerdict: setReviewVerdict,
  })

  return (
    <div className="px-4 pb-8 pt-4 space-y-4">

      <p className="text-[11px] italic leading-relaxed" style={{ color: 'rgba(167,139,250,0.7)' }}>
        Write down the call and what you expect — before you know how it turns out.
        A decision you never reviewed is a lesson you never collected.
      </p>

      {reviewed.length >= 3 && (
        <div className="card flex items-center gap-3 py-3.5">
          <Brain size={20} className="flex-shrink-0" style={{ color: '#a78bfa' }} />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              {reviewed.length} decisions reviewed · {regretRate}% regretted
            </p>
            <p className="text-[11px] text-gray-500">
              {regretRate <= 15
                ? 'Your judgement is holding up. Keep making calls this deliberately.'
                : regretRate <= 35
                  ? 'Normal range. Look for the pattern in the ones you regret.'
                  : 'Worth asking what these calls have in common — rushed? alone? under pressure?'}
            </p>
          </div>
        </div>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2">
          <Plus size={18} /> Log a decision
        </button>
      ) : (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-title mb-0">New decision</p>
            <button onClick={() => { setShowForm(false); setForm(emptyForm) }} aria-label="Cancel">
              <X size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">The decision</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Take the new role at X instead of staying"
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Options you weighed</label>
            <textarea value={form.options} onChange={e => set('options', e.target.value)}
              rows={2} placeholder="What else was on the table, and why you passed on it"
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">What you expect to happen</label>
            <textarea value={form.expected} onChange={e => set('expected', e.target.value)}
              rows={2} placeholder="Be specific enough that future-you can score it"
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Review this in</label>
            <div className="flex gap-1.5 flex-wrap">
              {HORIZONS.map(h => (
                <button key={h.days} onClick={() => { set('reviewDays', h.days); set('reviewDate', '') }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: !form.reviewDate && form.reviewDays === h.days ? 'rgba(124,58,237,0.26)' : 'rgba(255,255,255,0.05)',
                    color: !form.reviewDate && form.reviewDays === h.days ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                  }}>
                  {h.label}
                </button>
              ))}
            </div>
            <input type="date" value={form.reviewDate} min={dateInput(Date.now())}
              onChange={e => set('reviewDate', e.target.value)}
              className="w-full mt-2 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>

          <button onClick={handleAdd} disabled={!form.title.trim()}
            className={`btn-primary w-full ${!form.title.trim() ? 'opacity-40' : ''}`}>
            Save decision
          </button>
        </div>
      )}

      {dueForReview.length > 0 && (
        <div>
          <p className="section-title" style={{ color: '#f59e0b' }}>⏳ Ready for review · {dueForReview.length}</p>
          <div className="space-y-2">
            {dueForReview.map(d => <Card key={d.id} tone={TONES.due} {...cardProps(d)} />)}
          </div>
        </div>
      )}

      {waiting.length > 0 && (
        <div>
          <p className="section-title">🧠 Playing out · {waiting.length}</p>
          <div className="space-y-2">
            {waiting.map(d => <Card key={d.id} tone={TONES.waiting} {...cardProps(d)} />)}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="section-title">📚 Reviewed · {reviewed.length}</p>
          <div className="space-y-2">
            {reviewed.map(d => <Card key={d.id} tone={TONES.reviewed} {...cardProps(d)} />)}
          </div>
        </div>
      )}

      {decisions.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Brain size={28} className="mx-auto mb-3 opacity-40" style={{ color: '#a78bfa' }} />
          <p className="text-sm font-bold text-white mb-1">No decisions logged yet</p>
          <p className="text-xs text-gray-500 leading-relaxed px-6">
            Start with one you're sitting on right now. In a month you'll have evidence
            instead of a feeling.
          </p>
        </div>
      )}
    </div>
  )
}
