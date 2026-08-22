import { useState, lazy, Suspense } from 'react'
import { BarChart3, Trophy } from 'lucide-react'
import ProgressScreen from './ProgressScreen'

const ChartsScreen = lazy(() => import('./ChartsScreen'))

const TABS = [
  { id: 'progress', icon: Trophy,    label: 'Progress', gradient: 'linear-gradient(135deg,#d97706,#b45309)' },
  { id: 'charts',   icon: BarChart3, label: 'Charts',   gradient: 'linear-gradient(135deg,#0284c7,#0369a1)' },
]

const Loader = () => (
  <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>
)

export default function LifeScreen({
  entries,
  levelInfo, streaks, earnedBadges, totalXP,
}) {
  const [mode, setMode] = useState('progress')

  return (
    <div className="min-h-screen bg-base">
      {/* Sticky sub-header */}
      <div
        className="sticky top-0 z-10 px-4 pb-2"
        style={{
          paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
          background: 'rgba(9,11,26,0.95)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {TABS.map(({ id, icon: Icon, label, gradient }) => {
            const isActive = mode === id
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isActive
                  ? { background: gradient, color: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }
                  : { color: 'rgba(240,244,255,0.45)' }
                }
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'progress' && (
        <ProgressScreen
          levelInfo={levelInfo}
          streaks={streaks}
          earnedBadges={earnedBadges}
          totalXP={totalXP}
          entries={entries}
          embedded
        />
      )}
      {mode === 'charts' && (
        <Suspense fallback={<Loader />}>
          <ChartsScreen entries={entries} embedded />
        </Suspense>
      )}
    </div>
  )
}
