import { useState, useEffect } from 'react'
import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { todayStr } from '../../utils/gamification'

// ─── All ritual groups ────────────────────────────────────────────

const MORNING_ITEMS = [
  { id: 'no_phone_morning',  emoji: '📵', label: 'No phone first 30 min',           time: 0,  principle: 'Atomic Habits — your environment controls default behavior. Protect the first 30 min from reactive mode.', book: 'Atomic Habits' },
  { id: 'drink_water',       emoji: '💧', label: 'Drink 500ml water',                time: 1,  principle: 'Compound Effect — tiny consistent acts compound into identity. You become someone who cares for their body.', book: 'The Compound Effect' },
  { id: 'gratitude',         emoji: '🙏', label: '3 things I\'m grateful for',       time: 3,  principle: 'Stoic morning reflection — begin in gratitude, not complaint. This one act sets the frame for the whole day.', book: 'Stoicism' },
  { id: 'exercise',          emoji: '🏋️', label: 'Exercise / move your body',        time: 20, principle: '7 Habits Habit 7: Sharpen the Saw (physical). Your body is the machine behind everything. Maintain it daily.', book: '7 Habits' },
  { id: 'cold_shower',       emoji: '🚿', label: 'Cold shower',                      time: 5,  principle: 'Stoicism (Seneca) — voluntary discomfort. Finish your workout with cold water — discipline stacked on discipline.', book: 'Stoicism' },
  { id: 'morning_skincare',  emoji: '🧴', label: 'Morning skin care routine',        time: 3,  principle: 'Self-respect precedes discipline. A man who maintains himself signals: I am worth investing in.', book: 'Identity-Based' },
  { id: 'scripture',         emoji: '📖', label: 'Scripture / spiritual reading',    time: 10, principle: '7 Habits Habit 7: Sharpen the Saw (spiritual). Feed the soul before the world demands from it.', book: '7 Habits' },
  { id: 'meditate',          emoji: '🧘', label: 'Meditate (10 min)',                time: 10, principle: 'Atomic Habits — focus is a skill trained by daily reps. 10 min/day = 60 hours of focus training per year.', book: 'Atomic Habits' },
  { id: 'eat_frog',          emoji: '🐸', label: 'Identify your ONE Frog',           time: 2,  principle: 'Eat That Frog — if you eat a live frog first thing, nothing worse can happen to you the rest of the day.', book: 'Eat That Frog' },
]

// Cal Newport's "Attention Residue" work-entry ritual
const WORK_START_ITEMS = [
  { id: 'ws_dnd',     emoji: '📵', label: 'Phone on silent / DND on',                  time: 0,  principle: 'Deep Work — every notification is a bid for your attention. Attention once lost is not easily recovered.', book: 'Deep Work' },
  { id: 'ws_outcome', emoji: '📋', label: 'Write the ONE outcome this session produces', time: 2,  principle: 'Eat That Frog — pre-deciding removes decision fatigue. Know what done looks like before you start.', book: 'Eat That Frog' },
  { id: 'ws_desk',    emoji: '🌊', label: 'Clear your desk or close unneeded tabs',      time: 2,  principle: 'Atomic Habits — environment design shapes behavior before willpower gets involved.', book: 'Atomic Habits' },
  { id: 'ws_water',   emoji: '💧', label: 'Water / drink within reach',                  time: 0,  principle: 'Eliminating micro-interruptions protects the flow state you\'re about to enter.', book: 'Deep Work' },
  { id: 'ws_signal',  emoji: '🎧', label: 'Headphones on — signal: deep work has begun', time: 0,  principle: 'Deep Work — rituals signal to your brain "it\'s time to focus." Build the association daily.', book: 'Deep Work' },
  { id: 'ws_timer',   emoji: '⏱️', label: 'Set a session timer (25-90 min)',              time: 0,  principle: 'Timeboxing creates urgency. Without an end, a task expands to fill all available time.', book: 'Deep Work' },
  { id: 'ws_frog',    emoji: '🐸', label: 'Start with the hardest sub-task first',        time: 0,  principle: 'Eat That Frog applies inside each session too. Eat the frog while energy is highest.', book: 'Eat That Frog' },
]

