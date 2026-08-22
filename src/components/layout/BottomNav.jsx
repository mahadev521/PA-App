import { Home, PenLine, Layers, Compass } from 'lucide-react'

const TABS = [
  {
    id: 'home',
    icon: Home,
    label: 'Home',
    from: '#7c3aed', to: '#6d28d9',
    glow: 'rgba(124,58,237,0.55)',
  },
  {
    id: 'daily',
    icon: PenLine,
    label: 'Daily',
    from: '#0d9488', to: '#0f766e',
    glow: 'rgba(13,148,136,0.55)',
  },
  {
    id: 'utilities',
    icon: Layers,
    label: 'Utils',
    from: '#d97706', to: '#b45309',
    glow: 'rgba(217,119,6,0.55)',
  },
  {
    id: 'life',
    icon: Compass,
    label: 'Stats',
    from: '#e11d48', to: '#be123c',
    glow: 'rgba(225,29,72,0.55)',
  },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-5"
      style={{ paddingBottom: 'calc(1.1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="flex items-center justify-around py-3 px-2 rounded-[32px]"
        style={{
          background: 'rgba(7,9,20,0.92)',
          backdropFilter: 'blur(48px) saturate(2.4)',
          WebkitBackdropFilter: 'blur(48px) saturate(2.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 -1px 0 rgba(255,255,255,0.06) inset, 0 2px 0 rgba(255,255,255,0.04) inset,' +
            '0 8px 48px rgba(0,0,0,0.6), 0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {TABS.map(({ id, icon: Icon, label, from, to, glow }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-1.5 px-3 transition-all active:scale-90"
            >
              <div
                className="w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300"
                style={
                  isActive
                    ? {
                        background: `linear-gradient(145deg, ${from}, ${to})`,
                        boxShadow: `0 4px 24px ${glow}, 0 0 0 1px ${from}30`,
                      }
                    : {
                        background: 'rgba(255,255,255,0.055)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }
                }
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.4 : 1.7}
                  color={isActive ? '#ffffff' : 'rgba(240,244,255,0.32)'}
                />
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{
                  color: isActive ? from : 'rgba(240,244,255,0.28)',
                }}
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
