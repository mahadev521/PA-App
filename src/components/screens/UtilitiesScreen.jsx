import { useState } from 'react'
import { Plus, Trash2, Check, ChevronLeft } from 'lucide-react'
import ErrandRunScreen from './utilities/ErrandRunScreen'
import BacklogScreen   from './utilities/BacklogScreen'
import { ChecklistsView } from './utilities/ChecklistsScreen'

// ─── Utility hub config ────────────────────────────────────────────────────

const UTILITIES = [
  { id: 'errand',      title: 'Errand Run',   emoji: '🚗', desc: 'Plan & track stops'       },
  { id: 'backlog',     title: 'Backlog',       emoji: '📥', desc: 'Second brain inbox'        },
  { id: 'today',       title: 'Today',         emoji: '🗓️', desc: 'What matters today'        },
  { id: 'shopping',    title: 'Shopping',      emoji: '📦', desc: 'Things to buy'             },
  { id: 'money',       title: 'Money',         emoji: '💰', desc: 'Expenses & bills'          },
  { id: 'people',      title: 'Follow-ups',    emoji: '📞', desc: 'People to contact'         },
  { id: 'learning',    title: 'Learning',      emoji: '📚', desc: 'What to learn next'        },
  { id: 'maintenance', title: 'Maintenance',   emoji: '🔧', desc: 'Last done / next due'      },
  { id: 'travel',      title: 'Travel',        emoji: '🧳', desc: 'Trips & packing'           },
  { id: 'decisions',   title: 'Decisions',     emoji: '🧠', desc: 'Think it through'          },
  { id: 'lifeadmin',   title: 'Life Admin',    emoji: '🧹', desc: 'The boring-but-critical stuff' },
  { id: 'fitness',     title: 'Fitness',       emoji: '🏃', desc: 'Body & training'           },
  { id: 'spiritual',   title: 'Spiritual',     emoji: '✝️', desc: 'Prayer & reflection'       },
  { id: 'checklists',  title: 'Checklists',    emoji: '✅', desc: 'Pre-trip, work, gym & more'  },
]

// ─── Generic utility configs ───────────────────────────────────────────────