// Sophie Leroy's attention residue research — switching without closing leaves you half-present
const TASK_SWITCH_ITEMS = [
  { id: 'ts_capture',  emoji: '✍️', label: 'Write: "I left off at..." (one sentence)',    time: 1,  principle: 'Attention Residue research — open loops keep your brain on the previous task. Close the loop to let go.', book: 'Deep Work' },
  { id: 'ts_breath',   emoji: '🧘', label: '3 deep breaths — exhale the last task',        time: 1,  principle: 'Stoicism — between stimulus and response is a space. In that space is your freedom and your focus.', book: 'Stoicism' },
  { id: 'ts_read',     emoji: '📋', label: 'Read the next task out loud once',             time: 0,  principle: 'Deep Work — understand what you\'re entering before you enter it. Don\'t drift into new work.', book: 'Deep Work' },
  { id: 'ts_pause',    emoji: '⏸️', label: '60-second pause before opening anything',      time: 1,  principle: 'Don\'t let urgency pull you in mindlessly. Most "urgent" things can wait 60 seconds.', book: 'Deep Work' },
  { id: 'ts_question', emoji: '❓', label: 'Ask: Is this urgent or does it just feel urgent?', time: 0, principle: 'Eisenhower Matrix — most things feel urgent but aren\'t important. The question breaks the reflex.', book: '7 Habits' },
]

// Cal Newport's "shutdown ritual" — giving the brain a hard stop signal
const WORK_END_ITEMS = [
  { id: 'we_review',   emoji: '✅', label: 'Review what was accomplished',               time: 2,  principle: 'Reflection is the engine of improvement. Acknowledge what got done — the brain needs closure.', book: 'Deep Work' },
  { id: 'we_capture',  emoji: '📝', label: 'Capture all open loops (write everything pending)', time: 3, principle: 'GTD — uncaptured tasks haunt you. Write them all. A trusted system is what lets the brain let go.', book: 'GTD' },
  { id: 'we_rock',     emoji: '🗓️', label: 'Write tomorrow\'s ONE Big Rock',              time: 1,  principle: 'Eat That Frog — decide the night before. Tomorrow\'s you will thank today\'s you for this.', book: 'Eat That Frog' },
  { id: 'we_inbox',    emoji: '📧', label: 'Final inbox/messages check — then close',     time: 2,  principle: 'Email is reactive, not proactive. One pass at the end, then shut it. You\'re not a switch.', book: 'Deep Work' },
  { id: 'we_desk',     emoji: '🧹', label: 'Clear workspace for tomorrow',                time: 2,  principle: 'Atomic Habits — tomorrow\'s environment is being set right now. Make it easier for future-you.', book: 'Atomic Habits' },
  { id: 'we_shutdown', emoji: '🔐', label: 'Say out loud: "Shutdown complete."',          time: 0,  principle: 'Deep Work (Cal Newport) — this phrase signals to your brain: work is DONE. Trust the capture system and rest.', book: 'Deep Work' },
]

