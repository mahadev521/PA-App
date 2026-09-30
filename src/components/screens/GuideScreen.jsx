import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

// The playbook, in the app. A tool you have to remember how to use is a tool
// you stop using — the rules live next to the buttons.

const LOOPS = [
  {
    id: 'daily',
    title: '⚡ The 2-minute daily loop',
    tagline: 'Non-negotiable. Everything else is optional.',
    steps: [
      ['Morning — name the Big Rock', 'Open Home, tap the Big Rock card, write the one thing that would make today count. Not five things. One. If you only do that, the day was not wasted.'],
      ['All day — capture, never hold', 'Anything that enters your head goes into the ⊕ button, in plain language: "call Ravi tomorrow 6pm", "₹450 dinner", "buy milk". It reads the date, the amount and the right bucket. Your head is for thinking, not storage.'],
      ['Evening — tap the 20-second log', 'Six habit buttons on Home. Tap what you actually did. That alone writes today\'s entry and keeps your streak alive on a bad day.'],
    ],
    payoff: 'Two minutes a day buys you a searchable record of your own life, and a streak you stop breaking.',
  },
  {
    id: 'weekly',
    title: '🧭 The Sunday weekly loop',
    tagline: '10 minutes. This is where the app earns its keep.',
    steps: [
      ['Run the Weekly Review', 'Home → "Run a Weekly Review". It walks you through five screens in order.'],
      ['Read the numbers before you judge the week', 'Step 1 shows days logged, big rocks moved, deep work vs last week, sleep, family time. Feelings lie about weeks. Numbers do not.'],
      ['Empty the inbox', 'Everything you captured gets sorted: → Today, → Planned, or deleted. An inbox you never triage becomes a guilt pile.'],
      ['Kill stale reminders and settle debts', 'Overdue reminders that no longer matter get cleared. Money owed either gets chased or written off — deliberately.'],
      ['Write one line', 'One thing to change next week. It saves into your Journal, so in six months you can read what you kept promising yourself.'],
    ],
    payoff: 'The difference between logging your life and steering it.',
  },
  {
    id: 'monthly',
    title: '🔐 The monthly loop',
    tagline: '3 minutes. Boring. Do it anyway.',
    steps: [
      ['Export an encrypted backup', 'Settings → Export backup. Pick a passphrase you will not forget and save the file somewhere that is not this phone (cloud drive, email to yourself).'],
      ['Check the badge', 'Settings shows how many days since your last backup, and Home nags you after 21 days. Everything in this app lives in one browser — a cleared cache is a deleted life.'],
      ['Review the charts', 'Progress → Charts. Look at one metric over 8 weeks, not one day. Trends are real; days are noise.'],
    ],
    payoff: 'Insurance against the one mistake you cannot undo.',
  },
]