const GENERIC_CONFIGS = {
  today: {
    placeholder: 'Add a task…',
    push: 'You have something left to do. What is it?',
    sections: [
      { id: 'mustdo',    label: '🔥 Must Do',   hint: '3–5 important things for today'     },
      { id: 'quickwins', label: '⚡ Quick Wins', hint: 'Anything under ~15 minutes'         },
      { id: 'outside',   label: '🚗 Outside',   hint: 'Things to do while you\'re out'     },
      { id: 'work',      label: '💻 Work',      hint: 'Professional tasks'                 },
      { id: 'home',      label: '🏠 Home',      hint: 'Personal responsibilities'          },
      { id: 'evening',   label: '🌙 Evening',   hint: 'Things that can wait until later'   },
    ],
  },
  shopping: {
    placeholder: 'Add item to buy…',
    push: 'Be specific. Vague lists lead to second trips.',
    sections: [
      { id: 'grocery',     label: '🛒 Grocery',     hint: 'Food & daily items'   },
      { id: 'home',        label: '🏠 Home',         hint: 'Household items'      },
      { id: 'personal',    label: '👕 Personal',     hint: 'Clothes, accessories' },
      { id: 'sports',      label: '🏸 Sports',       hint: 'Equipment & gear'     },
      { id: 'electronics', label: '💻 Electronics',  hint: 'Gadgets & tech'       },
      { id: 'other',       label: '📦 Other',        hint: 'Misc'                 },
    ],
  },
  money: {
    placeholder: 'e.g. ₹450 Dinner  or  Pay credit card…',
    push: 'Every rupee untracked is a decision made in the dark.',
    sections: [
      { id: 'expense',   label: '💸 Expenses',  hint: 'Log quick expenses'             },
      { id: 'bills',     label: '📋 Bills',     hint: 'Rent, utilities, subscriptions' },
      { id: 'reminders', label: '🔔 Reminders', hint: 'Finance to-dos'                 },
    ],
  },
  people: {
    placeholder: 'e.g. Rahul — job referral follow-up…',
    push: 'Relationships decay without action. Who needs a follow-up?',
    sections: [
      { id: 'active',  label: '🟡 Follow up', hint: 'People you need to contact'       },
      { id: 'waiting', label: '⏳ Waiting',   hint: 'Waiting on their reply / action'  },
      { id: 'done',    label: '✅ Resolved',  hint: 'Closed follow-ups'                },
    ],
  },
  learning: {
    placeholder: 'e.g. Learn Kafka, Read DDIA…',
    push: 'The person you\'ll be in 5 years is built by what you learn today.',
    sections: [
      { id: 'captured',  label: '📥 Captured',  hint: 'Things you want to learn'    },
      { id: 'learning',  label: '📖 Learning',  hint: 'Currently studying'          },
      { id: 'practiced', label: '🛠️ Practiced', hint: 'Applied it in practice'      },
      { id: 'completed', label: '✅ Completed', hint: 'Learned & integrated'        },
    ],
  },
  maintenance: {
    placeholder: 'e.g. AC service, Oil change…',
    push: 'Adults maintain their tools. What\'s overdue?',
    sections: [
      { id: 'home',    label: '🏠 Home',    hint: 'AC, purifier, cleaning, repairs' },
      { id: 'vehicle', label: '🚗 Vehicle', hint: 'Service, tyres, insurance, PUC'  },
      { id: 'tech',    label: '💻 Tech',    hint: 'Backups, updates, passwords'     },
    ],
  },
  travel: {
    placeholder: 'e.g. Book hotel, Pack charger…',
    push: 'Plan it now. Stress later is the price of laziness now.',
    sections: [
      { id: 'before', label: '✈️ Before', hint: 'Bookings, packing, documents' },
      { id: 'during', label: '🗺️ During', hint: 'Places, activities, food'     },
      { id: 'return', label: '🏠 Return', hint: 'Checkout, luggage, pending'   },
    ],
  },
  decisions: {
    placeholder: 'e.g. Should I buy a new racket?',
    push: 'An unmade decision is a leak of mental energy. Make it.',
    sections: [
      { id: 'open',    label: '🤔 Thinking', hint: 'Decisions you\'re working through' },
      { id: 'decided', label: '✅ Decided',  hint: 'Decision made + reason'            },
    ],
  },
  lifeadmin: {
    placeholder: 'e.g. Renew insurance, Book dentist…',
    push: 'The boring stuff ignored becomes the crisis you didn\'t plan for.',
    sections: [
      { id: 'documents',    label: '📄 Documents',    hint: 'Files & paperwork'              },
      { id: 'renewals',     label: '🔄 Renewals',     hint: 'Upcoming renewals & deadlines'  },
      { id: 'appointments', label: '📅 Appointments', hint: 'Bookings & schedules'           },
      { id: 'other',        label: '📌 Other',        hint: 'Everything else'                },
    ],
  },
  fitness: {
    placeholder: 'e.g. Badminton 7pm, Stretch 10 min…',
    push: 'Your body is the one machine you cannot replace. Maintain it.',
    sections: [
      { id: 'today',       label: '📅 Today',     hint: 'Today\'s fitness plan'        },
      { id: 'training',    label: '🏋️ Training',  hint: 'Workouts, sports, activities' },
      { id: 'maintenance', label: '🛠️ Body Care', hint: 'Stretch, recovery, equipment' },
    ],
  },
  spiritual: {
    placeholder: 'e.g. Bible reading, Prayer topic…',
    push: 'Feed the soul before the world demands from it.',
    sections: [
      { id: 'daily',     label: '🙏 Daily',     hint: 'Prayer & scripture'               },
      { id: 'capture',   label: '📝 Capture',   hint: 'Thoughts, struggles, reflections' },
      { id: 'gratitude', label: '❤️ Gratitude', hint: 'What you\'re thankful for'        },
    ],
  },
}

// ─── Generic utility screen ────────────────────────────────────────────────

