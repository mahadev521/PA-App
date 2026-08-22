import { Home, PenLine, BarChart3, BookOpen, Star } from 'lucide-react'

const TABS = [
  { id: 'home',    icon: Home,      label: 'Home'    },
  { id: 'log',     icon: PenLine,   label: 'Log'     },
  { id: 'ritual',  icon: Star,      label: 'Ritual'  },
  { id: 'charts',  icon: BarChart3, label: 'Charts'  },
  { id: 'journal', icon: BookOpen,  label: 'Journal' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-surface/90 backdrop-blur-xl border-t border-border z-50"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]' : ''}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-accent' : 'text-gray-500'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