const FEATURES = [
  {
    emoji: '🔍',
    name: 'Search (magnifier on Home)',
    what: 'One box across everything — backlog, all 16 tools, journal, goals, people, checklists, errands, portfolio, and every Big Rock and win you ever logged.',
    use: 'Before you ask anyone a question, search your own brain first. "insurance", a person\'s name, a half-remembered lesson. If it is not findable, it is not a second brain.',
  },
  {
    emoji: '📅',
    name: "What's Coming (calendar on Home)",
    what: 'Every dated thing on one timeline: Overdue, Today, Tomorrow, This week, Later. Reminders, goal deadlines, decision reviews.',
    use: 'Check it once each morning. The badge turns red when something is overdue. This is the screen that stops surprises.',
  },
  {
    emoji: '⊕',
    name: 'Quick Capture',
    what: 'Type how you think. It extracts the date/time ("tomorrow 6pm", "friday", "in 3 days"), the amount ("₹450", "2k"), and picks the destination from the words you used.',
    use: 'Never leave the app open to "deal with it later". Capture in four seconds, sort on Sunday. Every chip is tappable if the guess is wrong.',
  },
  {
    emoji: '🎯',
    name: 'Big Rock',
    what: 'One thing per day, editable straight from Home, with a Done toggle.',
    use: 'Set it before you open anything else. Eat That Frog: the hardest, highest-impact task first, while you still have willpower.',
  },
  {
    emoji: '🧠',
    name: 'Decision Journal',
    what: 'Tools → Decisions. Record the call, the options you weighed, what you expect to happen, and a review date. On that date the app asks what actually happened and you grade it.',
    use: 'This is the regret engine. Memory rewrites every decision to look inevitable — this does not. After ten reviewed decisions you can see your real regret rate and what the bad calls have in common (rushed? alone? under pressure?).',
  },
  {
    emoji: '📥',
    name: 'Backlog → Today',
    what: 'Backlog is the unsorted inbox. Today is what you committed to, in six sections (Must Do, Quick Wins, Outside, Work, Home, Evening).',
    use: 'Keep Must Do at three to five items. A Today list of twenty is a Backlog wearing a costume.',
  },
  {
    emoji: '🚗',
    name: 'Errand Run',
    what: 'Plan a trip as a sequence of stops with items at each one.',
    use: 'Build it before you leave the house. Second trips are the tax on vague lists.',
  },
  {
    emoji: '🤝',
    name: 'People',
    what: 'A ledger per person: kind things, hurtful things, and favours owed in either direction.',
    use: 'Relationships decay silently. Log the favour the day it happens, then settle it. This is not score-keeping — it is remembering to be fair.',
  },
  {
    emoji: '🧾',
    name: 'Debts & Spends',
    what: 'Money you owe, money owed to you, and one-off spends worth reflecting on.',
    use: 'Log it the moment it happens, while it is still a number and not yet an awkward conversation.',
  },
  {
    emoji: '📖',
    name: 'Journal (Daily → Journal)',
    what: 'Experiences with what happened, the lesson, tags, and an impact rating. Mistakes get their own category.',
    use: 'Log every mistake that cost you money, time or a relationship. Then search it before repeating it. This is the single highest-return feature here — most people pay the same tuition twice.',
  },
  {
    emoji: '🏆',
    name: 'Levels, streaks & badges',
    what: 'XP from logged habits, nine ranks, streaks per habit, and 21 badges.',
    use: 'Do not chase XP. It is there to get you through the first 30 days, until the data itself becomes the reason you log.',
  },
  {
    emoji: '📊',
    name: 'Charts & Brain Pulse',
    what: 'Eight-week trends per metric, correlations, and short written insights on Home.',
    use: 'Come here with a question, not for a browse. "Does sleep actually change my mood?" The app correlates it and tells you.',
  },
]

const RULES = [
  ['Capture beats organise.', 'A messy inbox you actually write to beats a perfect system you avoid.'],
  ['One Big Rock, not a to-do list.', 'Days are won by one hard thing, not twelve easy ones.'],
  ['Log the mistake, or pay for it twice.', 'The Journal is the only thing here that compounds faster than money.'],
  ['Numbers before feelings.', 'Start every review with the data, not the mood.'],
  ['Review your decisions, not just your tasks.', 'Tasks tell you if you were busy. Decisions tell you if you were right.'],
  ['Back up monthly.', 'Everything here lives in one browser on one device.'],
  ['A streak survived is better than a perfect day.', 'Six taps on Home counts. Never break the chain over a busy day.'],
]