// Dale Carnegie "How to Stop Worrying and Start Living" — day-tight compartments
// "The most important hour is the one you are living in right now."
const DAY_COMPARTMENT_ITEMS = [
  { id: 'dc_seal_past',    emoji: '🔒', label: 'Seal yesterday — "I accept it. I cannot change it."', time: 1, principle: '"Don\'t saw sawdust." — Carnegie. Worrying about the past is paying interest on a debt already paid.', book: 'Stop Worrying' },
  { id: 'dc_seal_future',  emoji: '🔒', label: 'Seal tomorrow — "I won\'t borrow its trouble today."', time: 1, principle: '"Day-tight compartments." — Carnegie / Sir William Osler. Future worry robs today of strength.', book: 'Stop Worrying' },
  { id: 'dc_open_today',   emoji: '🌊', label: 'Open today — "This day is all I have."',             time: 1, principle: '"Born every morning, die by night." — Carnegie. This one day, lived well, is a complete life.', book: 'Stop Worrying' },
  { id: 'dc_commit',       emoji: '🎯', label: 'Today I will: [one thing] by tonight.',              time: 1, principle: '"Do the thing you fear, and the death of fear is certain." — Carnegie. Commit. Publicly, to yourself.', book: 'Stop Worrying' },
  { id: 'dc_worst',        emoji: '🔍', label: 'Name your worst worry. Ask: Is it real or imagined?', time: 2, principle: '"Accept the worst that can happen." — Carnegie. Once you accept the worst, you recover your peace to improve it.', book: 'Stop Worrying' },
  { id: 'dc_close',        emoji: '🌙', label: '"This day is complete. I lived it. That is enough."', time: 1, principle: 'Each evening, close the compartment with intention. Let this day dissolve gracefully into rest.', book: 'Stop Worrying' },
]

// Weekend rituals — habits of Gates, Buffett, Obama, Covey and top performers
const WEEKEND_ITEMS = [
  { id: 'wk_nature_walk',   emoji: '🚶', label: 'Nature walk — 30 min, no phone',                  time: 30, principle: 'Bill Gates, Jeff Bezos, Barack Obama all walk in nature on weekends. Walking without input is the most productive non-productive thing you can do.', book: 'Deep Work' },
  { id: 'wk_family_meal',   emoji: '🍳', label: 'Cook or share a meal with family',                 time: 40, principle: "Obama's rule: no work at family breakfast on weekends. Breaking bread is the oldest ritual of belonging.", book: 'Family Direction' },
  { id: 'wk_deep_read',     emoji: '📚', label: 'Deep reading session (1+ hour, one book)',         time: 60, principle: 'Warren Buffett reads 500 pages/day. Bill Gates takes "Think Weeks". Your weekend is your micro Think Week.', book: 'The Compound Effect' },
  { id: 'wk_weekly_review', emoji: '📋', label: 'Weekly Review — what worked, what to improve',     time: 20, principle: '7 Habits Habit 7: The weekly review is the highest-leverage planning act. Without it, you are always reacting.', book: '7 Habits' },
  { id: 'wk_brain_dump',    emoji: '🧠', label: 'Brain dump — write everything on your mind',       time: 15, principle: 'GTD — your mind is for having ideas, not storing them. Clear the RAM. Capture everything, then organize.', book: 'GTD' },
  { id: 'wk_plan_week',     emoji: '🗓️', label: "Plan next week's top 3 Big Rocks",                time: 10, principle: 'Eat That Frog — identify your 3 frogs for next week while your mind is rested. Monday-you will thank weekend-you.', book: 'Eat That Frog' },
  { id: 'wk_finance_check', emoji: '💰', label: 'Financial health check (spending, savings, goals)', time: 10, principle: 'Richest Man in Babylon — track your gold weekly. What is measured is managed. Most people check their phone 100x/day and their net worth never.', book: 'Richest Man in Babylon' },
  { id: 'wk_goals_review',  emoji: '🎯', label: 'Review your annual goals — are you on track?',     time: 10, principle: 'Think and Grow Rich — read your Definite Chief Aim at minimum weekly. Goals not reviewed are goals not pursued.', book: 'Think and Grow Rich' },
  { id: 'wk_extended_pray', emoji: '🕊️', label: 'Extended prayer / quiet time with God (30 min)',  time: 30, principle: 'God direction — many high performers double their spiritual investment on weekends. Foundation is built in unhurried hours.', book: 'God Direction' },
  { id: 'wk_joy',           emoji: '🎨', label: 'Do one thing purely for joy — no productivity',   time: 30, principle: 'Essentialism — joy is not a reward for productivity; it is fuel for it. Rest and play make great work possible.', book: 'Essentialism' },
]

