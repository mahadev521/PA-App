import { useMemo } from 'react'
import { Zap, Plus, Check, Settings } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { todayStr } from '../../utils/gamification'
import { getDailyChallenge, getTimePulse, getWiseGreeting } from '../../utils/challenges'
import { getSmartInsights } from '../../utils/analytics'

// ─── Direction scores from today's entry ─────────────────────────

const DIRECTIONS = [
  { key: 'god',    label: 'God',    emoji: '🕊️', color: 'bg-yellow-400' },
  { key: 'health', label: 'Health', emoji: '💪',  color: 'bg-sky-400'    },
  { key: 'wealth', label: 'Wealth', emoji: '💰',  color: 'bg-emerald-400'},
  { key: 'family', label: 'Family', emoji: '❤️',  color: 'bg-pink-400'   },
  { key: 'pro',    label: 'Work',   emoji: '💼',  color: 'bg-indigo-400' },
]

function calcScores(e) {
  if (!e) return { god: 0, health: 0, wealth: 0, family: 0, pro: 0 }
  return {
    god:    Math.min(100, (e.prayer_done?40:0) + Math.min(40,(e.god_minutes||0)/30*40) + ((e.meditation_minutes||0)>0?20:0)),
    health: Math.min(100, ((e.sleep_hours>=7&&e.sleep_hours<=9)?25:0) + ((e.water_liters>=2)?25:0) + ((e.workout_minutes>0)?25:0) + ((e.steps>=8000)?25:0)),
    wealth: Math.min(100, (e.paid_yourself_first?40:0) + (e.avoided_impulse?30:0) + (e.financial_learning?30:0)),
    family: Math.min(100, Math.min(100,(e.family_time||0)/60*100)),
    pro:    Math.min(100, ((e.deep_work_hours||0)/8*50) + Math.min(25,(e.learning_minutes||0)/60*25) + Math.min(25,(e.tasks_completed||0)/10*25)),
  }
}

// ─── Month tracker: full calendar grid ───────────────────────────

