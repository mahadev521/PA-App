import { useMemo, useState } from 'react'
import { Zap, Plus, Check, Settings, ChevronRight, PartyPopper } from 'lucide-react'
import { todayStr } from '../../utils/gamification'
import { getDailyChallenge, getTimePulse, getWiseGreeting } from '../../utils/challenges'
import { getSmartInsights } from '../../utils/analytics'
import { getPendingFeed } from '../../utils/commandCenter'
import WeeklyReviewScreen from './WeeklyReviewScreen'


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

      <div className="px-1">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-0.5"
            style={{ color: i >= 5 ? 'rgba(167,139,250,0.5)' : 'rgba(240,244,255,0.28)' }}>{l}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
            <div key={date} className="aspect-square rounded-2xl flex items-center justify-center transition-all"
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
    </div>
  )
}

function StatPill({ emoji, label, value, color = 'text-white' }) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-xl leading-none">{emoji}</span>
      <span className={`text-xl font-black leading-none ${value ? color : 'text-gray-600'}`}>{value ?? '—'}</span>
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
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
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px] transition-all active:scale-95 ${
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

// ─── Life direction score spider web ─────────────────────────────

function DirectionScores({ scores, todayEntry }) {
  const dirs = [
    { key: 'god',    emoji: '🕊️', label: 'God',    color: '#fbbf24' },
    { key: 'health', emoji: '💪',  label: 'Health', color: '#06b6d4' },
    { key: 'wealth', emoji: '💰',  label: 'Wealth', color: '#10b981' },
    { key: 'family', emoji: '❤️',  label: 'Family', color: '#f472b6' },
    { key: 'pro',    emoji: '💼',  label: 'Work',   color: '#818cf8' },
  ]
  const logged = !!todayEntry
  const avg = logged
    ? Math.round(dirs.reduce((s, d) => s + (scores[d.key] || 0), 0) / dirs.length)
    : 0

  const cx = 110, cy = 110, r = 75, n = dirs.length
  const angle = (i) => (-Math.PI / 2) + (2 * Math.PI / n) * i
  const pt = (i, scale = 1) => [
    cx + r * scale * Math.cos(angle(i)),
    cy + r * scale * Math.sin(angle(i)),
  ]
  const poly = (scale) => dirs.map((_, i) => pt(i, scale).join(',')).join(' ')
  const scorePoints = dirs.map((d, i) =>
    pt(i, Math.max(0.01, (scores[d.key] || 0) / 100)).join(',')
  ).join(' ')

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title mb-0">Life Score Today</p>
        <span className="text-xs font-black px-2.5 py-1 rounded-xl" style={{
          background: !logged ? 'rgba(255,255,255,0.05)' : avg >= 70 ? 'rgba(16,185,129,0.15)' : avg >= 40 ? 'rgba(124,58,237,0.15)' : 'rgba(244,63,94,0.12)',
          color:      !logged ? 'rgba(240,244,255,0.28)' : avg >= 70 ? '#10b981'                : avg >= 40 ? '#a78bfa'               : '#f43f5e',
        }}>
          {logged ? `${avg}/100` : 'Log today'}
        </span>
      </div>

      <svg viewBox="0 0 220 220" className="w-full max-w-[260px] mx-auto">
        <defs>
          <radialGradient id="rfill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(124,58,237,0.45)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0.08)" />
          </radialGradient>
        </defs>

        {/* Spoke lines */}
        {dirs.map((_, i) => {
          const [x, y] = pt(i, 1)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        })}

        {/* Grid rings at 25/50/75/100 */}
        {[0.25, 0.5, 0.75, 1].map(s => (
          <polygon key={s} points={poly(s)} fill="none"
            stroke={s === 1 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={s === 1 ? 1.2 : 0.8} />
        ))}

        {/* Score polygon */}
        {logged && (
          <polygon points={scorePoints}
            fill="url(#rfill)"
            stroke="rgba(167,139,250,0.75)"
            strokeWidth="1.5" strokeLinejoin="round" />
        )}

        {/* Score dots */}
        {logged && dirs.map((d, i) => {
          const v = (scores[d.key] || 0) / 100
          if (!v) return null
          const [x, y] = pt(i, v)
          return <circle key={d.key} cx={x} cy={y} r="3.5"
            fill={d.color} stroke="rgba(9,11,26,0.8)" strokeWidth="1.5" />
        })}

        {/* Axis emoji labels */}
        {dirs.map((d, i) => {
          const [x, y] = pt(i, 1.21)
          return (
            <text key={d.key} x={x} y={y}
              textAnchor="middle" dominantBaseline="middle" fontSize="17">
              {d.emoji}
            </text>
          )
        })}
      </svg>

      {/* Score legend */}
      <div className="flex justify-around mt-1 px-2">
        {dirs.map(d => (
          <div key={d.key} className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-black leading-none"
              style={{ color: logged && (scores[d.key] || 0) > 0 ? d.color : 'rgba(240,244,255,0.25)' }}>
              {scores[d.key] || 0}
            </span>
            <span className="text-[9px] text-gray-600">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Command Center ────────────────────────────────────────────────

const URGENCY_STYLE = {
  overdue: { cls: 'border-rose/25 bg-rose/5',     text: 'text-rose' },
  today:   { cls: 'border-accent/25 bg-accent/5', text: 'text-accent-light' },
  info:    { cls: 'border-sky/20 bg-sky/5',       text: 'text-sky' },
}

function CommandCenter({ feed, onNavigate, onOpenWeeklyReview }) {
  if (feed.length === 0) {
    return (
      <div className="card flex items-center gap-3 border border-emerald/20 bg-emerald/5">
        <PartyPopper size={20} className="text-emerald flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">You're all caught up</p>
          <p className="text-xs text-gray-400">Nothing needs your attention right now.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="section-title">🎯 Needs Your Attention</p>
      <div className="space-y-2">
        {feed.map(item => {
          const style = URGENCY_STYLE[item.urgency]
          return (
            <button
              key={item.id}
              onClick={() => item.target === 'weekly-review' ? onOpenWeeklyReview() : onNavigate(item.target)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all active:scale-[0.99] ${style.cls}`}
            >
              <span className="text-lg leading-none flex-shrink-0">{item.emoji}</span>
              <span className={`flex-1 text-sm font-medium ${style.text}`}>{item.text}</span>
              <ChevronRight size={15} className="text-gray-500 flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────

export default function HomeScreen({
  levelInfo, streaks, todayEntry, todayXP, logStreak, onNavigate, profile, onSave, entries,
  backlog, utilityItems, errandRuns,
  onUpdateBacklogStatus, onDeleteBacklog, onSetBacklogReminder, onSetUtilityItemReminder,
  onToggleUtilityItem, onDeleteUtilityItem, onAddExperience, onUpdateProfile,
}) {
  const greeting = useMemo(() => getWiseGreeting(profile?.name), [profile])
  const scores = calcScores(todayEntry)
  const activeStreaks = streaks.filter(s => s.current > 0).slice(0, 5)
  const insights = useMemo(() => getSmartInsights(entries || [], streaks), [entries, streaks])
  const feed = useMemo(
    () => getPendingFeed({ backlog: backlog || [], utilityItems: utilityItems || [], errandRuns: errandRuns || [], profile }),
    [backlog, utilityItems, errandRuns, profile]
  )
  const [showWeeklyReview, setShowWeeklyReview] = useState(false)

  return (
    <div className="screen space-y-4 animate-fade-in">

      {/* ── Command Center ───────────────────────────────────────── */}
      <CommandCenter feed={feed} onNavigate={onNavigate} onOpenWeeklyReview={() => setShowWeeklyReview(true)} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-3">
          <p className="text-[11px] font-medium mb-0.5" style={{ color: 'rgba(240,244,255,0.30)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-[22px] font-black text-white leading-tight">{greeting}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {todayXP > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}>
              <Zap size={11} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-black text-gold">+{todayXP}</span>
            </div>
          )}
          <button onClick={() => onNavigate('settings')}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Settings size={16} style={{ color: 'rgba(240,244,255,0.5)' }} />
          </button>
        </div>
      </div>

      {/* ── Level / XP ──────────────────────────────────────────── */}
      <button className="card-elevated glow-accent w-full text-left active:scale-[0.99] transition-transform"
        onClick={() => onNavigate('life')}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: 'rgba(167,139,250,0.55)' }}>Current Rank</div>
            <div className="text-xl font-black gradient-text-accent">{levelInfo.emoji} {levelInfo.title}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 mb-0.5">Level {levelInfo.level}</div>
            <div className="text-sm font-black text-white">
              {levelInfo.xpInLevel}
              <span className="text-gray-500 font-normal text-xs"> / {levelInfo.rangeSize || '∞'}</span>
            </div>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full xp-bar-fill" style={{ width: `${Math.round(levelInfo.progress * 100)}%` }} />
        </div>
        <div className="flex justify-between text-[11px]" style={{ color: 'rgba(240,244,255,0.38)' }}>
          <span>{Math.round(levelInfo.progress * 100)}% → Level {levelInfo.level + 1}</span>
          {todayXP > 0 && <span className="text-gold font-semibold">+{todayXP} XP today</span>}
        </div>
        {activeStreaks.length > 0 && (
          <div className="flex gap-4 mt-3.5 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            {activeStreaks.map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="text-base leading-none">{s.emoji}</span>
                <span className="text-xs font-black text-white">{s.current}<span className="text-gray-500 font-normal">d</span></span>
              </div>
            ))}
          </div>
        )}
      </button>

      {/* ── Brain Pulse Insights ─────────────────────────────────── */}
      {insights.length > 0 && (
        <div>
          <p className="section-title">🧠 Brain Pulse</p>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={`w-full px-4 py-3 rounded-2xl border text-xs leading-relaxed ${
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

      {/* ── Daily Challenge ──────────────────────────────────────── */}
      <DailyChallenge todayEntry={todayEntry} onSave={onSave} />

      {/* ── Time Pulse ───────────────────────────────────────────── */}
      <TimePulse />

      {/* ── Today's Metrics ──────────────────────────────────────── */}
      <div>
        <p className="section-title">Today's Metrics</p>
        {todayEntry ? (
          <div className="grid grid-cols-3 gap-2">
            <StatPill emoji="🔥" label="Deep Work" value={todayEntry.deep_work_hours ? `${todayEntry.deep_work_hours}h`      : null} color="text-orange-400" />
            <StatPill emoji="😴" label="Sleep"     value={todayEntry.sleep_hours      ? `${todayEntry.sleep_hours}h`          : null} color="text-sky" />
            <StatPill emoji="⚡" label="Energy"    value={todayEntry.energy_score     ? `${todayEntry.energy_score}/10`       : null} color="text-emerald" />
            <StatPill emoji="📚" label="Learning"  value={todayEntry.learning_minutes ? `${todayEntry.learning_minutes}m`     : null} color="text-accent-light" />
            <StatPill emoji="💧" label="Water"     value={todayEntry.water_liters     ? `${todayEntry.water_liters}L`         : null} color="text-sky" />
            <StatPill emoji="❤️" label="Family"    value={todayEntry.family_time      ? `${todayEntry.family_time}m`          : null} color="text-pink-400" />
          </div>
        ) : (
          <div className="card text-center py-7" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-bold text-white mb-1">Nothing logged today</p>
            <p className="text-xs text-gray-500 mb-4">Track your day to see your life scores</p>
            <button onClick={() => onNavigate('daily')} className="btn-primary inline-flex items-center gap-2 mx-auto">
              <Plus size={15} /> Log Today
            </button>
          </div>
        )}
      </div>

      {/* ── Life Direction Scores ────────────────────────────────── */}
      <DirectionScores scores={scores} todayEntry={todayEntry} />

      {/* ── Month Tracker ────────────────────────────────────────── */}
      <MonthTracker entries={entries || []} />

      {showWeeklyReview && (
        <WeeklyReviewScreen
          backlog={backlog || []}
          utilityItems={utilityItems || []}
          onUpdateBacklogStatus={onUpdateBacklogStatus}
          onDeleteBacklog={onDeleteBacklog}
          onSetBacklogReminder={onSetBacklogReminder}
          onSetUtilityItemReminder={onSetUtilityItemReminder}
          onToggleUtilityItem={onToggleUtilityItem}
          onDeleteUtilityItem={onDeleteUtilityItem}
          onAddExperience={onAddExperience}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setShowWeeklyReview(false)}
        />
      )}

    </div>
  )
}