const EVENING_ITEMS = [
  { id: 'evening_reflection', emoji: '✍️', label: 'Write today\'s key learning or event',      time: 5,  principle: 'Stoic evening audit (Marcus Aurelius) — What did I do well? What failed? What will I change?', book: 'Stoicism' },
  { id: 'evening_gratitude',  emoji: '🙏', label: 'One thing I\'m grateful for today',         time: 2,  principle: 'Compound Effect — close every day with abundance mindset. Gratitude compounds into resilience.', book: 'The Compound Effect' },
  { id: 'read',               emoji: '📚', label: 'Read 20 pages',                             time: 20, principle: 'Compound Effect — 20 pages/day = 7,300 pages/year ≈ 24 books. Non-readers have no advantage.', book: 'The Compound Effect' },
  { id: 'evening_skincare',   emoji: '🧴', label: 'Evening skin care routine',                 time: 5,  principle: 'Routine = respect for your future self. Consistency here trains consistency everywhere.', book: 'Identity-Based' },
  { id: 'prep_tomorrow',      emoji: '🎯', label: 'Set tomorrow\'s ONE Big Rock',               time: 2,  principle: 'Eat That Frog — decide the night before. Pre-deciding removes morning friction.', book: 'Eat That Frog' },
  { id: 'phone_away',         emoji: '📵', label: 'Phone away (no blue light 1h before bed)',   time: 0,  principle: 'Atomic Habits — environment design. Light signals "day." Remove it to signal "night, recover."', book: 'Atomic Habits' },
  { id: 'evening_prayer',     emoji: '🕊️', label: 'Evening prayer / reflect with God',         time: 5,  principle: 'God direction — close the day intentionally. Surrender the weight of today and trust tomorrow to Him.', book: 'God Direction' },
]

const ALL_GROUPS = [
  { key: 'morning',    items: MORNING_ITEMS },
  { key: 'work_start', items: WORK_START_ITEMS },
  { key: 'task_switch',items: TASK_SWITCH_ITEMS },
  { key: 'work_end',   items: WORK_END_ITEMS },
  { key: 'compartment',items: DAY_COMPARTMENT_ITEMS },
  { key: 'weekend',    items: WEEKEND_ITEMS },
  { key: 'evening',    items: EVENING_ITEMS },
]

