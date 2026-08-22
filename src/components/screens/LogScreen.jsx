import { useState, useEffect, useRef } from 'react'
import { todayStr, calcSleepHours } from '../../utils/gamification'
import { getEntry } from '../../utils/storage'
import { ChevronDown, ChevronUp, Check, Save, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import TaskList from '../TaskList'

const EMPTY = {
  big_rock: '',
  day_score: null,
  // God
  prayer_done: false,
  god_minutes: 0,
  scripture_minutes: 0,
  meditation_minutes: 0,
  // Health
  wake_time: '',
  bed_time: '',
  sleep_hours: null,
  breakfast: false,
  lunch: false,
  dinner: false,
  water_liters: 1.5,
  steps: 0,
  weight_kg: '',
  workout_minutes: 0,
  energy_score: 7,
  mood_score: 7,
  stress_score: 5,
  supplements: false,
  no_junk_food: false,
  // Wealth
  paid_yourself_first: false,
  avoided_impulse: false,
  financial_learning: false,
  abundance_note: '',
  // Family
  family_time: 0,
  temper_controlled: false,
  family_kindness: false,
  family_gratitude: '',
  // Professional
  deep_work_hours: 0,
  learning_minutes: 0,
  pages_read: 0,
  leetcode_problems: 0,
  // Evening
  morning_ritual: false,
  reflection_completed: false,
  daily_win: '',
  diary_done: false,
}

function offsetDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

// ─── Reusable Input Widgets ───────────────────────────────────────

function SliderRow({ label, emoji, field, value, onChange, min = 0, max, step = 1, unit = '' }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm text-gray-300 flex items-center gap-1.5">{emoji} {label}</label>
        <span className="text-sm font-bold text-white">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(field, +e.target.value)} className="w-full" />
      <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

function ScoreRow({ label, emoji, field, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm text-gray-300">{emoji} {label}</label>
        <span className="text-sm font-bold text-white">{value}/10</span>
      </div>
      <div className="flex gap-1.5">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(field, n)}
            className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all ${
              value >= n
                ? n <= 4 ? 'bg-rose text-white' : n <= 7 ? 'bg-gold text-black' : 'bg-emerald text-black'
                : 'bg-border text-gray-500'
            }`}>{n}</button>
        ))}
      </div>
    </div>
  )
}

function Toggle({ label, emoji, field, value, onChange, accent }) {
  return (
    <button onClick={() => onChange(field, !value)}
      className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all ${
        value
          ? accent
            ? `bg-${accent}/10 border-${accent} text-white`
            : 'bg-accent/10 border-accent text-white'
          : 'bg-elevated border-border text-gray-400'
      }`}>
      <span className="text-sm">{emoji} {label}</span>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        value ? 'bg-accent border-accent' : 'border-gray-500'
      }`}>
        {value && <Check size={12} className="text-white" />}
      </div>
    </button>
  )
}

function NumberInput({ label, emoji, field, value, onChange, min = 0, max, step = 1 }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef()
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-300">{emoji} {label}</label>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(field, Math.max(min, (value || 0) - step))}
          className="w-8 h-8 rounded-xl bg-border text-white font-bold flex items-center justify-center text-lg leading-none">−</button>
        {editing ? (
          <input ref={inputRef} type="number" inputMode="numeric" value={value || 0}
            onChange={e => onChange(field, e.target.value === '' ? 0 : +e.target.value)}
            onBlur={() => setEditing(false)}
            className="w-16 text-center font-bold text-white bg-elevated rounded-xl py-1 outline-none focus:ring-1 focus:ring-accent text-sm" />
        ) : (
          <button onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.select(), 30) }}
            className="w-16 text-center font-bold text-white py-1 bg-elevated rounded-xl text-sm">{value || 0}</button>
        )}
        <button onClick={() => onChange(field, Math.min(max ?? 99999, (value || 0) + step))}
          className="w-8 h-8 rounded-xl bg-border text-white font-bold flex items-center justify-center text-lg leading-none">+</button>
      </div>
    </div>
  )
}

// ─── Daily-rotating motivational quotes ──────────────────────────

const QUOTES = {
  god: [
    '"Be still and know that I am God." — Psalm 46:10',
    '"Prayer does not change God, but it changes him who prays." — Kierkegaard',
    '"Trust in the Lord with all your heart and lean not on your own understanding." — Proverbs 3:5',
    '"He who kneels before God can stand before anyone." — Unknown',
    '"For I know the plans I have for you, plans to prosper you." — Jeremiah 29:11',
    '"To be empty of things is to be full of God." — Meister Eckhart',
    '"The soul that is always hurrying can never be at peace." — Seneca',
  ],
  health: [
    '"Take care of your body. It\'s the only place you have to live." — Jim Rohn',
    '"The first wealth is health." — Ralph Waldo Emerson',
    '"Sleep is the single most effective thing we can do to reset our brain and body." — Matthew Walker',
    '"Your body is your most priceless possession; take care of it." — Jack LaLanne',
    '"Movement is medicine for creating change in your physical, emotional, and mental states." — Carol Welch',
    '"A good laugh and a long sleep are the best cures in the doctor\'s book." — Irish Proverb',
    '"The body achieves what the mind believes." — Unknown',
  ],
  wealth: [
    '"A part of all you earn is yours to keep." — The Richest Man in Babylon',
    '"Don\'t work for money. Make money work for you." — Rich Dad Poor Dad',
    '"The rich invest their money and spend what\'s left. The poor spend first." — Jim Rohn',
    '"It\'s not how much money you make, but how much you keep." — Robert Kiyosaki',
    '"Wealth is not about having a lot of money — it\'s about having a lot of options." — Chris Rock',
    '"Financial peace isn\'t the acquisition of stuff. It\'s living on less than you make." — Dave Ramsey',
    '"Compound interest is the eighth wonder of the world." — Einstein',
  ],
  family: [
    '"Family is not an important thing. It\'s everything." — Michael J. Fox',
    '"The most important work you will ever do is within the walls of your own home." — Harold B. Lee',
    '"At the end of life, no one wishes they had spent more time at the office." — Unknown',
    '"You don\'t choose your family. They are God\'s gift to you." — Desmond Tutu',
    '"The bond that links true family is not blood, but respect and joy." — Richard Bach',
    '"Cherish your human connections — your relationships with friends and family." — Barbara Bush',
    '"A man who doesn\'t spend time with his family can never be a real man." — The Godfather',
  ],
  pro: [
    '"Eat a live frog first thing in the morning and nothing worse will happen the rest of the day." — Mark Twain',
    '"The key is not to prioritize what\'s on your schedule, but to schedule your priorities." — Stephen Covey',
    '"Success is the sum of small efforts, repeated day in and day out." — Robert Collier',
    '"Your future is created by what you do today, not tomorrow." — Robert Kiyosaki',
    '"Focus on being productive instead of busy." — Tim Ferriss',
    '"Small habits don\'t add up — they compound." — James Clear',
    '"The successful warrior is the average man, with laser-like focus." — Bruce Lee',
  ],
  evening: [
    '"Waste no more time arguing about what a good man should be. Be one." — Marcus Aurelius',
    '"The unexamined life is not worth living." — Socrates',
    '"We suffer more in imagination than in reality." — Seneca',
    '"Every day is a new opportunity to become a better version of yourself." — Unknown',
    '"A day well spent brings happy sleep." — Leonardo da Vinci',
    '"What we do in life echoes in eternity." — Marcus Aurelius',
    '"Reflect upon your present blessings, of which every man has many." — Charles Dickens',
  ],
}

// Seeded by date + key so the quote rotates daily but stays stable within a day
function getDailyQuote(arr, key) {
  const seed = [...(new Date().toDateString() + key)].reduce((a, c) => a + c.charCodeAt(0), 0)
  return arr[seed % arr.length]
}

function Section({ title, emoji, children, defaultOpen = true, quoteKey }) {
  const [open, setOpen] = useState(defaultOpen)
  const quote = quoteKey && QUOTES[quoteKey] ? getDailyQuote(QUOTES[quoteKey], quoteKey) : null
  return (
    <div className="card space-y-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full">
        <span className="font-semibold text-white flex items-center gap-2">{emoji} {title}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <>
          {quote && (
            <p className="text-xs text-gray-400 italic border-l-2 border-accent/40 pl-3 leading-relaxed">{quote}</p>
          )}
          <div className="space-y-3 pt-1">{children}</div>
        </>
      )}
    </div>
  )
}

// ─── Meal Row ─────────────────────────────────────────────────────

function MealRow({ form, onChange }) {
  const meals = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅', time: '7-9am' },
    { key: 'lunch',     label: 'Lunch',     emoji: '☀️', time: '12-2pm' },
    { key: 'dinner',    label: 'Dinner',    emoji: '🌙', time: '7-9pm' },
  ]
  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">Did you eat all 3 meals? (your body needs fuel)</p>
      <div className="flex gap-2">
        {meals.map(m => (
          <button key={m.key} onClick={() => onChange(m.key, !form[m.key])}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
              form[m.key] ? 'bg-emerald/10 border-emerald text-emerald' : 'bg-elevated border-border text-gray-500'
            }`}>
            <span className="text-lg">{m.emoji}</span>
            <span className="text-[11px] font-semibold">{m.label}</span>
            <span className="text-[9px] opacity-60">{m.time}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Water Bar ────────────────────────────────────────────────────

