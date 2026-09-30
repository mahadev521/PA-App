import { Check } from 'lucide-react'
import { todayStr, calculateDayXP } from '../utils/gamification'
import { haptic } from '../utils/haptics'

// The streak saver. A full daily log takes a few minutes; on a bad day that is
// enough friction to break a 40-day chain. These six taps write a real entry
// for today, so the streak survives and the day still counts for something.

const HABITS = [
  { key: 'prayer_done',          emoji: '🙏', label: 'Prayer',   on: () => true,  off: () => false, xp: 30 },
  { key: 'water_liters',         emoji: '💧', label: '2L water', on: () => 2,     off: () => 0,     xp: 25, isValue: true },
  { key: 'workout_minutes',      emoji: '🏋️', label: 'Moved',    on: () => 30,    off: () => 0,     xp: 15, isValue: true },
  { key: 'family_kindness',      emoji: '❤️', label: 'Family',   on: () => true,  off: () => false, xp: 25 },
  { key: 'morning_ritual',       emoji: '🌅', label: 'Ritual',   on: () => true,  off: () => false, xp: 50 },
  { key: 'reflection_completed', emoji: '🪞', label: 'Reflected',on: () => true,  off: () => false, xp: 30 },
]

function isOn(entry, habit) {
  const v = entry?.[habit.key]
  return habit.isValue ? (v || 0) > 0 : v === true
}

export default function QuickLogStrip({ todayEntry, onSave, onOpenFullLog }) {
  const doneCount = HABITS.filter(h => isOn(todayEntry, h)).length
  const xp = todayEntry ? calculateDayXP(todayEntry) : 0

  async function toggle(habit) {
    const on = isOn(todayEntry, habit)
    haptic(on ? 'tap' : 'success')
    await onSave({
      ...(todayEntry || {}),
      date: todayStr(),
      [habit.key]: on ? habit.off() : habit.on(),
    })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title mb-0">⚡ 20-Second Log</p>
        <div className="flex items-center gap-2">
          {xp > 0 && <span className="text-[11px] font-black text-gold">+{xp} XP</span>}
          <span className="text-[11px] font-bold" style={{ color: 'rgba(240,244,255,0.35)' }}>
            {doneCount}/{HABITS.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HABITS.map(h => {
          const on = isOn(todayEntry, h)
          return (
            <button
              key={h.key}
              onClick={() => toggle(h)}
              className="relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: on ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
                border: on ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.07)',
              }}
              aria-pressed={on}
            >
              <span className="text-xl leading-none">{h.emoji}</span>
              <span className="text-[10px] font-semibold leading-none"
                style={{ color: on ? '#6ee7b7' : 'rgba(240,244,255,0.42)' }}>
                {h.label}
              </span>
              {on && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: '#10b981' }}>
                  <Check size={9} color="#04140e" strokeWidth={4} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button onClick={onOpenFullLog}
        className="w-full mt-2.5 py-2 text-[11px] font-semibold rounded-xl active:scale-[0.99] transition-transform"
        style={{ color: 'rgba(167,139,250,0.75)', background: 'rgba(124,58,237,0.08)' }}>
        Open the full daily log →
      </button>

      {!todayEntry && (
        <p className="text-[11px] mt-2 text-center leading-relaxed" style={{ color: 'rgba(240,244,255,0.28)' }}>
          One tap counts as logging today. Never break the chain over a busy day.
        </p>
      )}
    </div>
  )
}
