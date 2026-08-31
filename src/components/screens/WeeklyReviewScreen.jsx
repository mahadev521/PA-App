import { useState } from 'react'
import { X, ArrowRight, ArrowLeft, Check, Trash2, Bell, PartyPopper } from 'lucide-react'

const STEPS = ['Inbox', 'Reminders', 'Debts', 'Reflect', 'Done']

function backlogStatus(item) {
  return item.status || (item.done ? 'done' : 'backlog')
}

function formatDate(ts) {
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StepShell({ title, hint, children }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-white">{title}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function EmptyNote({ text }) {
  return <div className="text-center py-8 text-gray-500 text-sm">{text}</div>
}

export default function WeeklyReviewScreen({
  backlog, utilityItems,
  onUpdateBacklogStatus, onDeleteBacklog, onSetBacklogReminder, onSetUtilityItemReminder,
  onToggleUtilityItem, onDeleteUtilityItem, onAddExperience, onUpdateProfile,
  onClose,
}) {
  const [step, setStep] = useState(0)
  const [reflectText, setReflectText] = useState('')
  const now = Date.now()

  const inboxItems = backlog.filter(i => backlogStatus(i) === 'backlog')
  const overdueBacklog = backlog.filter(i => i.remind_at && i.remind_at <= now)
  const overdueUtility = utilityItems.filter(i => i.meta?.remind_at && i.meta.remind_at <= now)
  const debtItems = utilityItems.filter(i => i.type === 'debts' && !i.done)
  const iOwe = debtItems.filter(i => i.category === 'i_owe').reduce((s, i) => s + (Number(i.meta?.amount) || 0), 0)
  const owedToMe = debtItems.filter(i => i.category === 'owed_to_me').reduce((s, i) => s + (Number(i.meta?.amount) || 0), 0)

  async function finish() {
    if (reflectText.trim()) {
      await onAddExperience({
        title: 'Weekly Review reflection',
        context: reflectText.trim(),
        lesson: '',
        tags: 'weekly-review',
        category: 'insight',
        impact: 5,
      })
    }
    await onUpdateProfile({ last_weekly_review_at: Date.now() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-base animate-slide-up" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-white">🧭 Weekly Review</h2>
          <p className="text-[11px] text-gray-500">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-elevated">
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 px-4 py-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 h-1.5 rounded-full"
            style={{ background: i <= step ? '#7c3aed' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {step === 0 && (
          <StepShell title="Triage your inbox" hint="Everything you've captured but haven't sorted yet.">
            {inboxItems.length === 0 && <EmptyNote text="Inbox is empty. Nice." />}
            <div className="space-y-2">
              {inboxItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="flex-1 text-sm text-white/90 leading-snug">{item.title}</span>
                  <button onClick={() => onUpdateBacklogStatus(item.id, 'today')}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                    → Today
                  </button>
                  <button onClick={() => onUpdateBacklogStatus(item.id, 'planned')}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    Planned
                  </button>
                  <button onClick={() => onDeleteBacklog(item.id)} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title="Clear stale reminders" hint="Reminders that already came due.">
            {overdueBacklog.length === 0 && overdueUtility.length === 0 && <EmptyNote text="No overdue reminders." />}
            <div className="space-y-2">
              {overdueBacklog.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-3 rounded-2xl"
                  style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)' }}>
                  <Bell size={14} className="flex-shrink-0" style={{ color: '#fb7185' }} />
                  <div className="flex-1">
                    <p className="text-sm text-white/90 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-rose">{formatDate(item.remind_at)}</p>
                  </div>
                  <button onClick={() => onSetBacklogReminder(item.id, null)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    Clear
                  </button>
                  <button onClick={() => onDeleteBacklog(item.id)} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {overdueUtility.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-3 rounded-2xl"
                  style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)' }}>
                  <Bell size={14} className="flex-shrink-0" style={{ color: '#fb7185' }} />
                  <div className="flex-1">
                    <p className="text-sm text-white/90 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-rose">{formatDate(item.meta.remind_at)}</p>
                  </div>
                  <button onClick={() => onSetUtilityItemReminder(item.id, null)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    Clear
                  </button>
                  <button onClick={() => onDeleteUtilityItem(item.id)} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Debts & ad-hoc spends" hint="Anything settled since last time?">
            {debtItems.length === 0 && <EmptyNote text="No pending debts." />}
            {debtItems.length > 0 && (
              <p className="text-sm font-semibold mb-2" style={{ color: '#a78bfa' }}>
                {iOwe > 0 && `₹${iOwe.toLocaleString()} you owe`}
                {iOwe > 0 && owedToMe > 0 && ' · '}
                {owedToMe > 0 && `₹${owedToMe.toLocaleString()} owed to you`}
              </p>
            )}
            <div className="space-y-2">
              {debtItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex-1">
                    <p className="text-sm text-white/90 leading-snug">{item.title}</p>
                    {item.meta?.amount != null && <p className="text-[11px]" style={{ color: '#a78bfa' }}>₹{Number(item.meta.amount).toLocaleString()}</p>}
                  </div>
                  <button onClick={() => onToggleUtilityItem(item.id)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    Settle
                  </button>
                </div>
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Reflect" hint="One thing worth carrying into next week (optional).">
            <textarea
              value={reflectText}
              onChange={e => setReflectText(e.target.value)}
              placeholder="What's one thing you want to change next week?"
              rows={5}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <p className="text-[11px] text-gray-500">Saved to your Journal if you write something.</p>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="All set">
            <div className="card flex items-center gap-3 border border-emerald/20 bg-emerald/5">
              <PartyPopper size={22} className="text-emerald flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Review complete</p>
                <p className="text-xs text-gray-400">Your Command Center will stay quiet on this for another week.</p>
              </div>
            </div>
          </StepShell>
        )}
      </div>

      <div className="flex gap-2 px-4 pt-3 border-t border-border" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex items-center gap-1.5">
            <ArrowLeft size={15} /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
            Next <ArrowRight size={15} />
          </button>
        ) : (
          <button onClick={finish} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
            <Check size={15} /> Finish
          </button>
        )}
      </div>
    </div>
  )
}
