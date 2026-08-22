import { useState } from 'react'
import { BADGE_DEFS } from '../../utils/gamification'
import { getLevelInfo, LEVELS } from '../../utils/gamification'
import { Zap, Lock } from 'lucide-react'

const CAT_LABELS = {
  milestone: '🎖️ Milestones',
  health:    '💪 Health',
  mind:      '🧠 Mind',
  work:      '💼 Work',
  learning:  '📚 Learning',
  spirit:    '🙏 Spirit',
  finance:   '💰 Finance',
}

const CATS = Object.keys(CAT_LABELS)

function BadgeItem({ badge, earned }) {
  return (
    <div className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
      earned ? 'bg-elevated border-accent/30 glow-accent' : 'bg-elevated border-border badge-locked'
    }`}>
      {!earned && (
        <div className="absolute top-1.5 right-1.5">
          <Lock size={10} className="text-gray-600" />
        </div>
      )}
      <span className="text-3xl">{badge.emoji}</span>
      <span className={`text-[11px] font-semibold text-center leading-tight ${earned ? 'text-white' : 'text-gray-500'}`}>
        {badge.name}
      </span>
      {earned && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
          <span className="text-[8px] text-white">✓</span>
        </div>
      )}
    </div>
  )
}

export default function ProgressScreen({ levelInfo, streaks, earnedBadges, totalXP, entries, embedded = false }) {
  const [activeFilter, setActiveFilter] = useState('milestone')
  const filteredBadges = BADGE_DEFS.filter(b => b.cat === activeFilter)
  const earnedCount = BADGE_DEFS.filter(b => earnedBadges.has(b.id)).length

  // Level roadmap data
  const nextLevels = LEVELS.filter(l => l.level > levelInfo.level).slice(0, 2)

  return (
    <div
      className={`${embedded ? 'px-4 space-y-5 animate-fade-in' : 'screen space-y-5 animate-fade-in'}`}
      style={embedded ? { paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))' } : {}}
    >
      {!embedded && <h1 className="text-xl font-bold text-white">Progress</h1>}

      {/* Level Hero */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-accent/20 to-accent-dark/10 border border-accent/20">
        <div className="absolute -top-8 -right-8 text-[100px] opacity-10 select-none">{levelInfo.emoji}</div>
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Your Rank</div>
          <div className="text-3xl font-black gradient-text-accent mb-0.5">
            {levelInfo.emoji} {levelInfo.title}
          </div>
          <div className="text-sm text-gray-400">Level {levelInfo.level} · {totalXP.toLocaleString()} XP total</div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{levelInfo.xpInLevel} / {levelInfo.rangeSize || '∞'} XP</span>
              <span>{Math.round(levelInfo.progress * 100)}% to next</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full xp-bar-fill"
                style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Streaks Grid */}
      <div>
        <p className="section-title">Streaks</p>
        <div className="grid grid-cols-2 gap-2">
          {streaks.map(s => (
            <div
              key={s.key}
              className={`bg-elevated rounded-2xl p-3 border ${s.current > 0 ? 'border-accent/20' : 'border-border'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{s.emoji}</span>
                <span className={`text-xs font-medium ${s.current > 0 ? 'text-emerald' : 'text-gray-600'}`}>
                  best: {s.best}d
                </span>
              </div>
              <div className={`text-2xl font-black ${s.current > 0 ? 'text-white' : 'text-gray-600'}`}>
                {s.current}d
              </div>
              <div className="text-[11px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-title m-0">Badges</p>
          <span className="text-xs text-gray-400">{earnedCount}/{BADGE_DEFS.length} earned</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === cat ? 'bg-accent text-white' : 'bg-elevated text-gray-400'
              }`}
            >
              {CAT_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {filteredBadges.map(badge => (
            <BadgeItem key={badge.id} badge={badge} earned={earnedBadges.has(badge.id)} />
          ))}
        </div>
      </div>

      {/* XP breakdown */}
      <div className="card">
        <p className="section-title">Stats</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total days logged</span>
            <span className="text-white font-semibold">{entries.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total XP earned</span>
            <span className="text-gold font-semibold flex items-center gap-1"><Zap size={12}/>{totalXP.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Badges earned</span>
            <span className="text-white font-semibold">{earnedCount}/{BADGE_DEFS.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Avg XP/day</span>
            <span className="text-white font-semibold">{entries.length ? Math.round(totalXP / entries.length) : 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