function WaterBar({ value, onChange }) {
  const glasses = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-gray-300">💧 Water intake</label>
        <span className="text-sm font-bold text-sky">{value}L {value >= 2 ? '✓' : ''}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {glasses.map(g => (
          <button key={g} onClick={() => onChange('water_liters', g)}
            className={`h-8 flex-1 min-w-[28px] rounded-lg text-[11px] font-bold border transition-all ${
              value >= g ? 'bg-sky/20 border-sky text-sky' : 'bg-elevated border-border text-gray-600'
            }`}>{g}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────

export default function LogScreen({ todayEntry, onSave, tasks, onAddTask, onToggleTask, onDeleteTask, embedded = false }) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [form, setForm] = useState({ ...EMPTY, ...(todayEntry || {}) })
  const [saved, setSaved] = useState(false)
  const isToday = selectedDate === today
  const draftKey = `log-draft-${selectedDate}`

  useEffect(() => {
    async function load() {
      const stored = selectedDate === today
        ? (todayEntry || {})
        : (await getEntry(selectedDate) || {})
      let draft = {}
      try { draft = JSON.parse(sessionStorage.getItem(draftKey) || '{}') } catch {}
      setForm({ ...EMPTY, ...stored, ...draft })
      setSaved(false)
    }
    load()
  }, [selectedDate, todayEntry, today, draftKey])

  // Auto-calc sleep from bed + wake times
  useEffect(() => {
    if (form.bed_time && form.wake_time) {
      const calc = calcSleepHours(form.bed_time, form.wake_time)
      if (calc) setForm(prev => ({ ...prev, sleep_hours: calc }))
    }
  }, [form.bed_time, form.wake_time])

  function set(field, value) {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      try { sessionStorage.setItem(draftKey, JSON.stringify(updated)) } catch {}
      return updated
    })
    setSaved(false)
  }

  async function handleSave() {
    await onSave({ ...form, date: selectedDate })
    try { sessionStorage.removeItem(draftKey) } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function navDate(days) {
    const next = offsetDate(selectedDate, days)
    if (next <= today) setSelectedDate(next)
  }

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })

  return (
    <div
      className={`${embedded ? 'px-4 space-y-4 animate-fade-in' : 'screen space-y-4 animate-fade-in'}`}
      style={embedded ? { paddingTop: '1.25rem', paddingBottom: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))' } : {}}
    >

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Log</h1>
          {!isToday && <p className="text-xs text-amber-400 font-medium">Editing past entry</p>}
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
            saved ? 'bg-emerald/20 text-emerald border border-emerald' : 'btn-primary'
          }`}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save</>}
        </button>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between card py-2">
        <button onClick={() => navDate(-1)} className="p-2 rounded-xl bg-elevated active:bg-border">
          <ChevronLeft size={16} className="text-gray-300" />
        </button>
        <label className="flex items-center gap-2 cursor-pointer">
          <Calendar size={14} className="text-accent" />
          <span className="text-sm font-semibold text-white">{dateLabel}</span>
          <input type="date" value={selectedDate} max={today}
            onChange={e => e.target.value && setSelectedDate(e.target.value)}
            className="opacity-0 absolute w-0 h-0" />
        </label>
        <button onClick={() => navDate(+1)} disabled={isToday}
          className={`p-2 rounded-xl bg-elevated active:bg-border ${isToday ? 'opacity-30' : ''}`}>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>
      {!isToday && (
        <button onClick={() => setSelectedDate(today)} className="w-full text-xs text-accent text-center py-0.5">← Back to today</button>
      )}

      {/* Big Rock */}
      <div className="card">
        <label className="text-sm font-semibold text-white block mb-1">🎯 Today's ONE Big Rock</label>
        <p className="text-[11px] italic mb-2" style={{ color: 'rgba(167,139,250,0.7)' }}>
          "If you have something left to do, you have no right of thinking about anything else."
        </p>
        <input type="text" placeholder="The hardest, most impactful thing you must do today..."
          value={form.big_rock || ''}
          onChange={e => set('big_rock', e.target.value)}
          className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent" />
        <p className="text-[10px] text-gray-600 mt-1">Eat That Frog — the frog you must eat before anything else.</p>
      </div>

      {/* ─── GOD ─────────────────────────────────────────────────── */}
      <Section title="God" emoji="🕊️" quoteKey="god" defaultOpen={false}>
        <Toggle label="Prayer done" emoji="🙏" field="prayer_done" value={form.prayer_done} onChange={set} />
        <SliderRow label="God / devotional time" emoji="⏱️" field="god_minutes" value={form.god_minutes} onChange={set} min={0} max={120} step={5} unit="m" />
        <SliderRow label="Scripture reading" emoji="📖" field="scripture_minutes" value={form.scripture_minutes} onChange={set} min={0} max={60} step={5} unit="m" />
        <SliderRow label="Meditation / reflection" emoji="🧘" field="meditation_minutes" value={form.meditation_minutes} onChange={set} min={0} max={60} step={5} unit="m" />
      </Section>

      {/* ─── HEALTH ──────────────────────────────────────────────── */}
      <Section title="Health" emoji="💪" quoteKey="health" defaultOpen={false}>
        {/* Sleep */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">🛏️ Bed time (last night)</label>
            <input type="time" value={form.bed_time || ''}
              onChange={e => set('bed_time', e.target.value)}
              className="w-full bg-elevated rounded-xl px-2 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">⏰ Wake time</label>
            <input type="time" value={form.wake_time || ''}
              onChange={e => set('wake_time', e.target.value)}
              className="w-full bg-elevated rounded-xl px-2 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-accent" />
          </div>
        </div>
        {form.sleep_hours && (
          <div className="flex items-center gap-2 px-3 py-2 bg-sky/10 border border-sky/20 rounded-xl">
            <span>😴</span>
            <span className="text-sm text-sky font-bold">{form.sleep_hours}h sleep</span>
            <span className="text-xs text-gray-400">{form.sleep_hours < 7 ? '— below optimal' : form.sleep_hours > 9 ? '— slightly over' : '— great range ✓'}</span>
          </div>
        )}

        {/* Meals */}
        <MealRow form={form} onChange={set} />

        {/* Water */}
        <WaterBar value={form.water_liters} onChange={set} />

        {/* Steps */}
        <NumberInput label="Steps" emoji="👟" field="steps" value={form.steps} onChange={set} step={100} max={30000} />

        {/* Workout */}
        <NumberInput label="Workout minutes" emoji="🏋️" field="workout_minutes" value={form.workout_minutes} onChange={set} step={5} max={180} />

        {/* Weight */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">⚖️ Weight (kg)</label>
          <input type="number" inputMode="decimal" value={form.weight_kg || ''}
            onChange={e => set('weight_kg', e.target.value ? +e.target.value : '')}
            placeholder="—"
            className="w-20 bg-elevated rounded-xl px-2 py-1.5 text-sm text-white text-center outline-none focus:ring-1 focus:ring-accent" />
        </div>

        {/* Scores */}
        <ScoreRow label="Energy" emoji="⚡" field="energy_score" value={form.energy_score} onChange={set} />
        <ScoreRow label="Mood" emoji="😊" field="mood_score" value={form.mood_score} onChange={set} />
        <ScoreRow label="Stress" emoji="😤" field="stress_score" value={form.stress_score} onChange={set} />

        {/* Extras */}
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Supplements" emoji="💊" field="supplements" value={form.supplements} onChange={set} />
          <Toggle label="No junk food" emoji="🥗" field="no_junk_food" value={form.no_junk_food} onChange={set} />
        </div>
      </Section>

      {/* ─── WEALTH ──────────────────────────────────────────────── */}
      <Section title="Wealth" emoji="💰" defaultOpen={false} quoteKey="wealth">
        <div className="px-3 py-2 bg-gold/5 border border-gold/20 rounded-xl mb-1">
          <p className="text-[11px] text-gold leading-relaxed">
            "A part of all you earn is yours to keep." — Richest Man in Babylon<br />
            These are your 4 daily financial commitments.
          </p>
        </div>
        <Toggle label="Pay yourself first (SIP/investment ran)" emoji="📈" field="paid_yourself_first" value={form.paid_yourself_first} onChange={set} />
        <Toggle label="No impulse buy today" emoji="🚫" field="avoided_impulse" value={form.avoided_impulse} onChange={set} />
        <Toggle label="Financial education (read/watch/listen)" emoji="📚" field="financial_learning" value={form.financial_learning} onChange={set} />
        <div>
          <label className="text-xs text-gray-400 block mb-1">Wealth note (event, win, or insight)</label>
          <input type="text" placeholder="e.g. SIP deducted, saved ₹500, read one chapter..."
            value={form.abundance_note || ''}
            onChange={e => set('abundance_note', e.target.value)}
            className="w-full bg-elevated rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <p className="text-[10px] text-gray-600">Log big financial decisions or events in Journal → Wealth category</p>
      </Section>

      {/* ─── FAMILY ──────────────────────────────────────────────── */}
      <Section title="Family" emoji="❤️" defaultOpen={false} quoteKey="family">
        <div className="px-3 py-2 bg-pink-500/5 border border-pink-500/20 rounded-xl">
          <p className="text-[11px] text-pink-300 leading-relaxed">
            At the end of life, no one wishes they spent more time at the office.
          </p>
        </div>

        <NumberInput label="Quality time with family" emoji="🏠" field="family_time" value={form.family_time} onChange={set} step={15} max={480} />
        <p className="text-[10px] text-gray-500 -mt-1">Minutes of intentional, present presence</p>

        <Toggle label="Controlled my temper today" emoji="🧘" field="temper_controlled" value={form.temper_controlled} onChange={set} />
        <Toggle label="Did something kind for family" emoji="💛" field="family_kindness" value={form.family_kindness} onChange={set} />

        <div>
          <label className="text-xs text-gray-400 block mb-1">Family gratitude (name one person, say why)</label>
          <input type="text" placeholder="e.g. Grateful for Mom because she called and listened..."
            value={form.family_gratitude || ''}
            onChange={e => set('family_gratitude', e.target.value)}
            className="w-full bg-elevated rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </Section>

      {/* ─── PROFESSIONAL ────────────────────────────────────────── */}
      <Section title="Professional" emoji="💼" quoteKey="pro">
        <SliderRow label="Deep work" emoji="🔥" field="deep_work_hours" value={form.deep_work_hours} onChange={set} min={0} max={12} step={0.5} unit="h" />
        <SliderRow label="Learning / study" emoji="📚" field="learning_minutes" value={form.learning_minutes} onChange={set} min={0} max={300} step={5} unit="m" />
        <NumberInput label="Pages read (books)" emoji="📖" field="pages_read" value={form.pages_read} onChange={set} step={1} max={200} />
        <NumberInput label="LeetCode problems" emoji="💻" field="leetcode_problems" value={form.leetcode_problems} onChange={set} step={1} max={20} />

        {/* Todo list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-300">📋 Task List</p>
            <p className="text-[10px] text-gray-500">Sorted by severity × priority</p>
          </div>
          {tasks && (
            <TaskList
              tasks={tasks}
              onAdd={onAddTask}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
            />
          )}
        </div>
      </Section>

      {/* ─── EVENING ─────────────────────────────────────────────── */}
      <Section title="Evening Reflection" emoji="🌙" defaultOpen={false} quoteKey="evening">
        <ScoreRow label="Day score" emoji="🌟" field="day_score" value={form.day_score || 5} onChange={set} />
        <Toggle label="Morning ritual completed" emoji="🌅" field="morning_ritual" value={form.morning_ritual} onChange={set} />
        <Toggle label="Reflection completed" emoji="🪞" field="reflection_completed" value={form.reflection_completed} onChange={set} />
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">🏆 Biggest Win</label>
          <input type="text" placeholder="One specific win from today..."
            value={form.daily_win || ''}
            onChange={e => set('daily_win', e.target.value)}
            className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <Toggle label="Wrote in my physical diary" emoji="📓" field="diary_done" value={form.diary_done} onChange={set} />
      </Section>

      <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
        {saved ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save {isToday ? "Today's" : dateLabel} Log</>}
      </button>
    </div>
  )
}