function GenericUtility({ utilityId, config, items, onAdd, onToggle, onDelete }) {
  const [activeSection, setActiveSection] = useState(config.sections[0].id)
  const [inputValue, setInputValue] = useState('')
  const [showDone, setShowDone] = useState(false)

  const myItems      = (items || []).filter(i => i.type === utilityId)
  const sectionItems = myItems.filter(i => i.category === activeSection)
  const active       = sectionItems.filter(i => !i.done)
  const done         = sectionItems.filter(i => i.done)

  function handleAdd() {
    if (!inputValue.trim()) return
    onAdd(utilityId, inputValue.trim(), activeSection)
    setInputValue('')
  }

  function sectionPending(sectionId) {
    return myItems.filter(i => i.category === sectionId && !i.done).length
  }

  const sectionHint = config.sections.find(s => s.id === activeSection)?.hint

  return (
    <div className="px-4 pb-8">
      {/* Section tabs */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
        {config.sections.map(s => {
          const cnt      = sectionPending(s.id)
          const isActive = activeSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: isActive ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
                color:      isActive ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                border:     isActive ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
              }}
            >
              {s.label}
              {cnt > 0 && (
                <span className="ml-0.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}>
                  {cnt}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {sectionHint && <p className="mt-2 text-xs text-gray-600">{sectionHint}</p>}

      {/* Push quote */}
      {config.push && (
        <p className="mt-3 text-[11px] italic" style={{ color: 'rgba(167,139,250,0.7)' }}>
          {config.push}
        </p>
      )}

      {/* Add input */}
      <div className="mt-3 flex gap-2"
        style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden',
                 background: 'rgba(255,255,255,0.04)' }}>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={config.placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-3"
        />
        <button
          onClick={handleAdd}
          className="flex-shrink-0 px-4 text-sm font-semibold text-white"
          style={{ background: 'rgba(124,58,237,0.85)' }}
        >
          Add
        </button>
      </div>

      {active.length === 0 && done.length === 0 && (
        <div className="text-center py-12 text-gray-600 text-sm">Nothing here yet — add above ↑</div>
      )}

      {/* Active items */}
      <div className="flex flex-col gap-2 mt-4">
        {active.sort((a, b) => b.created_at - a.created_at).map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={() => onToggle(item.id)}
              className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform"
              style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }} />
            <span className="flex-1 text-sm text-white/90 leading-snug">{item.title}</span>
            <button onClick={() => onDelete(item.id)} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl active:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <button onClick={() => setShowDone(v => !v)}
          className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <Check size={13} />
          {showDone ? 'Hide' : 'Show'} completed ({done.length})
        </button>
      )}

      {showDone && (
        <div className="flex flex-col gap-2 mt-2">
          {done.sort((a, b) => b.created_at - a.created_at).map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.55 }}>
              <button onClick={() => onToggle(item.id)}
                className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform"
                style={{ borderColor: '#a78bfa', background: 'rgba(124,58,237,0.4)' }}>
                <Check size={13} color="#a78bfa" strokeWidth={3} />
              </button>
              <span className="flex-1 text-sm line-through" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {item.title}
              </span>
              <button onClick={() => onDelete(item.id)} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl active:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.2)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Today screen — backed by backlog items with status='today' ──────────────

const TODAY_TAGS = [
  { id: 'buy', emoji: '🛒' }, { id: 'fix', emoji: '🔧' }, { id: 'call', emoji: '📞' },
  { id: 'message', emoji: '💬' }, { id: 'home', emoji: '🏠' }, { id: 'work', emoji: '💼' },
  { id: 'finance', emoji: '💰' }, { id: 'vehicle', emoji: '🚗' }, { id: 'travel', emoji: '🧳' },
  { id: 'learn', emoji: '📚' }, { id: 'fitness', emoji: '🏸' }, { id: 'family', emoji: '👨‍👩‍👦' },
  { id: 'spiritual', emoji: '✝️' }, { id: 'personal', emoji: '🧠' }, { id: 'other', emoji: '📌' },
]

const SECTIONS = [
  { id: 'mustdo',    label: '🔥 Must Do',   hint: '3–5 things that actually matter today'  },
  { id: 'quickwins', label: '⚡ Quick Wins', hint: 'Under ~15 minutes'                       },
  { id: 'outside',   label: '🚗 Outside',   hint: 'Errands while you\'re out'               },
  { id: 'work',      label: '💻 Work',      hint: 'Professional tasks'                      },
  { id: 'home',      label: '🏠 Home',      hint: 'Personal responsibilities'               },
  { id: 'evening',   label: '🌙 Evening',   hint: 'Can wait until later tonight'            },
]

function TodayScreen({ backlog, onAdd, onDelete, onUpdateStatus }) {
  const [section, setSection]   = useState('mustdo')
  const [title, setTitle]       = useState('')
  const [tag, setTag]           = useState('other')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const todayItems = (backlog || []).filter(i => (i.status || (i.done ? 'done' : 'backlog')) === 'today')
  const doneItems  = (backlog || []).filter(i => (i.status || (i.done ? 'done' : 'backlog')) === 'done')

  // Items in Today don't have a section; we use the `section` field (stored in meta or tag)
  // For simplicity, we store the section in `todaySection` on the item
  const sectionItems = todayItems.filter(i => (i.todaySection || 'mustdo') === section)
  const sectionDone  = doneItems.filter(i => (i.todaySection || 'mustdo') === section)

  function sectionCount(sId) {
    return todayItems.filter(i => (i.todaySection || 'mustdo') === sId).length
  }

  async function handleAdd() {
    if (!title.trim()) return
    await onAdd(title.trim(), tag, 'today', { todaySection: section })
    setTitle('')
    setShowTagPicker(false)
  }

  const activeSection = SECTIONS.find(s => s.id === section)

  return (
    <div className="px-4 pb-8">
      {/* Section tabs */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
        {SECTIONS.map(s => {
          const cnt = sectionCount(s.id)
          const isA = section === s.id
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all min-h-[40px]"
              style={{
                background: isA ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
                color:      isA ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                border:     isA ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
              }}>
              {s.label}
              {cnt > 0 && (
                <span className="ml-0.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}>{cnt}</span>
              )}
            </button>
          )
        })}
      </div>

      {activeSection?.hint && <p className="mt-2 text-xs text-gray-600">{activeSection.hint}</p>}

      {/* Add input */}
      <div className="mt-3">
        <p className="text-[11px] italic mb-2" style={{ color: 'rgba(167,139,250,0.7)' }}>
          You have something left to do. What is it — right now?
        </p>
        <div className="flex gap-2"
          style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden',
                   background: 'rgba(255,255,255,0.04)' }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add to today…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none px-3 py-3"
          />
          <button onClick={() => setShowTagPicker(v => !v)}
            className="px-3 text-base"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {TODAY_TAGS.find(t => t.id === tag)?.emoji || '📌'}
          </button>
          <button onClick={handleAdd}
            className="px-4 text-sm font-semibold text-white flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.85)' }}>
            Add
          </button>
        </div>
        {showTagPicker && (
          <div className="flex gap-1.5 flex-wrap mt-2 p-2 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {TODAY_TAGS.map(t => (
              <button key={t.id} onClick={() => { setTag(t.id); setShowTagPicker(false) }}
                className="px-2 py-1 rounded-xl text-xs transition-all"
                style={{
                  background: tag === t.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
                  color: tag === t.id ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                }}>
                {t.emoji} {t.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {sectionItems.length === 0 && sectionDone.length === 0 && (
        <div className="text-center py-10 text-gray-600 text-sm">
          Nothing here — add above, or promote from
          <button className="ml-1 text-violet-400 underline" onClick={() => {}}>Backlog</button>
        </div>
      )}

      {/* Today items */}
      <div className="flex flex-col gap-2 mt-4">
        {sectionItems.sort((a, b) => b.created_at - a.created_at).map(item => {
          const tagInfo = TODAY_TAGS.find(t => t.id === item.tag)
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => onUpdateStatus(item.id, 'done')}
                className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform"
                style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }} />
              <span className="text-base leading-none flex-shrink-0">{tagInfo?.emoji || '📌'}</span>
              <span className="flex-1 text-sm text-white/90 leading-snug">{item.title}</span>
              {/* Move back to backlog */}
              <button onClick={() => onUpdateStatus(item.id, 'backlog')}
                className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                title="Move back to Backlog">
                ↩ Backlog
              </button>
              <button onClick={() => onDelete(item.id)} className="flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.2)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {sectionDone.length > 0 && (
        <button onClick={() => setShowDone(v => !v)}
          className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <Check size={13} />
          {showDone ? 'Hide' : 'Show'} completed ({sectionDone.length})
        </button>
      )}
      {showDone && (
        <div className="flex flex-col gap-2 mt-2">
          {sectionDone.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5 }}>
              <button onClick={() => onUpdateStatus(item.id, 'today')}
                className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform"
                style={{ borderColor: '#a78bfa', background: 'rgba(124,58,237,0.4)' }}>
                <Check size={13} color="#a78bfa" strokeWidth={3} />
              </button>
              <span className="flex-1 text-sm line-through" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.title}</span>
              <button onClick={() => onDelete(item.id)} className="flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.15)' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main screen — hub + routing ──────────────────────────────────────────

export default function UtilitiesScreen({
  errandRuns, onSaveErrand, onDeleteErrand,
  backlog, onAddBacklog, onDeleteBacklog, onUpdateBacklogStatus,
  utilityItems, onAddUtilityItem, onToggleUtilityItem, onDeleteUtilityItem,
  checklists, onSaveChecklist, onDeleteChecklist,
}) {
  const [activeUtility, setActiveUtility] = useState(null)
  const activeConfig = UTILITIES.find(u => u.id === activeUtility)

  function pendingCount(utilityId) {
    if (utilityId === 'errand')  return (errandRuns || []).filter(r => !r.completed).length
    if (utilityId === 'backlog') return (backlog || []).filter(i => (i.status || (i.done ? 'done' : 'backlog')) !== 'done').length
    if (utilityId === 'today')   return (backlog || []).filter(i => (i.status || (i.done ? 'done' : 'backlog')) === 'today').length
    return (utilityItems || []).filter(i => i.type === utilityId && !i.done).length
  }

  // ── Hub ────────────────────────────────────────────────────────

  if (!activeUtility) {
    return (
      <div className="bg-base">
        <div className="sticky top-0 z-10 px-4 pt-4 pb-3"
          style={{
            paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))',
            background: 'rgba(9,11,26,0.95)',
            backdropFilter: 'blur(12px)',
          }}>
          <h1 className="text-2xl font-black text-white">Tools</h1>
          <p className="text-xs text-gray-500 mt-0.5">Your personal toolkit</p>
        </div>

        <div className="px-4 pb-8 pt-3">
          <div className="grid grid-cols-2 gap-3">
            {UTILITIES.map(u => {
              const cnt = pendingCount(u.id)
              return (
                <button
                  key={u.id}
                  onClick={() => setActiveUtility(u.id)}
                  className="flex flex-col items-start p-4 rounded-3xl text-left transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
                >
                  <div className="flex w-full items-start justify-between mb-3">
                    <span className="text-3xl leading-none">{u.emoji}</span>
                    {cnt > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
                        {cnt}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white leading-tight">{u.title}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-tight">{u.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Sub-screen ─────────────────────────────────────────────────

  function renderUtility() {
    if (activeUtility === 'errand') {
      return (
        <ErrandRunScreen
          runs={errandRuns}
          onSaveRun={onSaveErrand}
          onDeleteRun={onDeleteErrand}
        />
      )
    }
    if (activeUtility === 'today') {
      return (
        <TodayScreen
          backlog={backlog}
          onAdd={onAddBacklog}
          onDelete={onDeleteBacklog}
          onUpdateStatus={onUpdateBacklogStatus}
        />
      )
    }
    if (activeUtility === 'backlog') {
      return (
        <BacklogScreen
          backlog={backlog}
          onAdd={onAddBacklog}
          onDelete={onDeleteBacklog}
          onUpdateStatus={onUpdateBacklogStatus}
        />
      )
    }
    if (activeUtility === 'checklists') {
      return (
        <ChecklistsView
          checklists={checklists}
          onSave={onSaveChecklist}
          onDelete={onDeleteChecklist}
          onBack={() => setActiveUtility(null)}
        />
      )
    }
    const config = GENERIC_CONFIGS[activeUtility]
    if (config) {
      return (
        <GenericUtility
          utilityId={activeUtility}
          config={config}
          items={utilityItems}
          onAdd={onAddUtilityItem}
          onToggle={onToggleUtilityItem}
          onDelete={onDeleteUtilityItem}
        />
      )
    }
    return <div className="px-4 py-12 text-center text-gray-500 text-sm">Coming soon.</div>
  }

  // Checklists owns its own header/navigation — render fullscreen without outer wrapper header
  if (activeUtility === 'checklists') {
    return (
      <div className="bg-base">
        {renderUtility()}
      </div>
    )
  }

  return (
    <div className="bg-base">
      <div className="sticky top-0 z-10 px-4 pb-3"
        style={{
          paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))',
          background: 'rgba(9,11,26,0.95)',
          backdropFilter: 'blur(12px)',
        }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveUtility(null)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <ChevronLeft size={20} color="rgba(255,255,255,0.8)" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              {activeConfig?.emoji} {activeConfig?.title}
            </h1>
            <p className="text-[11px] text-gray-500">{activeConfig?.desc}</p>
          </div>
        </div>
      </div>

      {renderUtility()}
    </div>
  )
}
