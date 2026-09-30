import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, Info, AlertTriangle, Undo2 } from 'lucide-react'
import { haptic } from '../utils/haptics'

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: Check,          color: '#10b981', bg: 'rgba(16,185,129,0.14)',  border: 'rgba(16,185,129,0.32)' },
  info:    { icon: Info,           color: '#a78bfa', bg: 'rgba(124,58,237,0.16)',  border: 'rgba(167,139,250,0.32)' },
  warn:    { icon: AlertTriangle,  color: '#f59e0b', bg: 'rgba(245,158,11,0.14)',  border: 'rgba(245,158,11,0.32)' },
  error:   { icon: AlertTriangle,  color: '#f43f5e', bg: 'rgba(244,63,94,0.14)',   border: 'rgba(244,63,94,0.32)' },
}

let seq = 0

/**
 * Toasts double as the app's undo surface: any destructive action can hand over
 * an `undo` callback and the user gets a few seconds to take it back, which is
 * friendlier than a confirm dialog on every delete.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(list => list.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, opts = {}) => {
    const { variant = 'info', undo = null, actionLabel = 'Undo', duration } = opts
    const id = ++seq
    const ms = duration ?? (undo ? 6000 : 3000)
    setToasts(list => [...list.slice(-2), { id, message, variant, undo, actionLabel }])
    haptic(variant === 'error' ? 'error' : variant === 'warn' ? 'warn' : 'success')
    timers.current[id] = setTimeout(() => dismiss(id), ms)
    return id
  }, [dismiss])

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="fixed left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {toasts.map(t => {
          const v = VARIANTS[t.variant] || VARIANTS.info
          const Icon = v.icon
          return (
            <div
              key={t.id}
              role="status"
              className="w-full max-w-[420px] flex items-center gap-2.5 px-4 py-3 rounded-2xl pointer-events-auto animate-toast-in"
              style={{
                background: 'rgba(12,15,36,0.97)',
                border: `1px solid ${v.border}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: v.bg }}>
                <Icon size={14} style={{ color: v.color }} strokeWidth={2.6} />
              </span>
              <span className="flex-1 text-[13px] font-medium text-white leading-snug">{t.message}</span>
              {t.undo && (
                <button
                  onClick={() => { t.undo(); dismiss(t.id) }}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl active:scale-95 transition-transform"
                  style={{ background: 'rgba(167,139,250,0.18)', color: '#a78bfa' }}
                >
                  <Undo2 size={12} /> {t.actionLabel}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // Falling back to a no-op keeps components usable outside the provider
  // (e.g. if a screen is ever rendered standalone) instead of crashing.
  return ctx || { toast: () => {}, dismiss: () => {} }
}