const BOOK_COLORS = {
  'Atomic Habits':      'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  '7 Habits':           'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Eat That Frog':      'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'The Compound Effect':'bg-gold/20 text-gold border-gold/30',
  'Stoicism':           'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'Deep Work':          'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Stop Worrying':      'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'GTD':                'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Identity-Based':     'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'God Direction':      'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Essentialism':       'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'Think and Grow Rich':'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Family Direction':   'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

// ─── Components ───────────────────────────────────────────────────

function RitualItem({ item, done, onToggle }) {
  const [showNote, setShowNote] = useState(false)
  const bookColor = BOOK_COLORS[item.book] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  return (
    <div className={`rounded-2xl border transition-all ${done ? 'bg-accent/5 border-accent/30' : 'bg-elevated border-border'}`}>
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => onToggle(item.id)}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${done ? 'bg-accent border-accent' : 'border-gray-500'}`}>
          {done && <Check size={12} className="text-white" />}
        </button>
        <span className="text-base">{item.emoji}</span>
        <div className="flex-1">
          <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-gray-500' : 'text-white'}`}>{item.label}</p>
          {item.time > 0 && <p className="text-[10px] text-gray-500">{item.time} min</p>}
        </div>
        <button onClick={() => setShowNote(n => !n)} className="p-1 text-gray-500 flex-shrink-0">
          <Info size={14} />
        </button>
      </div>
      {showNote && (
        <div className="px-3 pb-3 space-y-1.5 animate-fade-in">
          <p className="text-xs text-gray-300 leading-relaxed">{item.principle}</p>
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bookColor}`}>
            📚 {item.book}
          </span>
        </div>
      )}
    </div>
  )
}

function RitualSection({ title, emoji, items, rituals, onToggle, quote, completionMsg, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const done = items.filter(i => rituals[i.id]).length
  const pct = Math.round((done / items.length) * 100)
  const allDone = done === items.length
  const timeTotal = items.filter(i => i.time > 0).reduce((s, i) => s + i.time, 0)

  return (
    <div className="card space-y-0">
      {/* Header — always visible, tap to expand */}
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-3 w-full">
        <span className="text-xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-white text-sm">{title}</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${allDone ? 'text-emerald' : 'text-gray-400'}`}>{done}/{items.length}</span>
              {allDone && <Check size={12} className="text-emerald" />}
              {open ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
            </div>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald' : 'bg-accent'}`}
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      </button>

      {open && (
        <div className="space-y-3 pt-4 mt-3 border-t border-border animate-fade-in">
          {quote && (
            <p className="text-xs text-gray-400 italic border-l-2 border-accent/40 pl-3 leading-relaxed">{quote}</p>
          )}
          {allDone ? (
            <div className="text-center py-3 bg-emerald/5 border border-emerald/20 rounded-xl">
              <p className="text-emerald font-bold text-sm">{completionMsg}</p>
              {timeTotal > 0 && <p className="text-xs text-gray-400 mt-1">{timeTotal} min invested in yourself</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <RitualItem key={item.id} item={item} done={!!rituals[item.id]} onToggle={onToggle} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────

export default function RitualScreen({ todayEntry, onSave, embedded = false }) {
  const today = todayStr()
  const isWeekend = [0, 6].includes(new Date().getDay())
  const [rituals, setRituals] = useState(todayEntry?.rituals || {})

  useEffect(() => {
    setRituals(todayEntry?.rituals || {})
  }, [todayEntry])

  async function toggle(itemId) {
    const updated = { ...rituals, [itemId]: !rituals[itemId] }
    setRituals(updated)
    await onSave({ ...(todayEntry || {}), date: today, rituals: updated })
  }

  const totalItems = ALL_GROUPS.reduce((s, g) => s + g.items.length, 0)
  const totalDone = ALL_GROUPS.reduce((s, g) => s + g.items.filter(i => rituals[i.id]).length, 0)
  const overallPct = Math.round((totalDone / totalItems) * 100)

  return (
    <div
      className={`${embedded ? 'px-4 space-y-4 animate-fade-in' : 'screen space-y-4 animate-fade-in'}`}
      style={embedded ? { paddingTop: '1.25rem', paddingBottom: '2rem' } : {}}
    >
      <div>
        <h1 className="text-xl font-bold text-white">Rituals</h1>
        <p className="text-xs text-gray-400 mt-0.5">Tap any ritual to expand · Tap <Info size={10} className="inline" /> for the book principle</p>
      </div>

      {/* Overall */}
      <div className="card-elevated">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-white">Today's completion</span>
          <span className={`text-lg font-black ${overallPct === 100 ? 'text-emerald' : 'text-accent'}`}>{overallPct}%</span>
        </div>
        <div className="h-3 bg-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${overallPct === 100 ? 'bg-emerald' : 'bg-gradient-to-r from-accent to-accent-light'}`}
            style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1.5">
          <span>{totalDone} done</span><span>{totalItems - totalDone} remaining</span>
        </div>
      </div>

      {/* Autopilot reminder */}
      <div className="px-3 py-2.5 bg-gold/5 border border-gold/20 rounded-xl">
        <p className="text-xs text-gold leading-relaxed">
          🔑 Great men don't decide what to do each morning. They follow a ritual. This IS the decision. Execute.
        </p>
      </div>

      {/* Morning Ritual */}
      <RitualSection
        title="Morning Ritual"
        emoji="🌅"
        items={MORNING_ITEMS}
        rituals={rituals}
        onToggle={toggle}
        quote='"Win the morning, win the day." — Tim Ferriss'
        completionMsg="🔥 Morning ritual complete! You won the morning."
      />

      {/* Work Start */}
      <RitualSection
        title="Work Start — Enter Deep Focus"
        emoji="🚀"
        items={WORK_START_ITEMS}
        rituals={rituals}
        onToggle={toggle}
        quote='"A ritual tells your mind: time to focus. Build the association daily until it becomes automatic." — Cal Newport, Deep Work'
        completionMsg="🎯 Focus ritual complete — the session has officially begun."
      />

      {/* Task Switch — Attention Residue Clearer */}
      <RitualSection
        title="Task Switch — Clear Attention Residue"
        emoji="🔄"
        items={TASK_SWITCH_ITEMS}
        rituals={rituals}
        onToggle={toggle}
        quote='"When you switch tasks without properly closing the first, part of your attention stays on the previous task. You are never fully present." — Sophie Leroy, Attention Residue Research'
        completionMsg="🌊 Attention reset complete. You are fully here now."
      />

      {/* Work End / Shutdown */}
      <RitualSection
        title="Work End — Shutdown Complete"
        emoji="🔐"
        items={WORK_END_ITEMS}
        rituals={rituals}
        onToggle={toggle}
        quote='"At the end of the workday, say out loud: Shutdown complete. This shuts down access to work thoughts in a way an open-ended fade into the evening never can." — Cal Newport, Deep Work'
        completionMsg="🔐 Shutdown complete. Your mind is free to rest now."
      />

      {/* Dale Carnegie — Day-Tight Compartments */}
      <RitualSection
        title="Day Compartment — Born Today"
        emoji="🚢"
        items={DAY_COMPARTMENT_ITEMS}
        rituals={rituals}
        onToggle={toggle}
        quote='"Compartmentalize your day. Seal off the past. Seal off the future. Live in day-tight compartments — born every morning, die by night. This one day, fully lived, is a complete life." — Dale Carnegie, How to Stop Worrying and Start Living'
        completionMsg="🚢 Today's compartment is set. This day is entirely yours."
      />

      {/* Evening Ritual */}
      <RitualSection
        title="Evening Ritual"
        emoji="🌙"
        items={EVENING_ITEMS}
        rituals={rituals}
        onToggle={toggle}
        quote='"Let us prepare our minds as if we had come to the very end of life. Let us postpone nothing." — Seneca'
        completionMsg="✨ Evening ritual complete. Rest well — you earned it."
      />

      {/* Weekend — shown always, glows on Sat/Sun */}
      <div className={isWeekend ? 'ring-1 ring-gold/30 rounded-2xl' : ''}>
        {isWeekend && (
          <div className="px-3 py-2 bg-gold/10 border border-gold/20 rounded-t-2xl text-xs text-gold font-semibold">
            🌤️ It's the weekend — your most valuable unscheduled time. Use it intentionally.
          </div>
        )}
        <RitualSection
          title="Weekend Ritual"
          emoji="🌤️"
          items={WEEKEND_ITEMS}
          rituals={rituals}
          onToggle={toggle}
          defaultOpen={isWeekend}
          quote='"The things that matter most must never be at the mercy of the things that matter least." — Goethe. Weekends are where the real compounding happens.'
          completionMsg="🌤️ Weekend ritual complete. You invested in every direction that matters."
        />
      </div>

      {/* Books footer */}
      <div className="card border border-border">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Built from these books</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BOOK_COLORS).filter(([k]) => !['Identity-Based','God Direction'].includes(k)).map(([book, cls]) => (
            <div key={book} className={`text-[10px] font-medium px-2 py-1 rounded-lg border ${cls}`}>📚 {book}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
