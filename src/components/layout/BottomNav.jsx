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
      className="w-full flex-shrink-0"
      style={{
        background: 'rgba(7,9,20,0.97)',
        backdropFilter: 'blur(48px) saturate(2.4)',
        WebkitBackdropFilter: 'blur(48px) saturate(2.4)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom: 'calc(0.45rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {TABS.map(({ id, icon: Icon, label, from, glow }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-1 flex-1 py-1 transition-all active:scale-90"
            >
              <div
                className="w-11 h-11 flex items-center justify-center rounded-[16px] transition-all duration-300"
                style={isActive ? {
                  background: `linear-gradient(145deg, ${from}, ${from}cc)`,
                  boxShadow: `0 3px 16px ${glow}`,
                } : {}}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.7}
                  color={isActive ? '#fff' : 'rgba(240,244,255,0.32)'}
                />
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: isActive ? from : 'rgba(240,244,255,0.28)' }}
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