function Loop({ loop, open, onToggle }) {
  return (
    <div className="card">
      <button onClick={onToggle} className="w-full flex items-start justify-between gap-3 text-left">
        <span className="flex-1">
          <span className="block text-[15px] font-bold text-white leading-snug">{loop.title}</span>
          <span className="block text-[11px] mt-0.5" style={{ color: 'rgba(167,139,250,0.75)' }}>{loop.tagline}</span>
        </span>
        {open
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" />
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loop.steps.map(([label, body], i) => (
            <div key={label} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black mt-0.5"
                style={{ background: 'rgba(124,58,237,0.22)', color: '#c4b5fd' }}>
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white leading-snug">{label}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(240,244,255,0.55)' }}>{body}</p>
              </div>
            </div>
          ))}
          <div className="rounded-xl px-3 py-2.5 mt-1"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#10b981' }}>Why it pays</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.75)' }}>{loop.payoff}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GuideScreen({ onClose }) {
  const [openLoop, setOpenLoop] = useState('daily')
  const [openFeature, setOpenFeature] = useState(null)

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-base" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-white">📘 How to use this</h2>
          <p className="text-[11px] text-gray-500">Three loops, twelve tools, seven rules</p>
        </div>
        <button onClick={onClose} className="p-2.5 rounded-xl bg-elevated" aria-label="Close guide">
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>

        <div className="card-hero">
          <p className="text-sm font-bold text-white mb-1.5">The whole idea, in one line</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.68)' }}>
            Capture everything so your head is free, review it on a schedule so nothing rots,
            and grade your own decisions so you stop repeating the expensive ones. Growth is
            what falls out of doing that consistently — not what you get from a burst of effort.
          </p>
        </div>

        {/* ── The loops ── */}
        <div>
          <p className="section-title">Start here — the three loops</p>
          <div className="space-y-2.5">
            {LOOPS.map(loop => (
              <Loop key={loop.id} loop={loop}
                open={openLoop === loop.id}
                onToggle={() => setOpenLoop(openLoop === loop.id ? null : loop.id)} />
            ))}
          </div>
        </div>

        {/* ── Feature reference ── */}
        <div>
          <p className="section-title">What each thing is actually for</p>
          <div className="space-y-1.5">
            {FEATURES.map(f => {
              const open = openFeature === f.name
              return (
                <div key={f.name} className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={() => setOpenFeature(open ? null : f.name)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 text-left">
                    <span className="text-lg leading-none flex-shrink-0">{f.emoji}</span>
                    <span className="flex-1 text-[13px] font-semibold text-white/90 leading-snug">{f.name}</span>
                    {open
                      ? <ChevronUp size={14} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      : <ChevronDown size={14} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  </button>
                  {open && (
                    <div className="px-3.5 pb-3.5 space-y-2">
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.55)' }}>{f.what}</p>
                      <div className="rounded-xl px-3 py-2"
                        style={{ background: 'rgba(124,58,237,0.09)', border: '1px solid rgba(167,139,250,0.18)' }}>
                        <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#a78bfa' }}>How to get value</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.78)' }}>{f.use}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Rules ── */}
        <div>
          <p className="section-title">Seven rules that keep this working</p>
          <div className="space-y-2">
            {RULES.map(([rule, why], i) => (
              <div key={rule} className="flex gap-3 px-3.5 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="flex-shrink-0 text-[11px] font-black mt-0.5" style={{ color: 'rgba(167,139,250,0.55)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-white leading-snug">{rule}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(240,244,255,0.45)' }}>{why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="text-sm font-bold text-white mb-1.5">If you only do one thing</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.62)' }}>
            Capture into ⊕ the moment something enters your head, and run the Weekly Review on
            Sunday. Those two habits alone make the other fourteen screens worth having. Everything
            else you can grow into.
          </p>
        </div>

        {/* Worth knowing before you rely on something it can't do. */}
        <div className="card border border-gold/20">
          <p className="text-sm font-bold text-gold mb-2">What this app can't do</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.55)' }}>
            <li>
              <span className="text-white/80 font-semibold">Reminders only fire while the app is open.</span>{' '}
              There's no server pushing to your phone, so a 3am reminder reaches you next time you
              open Jarvis. That's exactly why <span className="text-white/80">What's Coming</span> exists
              — it is the reliable way to see what's due.
            </li>
            <li>
              <span className="text-white/80 font-semibold">Data is per-device.</span>{' '}
              No sync. Changing phones means Export on the old one, Import on the new one.
            </li>
            <li>
              <span className="text-white/80 font-semibold">Search matches text, not meaning.</span>{' '}
              "insurance" finds insurance; it won't find "insurence".
            </li>
          </ul>
        </div>

        <p className="text-[10px] text-center leading-relaxed" style={{ color: 'rgba(240,244,255,0.22)' }}>
          All data stays on this device. Nothing is sent to any server.
        </p>
      </div>
    </div>
  )
}
