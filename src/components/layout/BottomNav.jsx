import { Home, PenLine, BarChart3, BookOpen, Star, Wrench } from 'lucide-react'

const TABS = [
  { id: 'home',      icon: Home,      label: 'Home'    },
  { id: 'log',       icon: PenLine,   label: 'Log'     },
  { id: 'ritual',   icon: Star,      label: 'Ritual'  },
  { id: 'charts',   icon: BarChart3, label: 'Charts'  },
  { id: 'journal',  icon: BookOpen,  label: 'Journal' },
  { id: 'utilities',icon: Wrench,    label: 'Utils'   },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-3"
      style={{ paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Floating glass pill — iOS-style */}
      <div
        className="flex items-center justify-around py-2 px-1 rounded-[28px]"
        style={{
          background: 'rgba(9, 11, 26, 0.72)',
          backdropFilter: 'blur(40px) saturate(2.2)',
          WebkitBackdropFilter: 'blur(40px) saturate(2.2)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.05) inset',
        }}
      >
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all"
              style={isActive ? {
                background: 'rgba(124, 58, 237, 0.18)',
              } : {}}
            >
              <Icon
                size={21}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  color: isActive ? '#a78bfa' : 'rgba(240,244,255,0.40)',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(124,58,237,0.7))' : 'none',
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#a78bfa' : 'rgba(240,244,255,0.35)' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
