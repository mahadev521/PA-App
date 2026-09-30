import { useMemo } from 'react'
import { X, ChevronRight, CalendarCheck } from 'lucide-react'
import { buildAgenda } from '../../utils/agenda'
import { formatRemind } from '../../utils/nlp'

const TONE = {
  rose:   { color: '#fb7185', bg: 'rgba(244,63,94,0.07)',  border: 'rgba(244,63,94,0.20)'   },
  accent: { color: '#a78bfa', bg: 'rgba(124,58,237,0.08)', border: 'rgba(167,139,250,0.22)' },
  gold:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.20)'  },
  sky:    { color: '#06b6d4', bg: 'rgba(6,182,212,0.06)',  border: 'rgba(6,182,212,0.18)'   },
  muted:  { color: 'rgba(240,244,255,0.45)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)' },
}

export default function AgendaScreen({ backlog, utilityItems, goals, people, onNavigate, onClose }) {
  const buckets = useMemo(
    () => buildAgenda({ backlog, utilityItems, goals, people }),
    [backlog, utilityItems, goals, people]
  )
  const total = buckets.reduce((s, b) => s + b.items.length, 0)

  function go(nav) {
    onNavigate(nav)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-base" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-white">📅 What's Coming</h2>
          <p className="text-[11px] text-gray-500">
            {total > 0 ? `${total} dated item${total === 1 ? '' : 's'} ahead` : 'Nothing scheduled'}
          </p>
        </div>
        <button onClick={onClose} className="p-2.5 rounded-xl bg-elevated" aria-label="Close agenda">
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>

        {total === 0 && (
          <div className="card text-center py-14">
            <CalendarCheck size={30} className="mx-auto mb-3 text-emerald opacity-70" />
            <p className="text-sm font-bold text-white mb-1">Your calendar of consequences is clear</p>
            <p className="text-xs text-gray-500 leading-relaxed px-4">
              Add a reminder when you capture something, give a goal a target date, or set a
              review date on a decision — it will show up here instead of ambushing you.
            </p>
          </div>
        )}

        {buckets.map(bucket => {
          const tone = TONE[bucket.tone] || TONE.muted
          return (
            <div key={bucket.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: tone.color, letterSpacing: '0.10em' }}>
                  {bucket.emoji} {bucket.label}
                </p>
                <span className="text-[11px] font-bold" style={{ color: tone.color }}>{bucket.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {bucket.items.map(item => (
                  <button key={item.key} onClick={() => go(item.nav)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left active:scale-[0.99] transition-transform"
                    style={{ background: tone.bg, border: `1px solid ${tone.border}` }}>
                    <span className="text-base leading-none flex-shrink-0">{item.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-white/90 leading-snug">{item.title}</span>
                      <span className="block text-[11px] mt-0.5" style={{ color: 'rgba(240,244,255,0.34)' }}>
                        {item.dated ? formatRemind(item.at) : new Date(item.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        {' · '}{item.source}
                      </span>
                    </span>
                    <ChevronRight size={14} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