function getMonthCells() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0
  const pad = d => String(d).padStart(2, '0')
  const cells = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${pad(month + 1)}-${pad(d)}`, day: d })
  }
  return cells
}

function MonthTracker({ entries }) {
  const today = todayStr()
  const byDate = Object.fromEntries(entries.map(e => [e.date, e]))
  const cells = useMemo(() => getMonthCells(), [])

  const pastCells = cells.filter(c => c && c.date <= today)
  const loggedCount = pastCells.filter(c => byDate[c.date]).length
  const pct = pastCells.length ? Math.round((loggedCount / pastCells.length) * 100) : 0
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2.5">
        <p className="section-title mb-0">{monthName}</p>
        <span className="text-xs font-bold" style={{
          color: pct >= 80 ? '#10b981' : pct >= 50 ? '#a78bfa' : 'rgba(240,244,255,0.45)',
        }}>
          {loggedCount}/{pastCells.length} days · {pct}%
        </span>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-0.5"
            style={{ color: i >= 5 ? 'rgba(167,139,250,0.5)' : 'rgba(240,244,255,0.28)' }}>{l}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} className="aspect-square" />
          const { date, day } = cell
          const isToday = date === today
          const isFuture = date > today
          const logged = !!byDate[date]

          let bg, textColor, borderStyle
          if (isToday && logged)  { bg = 'rgba(124,58,237,0.35)'; textColor = '#c4b5fd'; borderStyle = '1.5px solid rgba(167,139,250,0.7)' }
          else if (isToday)       { bg = 'rgba(124,58,237,0.18)'; textColor = '#a78bfa'; borderStyle = '1.5px solid rgba(167,139,250,0.6)' }
          else if (logged)        { bg = 'rgba(16,185,129,0.22)'; textColor = '#6ee7b7'; borderStyle = '1px solid rgba(16,185,129,0.35)' }
          else if (isFuture)      { bg = 'rgba(255,255,255,0.03)'; textColor = 'rgba(240,244,255,0.18)'; borderStyle = '1px solid rgba(255,255,255,0.05)' }
          else                    { bg = 'rgba(244,63,94,0.10)'; textColor = 'rgba(244,63,94,0.55)'; borderStyle = '1px solid rgba(244,63,94,0.15)' }

          return (
            <div key={date} className="aspect-square rounded-lg flex items-center justify-center transition-all"
              style={{ background: bg, border: borderStyle }}>
              {logged && !isFuture
                ? <Check size={11} strokeWidth={2.8} style={{ color: isToday ? '#c4b5fd' : '#6ee7b7' }} />
                : <span className="text-[11px] font-semibold leading-none" style={{ color: textColor }}>{day}</span>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatPill({ emoji, label, value, color = 'text-white' }) {
  return (
    <div className="bg-elevated rounded-2xl p-4 flex flex-col gap-1.5">
      <span className="text-xl">{emoji}</span>
      <span className={`text-2xl font-bold ${color}`}>{value ?? '—'}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function StreakPill({ emoji, label, count }) {
  return (
    <div className={`flex items-center gap-3 bg-elevated rounded-2xl px-4 py-3.5 ${count > 0 ? '' : 'opacity-40'}`}>
      <span className="text-xl">{emoji}</span>
      <div>
        <div className="text-base font-bold text-white">{count}d</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  )
}

// ─── Time Pulse ───────────────────────────────────────────────────

function TimePulse() {
  const t = useMemo(() => getTimePulse(), [])
  return (
    <div className="card space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">⏳ Time Pulse</span>
        <span className="text-xs text-gray-500">Day {t.dayOfYear} of year</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-elevated rounded-xl p-2.5">
          <p className="text-gray-400">Week of year</p>
          <p className="text-white font-bold text-lg">{t.weekOfYear}<span className="text-gray-500 font-normal text-xs">/52</span></p>
        </div>
        <div className="bg-elevated rounded-xl p-2.5">
          <p className="text-gray-400">{t.monthName} ends in</p>
          <p className={`font-bold text-lg ${t.daysLeftInMonth <= 5 ? 'text-rose' : 'text-white'}`}>{t.daysLeftInMonth}<span className="text-gray-500 font-normal text-xs"> days</span></p>
        </div>
        <div className="bg-elevated rounded-xl p-2.5">
          <p className="text-gray-400">Weekends left</p>
          <p className="text-gold font-bold text-lg">{t.weekendsLeft}<span className="text-gray-500 font-normal text-xs"> this year</span></p>
        </div>
        <div className="bg-elevated rounded-xl p-2.5">
          <p className="text-gray-400">Year used</p>
          <p className={`font-bold text-lg ${t.yearPct > 75 ? 'text-rose' : t.yearPct > 50 ? 'text-gold' : 'text-emerald'}`}>{t.yearPct}%</p>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 italic text-center">
        {t.daysLeftInYear} days remain in {new Date().getFullYear()}. Every one of them is a choice.
      </p>
    </div>
  )
}

// ─── Daily Challenge ──────────────────────────────────────────────

const CAT_COLORS = {
  god:    'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
  health: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  wealth: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  family: 'text-pink-300 bg-pink-500/10 border-pink-500/20',
  pro:    'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
  people: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
  mind:   'text-accent-light bg-accent/10 border-accent/20',
}

function DailyChallenge({ todayEntry, onSave }) {
  const challenge = useMemo(() => getDailyChallenge(), [])
  const done = !!todayEntry?.challenge_done
  const catColor = CAT_COLORS[challenge.cat] || CAT_COLORS.mind

  async function toggle() {
    if (!onSave) return
    await onSave({ ...(todayEntry || {}), date: todayStr(), challenge_done: !done })
  }

  return (
    <div className={`card border space-y-3 ${done ? 'border-emerald/30 bg-emerald/5' : 'border-accent/20'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-accent uppercase tracking-widest">⭐ Today's Challenge</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
          {challenge.emoji} {challenge.cat.charAt(0).toUpperCase() + challenge.cat.slice(1)}
        </span>
      </div>

      <p className="text-sm font-semibold text-white leading-relaxed">"{challenge.text}"</p>

      <p className="text-xs text-gray-400 italic border-l-2 border-accent/30 pl-2 leading-relaxed">
        {challenge.why}
      </p>

      <button
        onClick={toggle}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${
          done
            ? 'bg-emerald/20 border border-emerald text-emerald'
            : 'bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30'
        }`}
      >
        {done ? (
          <><Check size={16} /> Done — you're building who you want to be.</>
        ) : (
          '↑ Mark as Done'
        )}
      </button>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────

export default function HomeScreen({ levelInfo, streaks, todayEntry, todayXP, logStreak, onNavigate, profile, onSave, entries }) {
  const greeting = useMemo(() => getWiseGreeting(profile?.name), [profile])
  const scores = calcScores(todayEntry)
  const topStreaks = streaks.slice(0, 4)
  const insights = useMemo(() => getSmartInsights(entries || [], streaks), [entries, streaks])

  const radarData = DIRECTIONS.map(d => ({ direction: d.label, score: scores[d.key], fullMark: 100 }))
  const firstName = profile?.name?.split(' ')[0] || ''

  return (
    <div className="screen space-y-5 animate-fade-in">

      {/* Personal creed — always first, always visible */}
      <div
        className="rounded-3xl px-5 py-5 space-y-3"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(9,11,26,0.6) 100%)',
          border: '1px solid rgba(167,139,250,0.25)',
          boxShadow: '0 0 40px rgba(124,58,237,0.12)',
        }}
      >
        <p
          className="text-base font-bold leading-snug"
          style={{ color: '#e2d9ff', letterSpacing: '-0.01em' }}
        >
          "If you have something left for you to do, you have no right of thinking about anything else."
        </p>
        <div className="h-px" style={{ background: 'rgba(167,139,250,0.2)' }} />
        <p
          className="text-sm font-semibold"
          style={{ color: 'rgba(167,139,250,0.85)' }}
        >
          → What do you have to do next?
        </p>
      </div>

      {/* Header: greeting + settings */}
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-3">
          <p className="text-xs mb-0.5" style={{ color: 'rgba(240,244,255,0.38)' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
          <p className="text-base font-semibold text-white leading-snug">{greeting}</p>
        </div>
        <button onClick={() => onNavigate('settings')} className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <Settings size={18} style={{ color: 'rgba(240,244,255,0.55)' }} />
        </button>
      </div>

      {/* Level + XP — tappable → Progress */}
      <button className="card-elevated glow-accent space-y-3 w-full text-left active:scale-[0.98] transition-transform"
        onClick={() => onNavigate('life')}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest" style={{ color: 'rgba(240,244,255,0.45)' }}>
              Level {levelInfo.level} · Tap for details
            </div>
            <div className="text-xl font-bold gradient-text-accent">{levelInfo.emoji} {levelInfo.title}</div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: 'rgba(240,244,255,0.40)' }}>Today</div>
            <div className="flex items-center gap-1">
              <Zap size={14} className="text-gold" />
              <span className="text-gold font-bold text-lg">+{todayXP} XP</span>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(240,244,255,0.40)' }}>
            <span>{levelInfo.xpInLevel} / {levelInfo.rangeSize || '∞'} XP</span>
            <span>{Math.round(levelInfo.progress * 100)}% to next</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full xp-bar-fill" style={{ width: `${Math.round(levelInfo.progress * 100)}%` }} />
          </div>
        </div>
      </button>

      {/* Month Tracker */}
      <MonthTracker entries={entries || []} />

      {/* Time Pulse */}
      <TimePulse />

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div>
          <p className="section-title">🧠 Brain Pulse</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {insights.map((ins, i) => (
              <div key={i} className={`flex-shrink-0 w-[280px] px-3.5 py-3 rounded-2xl border text-xs leading-relaxed ${
                ins.type === 'warn' ? 'bg-rose/5 border-rose/20 text-gray-200' :
                ins.type === 'pos'  ? 'bg-emerald/5 border-emerald/20 text-gray-200' :
                'bg-accent/5 border-accent/20 text-gray-200'
              }`}>
                <span className="mr-1">{ins.emoji}</span>{ins.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Challenge */}
      <DailyChallenge todayEntry={todayEntry} onSave={onSave} />

      {/* Life Balance Radar */}
      <div>
        <p className="section-title">Life Balance</p>
        <div className="card" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="direction"
                tick={{ fill: 'rgba(240,244,255,0.50)', fontSize: 11, fontWeight: 600 }} />
              <Radar dataKey="score" fill="#7c3aed" fillOpacity={0.22}
                stroke="#a78bfa" strokeWidth={2}
                dot={{ fill: '#a78bfa', r: 3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Stats */}
      <div>
        <p className="section-title">Today's metrics</p>
        {todayEntry ? (
          <div className="grid grid-cols-3 gap-2">
            <StatPill emoji="🔥" label="Deep Work" value={todayEntry.deep_work_hours ? `${todayEntry.deep_work_hours}h` : null} color="text-orange-400" />
            <StatPill emoji="😴" label="Sleep" value={todayEntry.sleep_hours ? `${todayEntry.sleep_hours}h` : null} color="text-sky" />
            <StatPill emoji="⚡" label="Energy" value={todayEntry.energy_score ? `${todayEntry.energy_score}/10` : null} color="text-emerald" />
            <StatPill emoji="📚" label="Learning" value={todayEntry.learning_minutes ? `${todayEntry.learning_minutes}m` : null} color="text-accent-light" />
            <StatPill emoji="💧" label="Water" value={todayEntry.water_liters ? `${todayEntry.water_liters}L` : null} color="text-sky" />
            <StatPill emoji="❤️" label="Family" value={todayEntry.family_time ? `${todayEntry.family_time}m` : null} color="text-pink-400" />
          </div>
        ) : (
          <div className="card border border-dashed flex flex-col items-center gap-3 py-8"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-sm text-center" style={{ color: 'rgba(240,244,255,0.45)' }}>Nothing logged yet today.</p>
            <button onClick={() => onNavigate('daily')} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Log Today
            </button>
          </div>
        )}
      </div>

      {/* Streaks */}
      <div>
        <p className="section-title">Active streaks</p>
        <div className="grid grid-cols-2 gap-2">
          {topStreaks.map(s => (
            <StreakPill key={s.key} emoji={s.emoji} label={s.label} count={s.current} />
          ))}
        </div>
      </div>

    </div>
  )
}
