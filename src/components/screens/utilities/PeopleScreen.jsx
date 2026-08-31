import { useState } from 'react'
import { Plus, Trash2, X, ChevronLeft, Heart, HeartCrack, HandCoins } from 'lucide-react'

const SEVERITY_POINTS = [10, 20, 30, 40, 50]

function scoreOf(person) {
  return (person.events || []).reduce((s, e) => s + (e.points || 0), 0)
}

function scoreColor(score) {
  if (score > 0) return '#10b981'
  if (score < 0) return '#f43f5e'
  return 'rgba(255,255,255,0.4)'
}

const emptyContact = { name: '', relationship: '', notes: '' }
const emptyEvent = { type: 'kind', text: '', severity: 3, owedDirection: '', owedDesc: '' }

export default function PeopleScreen({ people, onSavePerson, onDeletePerson }) {
  const [selectedId, setSelectedId] = useState(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactForm, setContactForm] = useState(emptyContact)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState(emptyEvent)

  const list = people || []
  const person = list.find(p => p.id === selectedId)

  function persist(updated) {
    return onSavePerson(updated)
  }

  async function handleAddContact() {
    if (!contactForm.name.trim()) return
    await onSavePerson({ name: contactForm.name.trim(), relationship: contactForm.relationship.trim(), notes: contactForm.notes.trim(), events: [] })
    setShowAddContact(false)
    setContactForm(emptyContact)
  }

  async function handleAddEvent() {
    if (!eventForm.text.trim() || !person) return
    const magnitude = SEVERITY_POINTS[eventForm.severity - 1]
    const event = {
      id: `ev_${Date.now()}`,
      type: eventForm.type,
      text: eventForm.text.trim(),
      points: eventForm.type === 'kind' ? magnitude : -magnitude,
      date: new Date().toISOString().slice(0, 10),
      owed: eventForm.owedDirection ? { direction: eventForm.owedDirection, desc: eventForm.owedDesc.trim(), settled: false } : null,
    }
    await persist({ ...person, events: [...(person.events || []), event] })
    setShowEventForm(false)
    setEventForm(emptyEvent)
  }

  async function settleEvent(eventId) {
    await persist({
      ...person,
      events: person.events.map(e => e.id === eventId ? { ...e, owed: { ...e.owed, settled: true } } : e),
    })
  }

  async function removeEvent(eventId) {
    await persist({ ...person, events: person.events.filter(e => e.id !== eventId) })
  }

  // ── Detail view ──────────────────────────────────────────────
  if (person) {
    const score = scoreOf(person)
    const sortedEvents = [...(person.events || [])].sort((a, b) => (a.date < b.date ? 1 : -1))
    const unresolvedOwed = (person.events || []).filter(e => e.owed && !e.owed.settled)

    return (
      <div className="px-4 pb-8">
        <div className="flex items-center gap-3 mt-4 mb-3">
          <button onClick={() => setSelectedId(null)} className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          </button>
          <div className="flex-1">
            <p className="text-base font-bold text-white leading-tight">{person.name}</p>
            {person.relationship && <p className="text-[11px] text-gray-500">{person.relationship}</p>}
          </div>
          <span className="text-lg font-black" style={{ color: scoreColor(score) }}>{score > 0 ? '+' : ''}{score}</span>
          <button onClick={() => { onDeletePerson(person.id); setSelectedId(null) }}>
            <Trash2 size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
        </div>

        {person.notes && <p className="text-xs text-gray-400 mb-3">{person.notes}</p>}

        {unresolvedOwed.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="section-title">Owed</p>
            {unresolvedOwed.map(e => (
              <div key={e.id} className="flex items-center gap-2 p-3 rounded-2xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <HandCoins size={15} style={{ color: '#f59e0b' }} className="flex-shrink-0" />
                <span className="flex-1 text-xs text-white/90">
                  {e.owed.direction === 'i_owe' ? 'You owe them: ' : 'They owe you: '}{e.owed.desc || e.text}
                </span>
                <button onClick={() => settleEvent(e.id)} className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Settle</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowEventForm(v => !v)} className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
          <Plus size={16} /> Log Event
        </button>

        {showEventForm && (
          <div className="card space-y-3 mb-4">
            <div className="flex gap-2">
              <button onClick={() => setEventForm(f => ({ ...f, type: 'kind' }))}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                style={eventForm.type === 'kind'
                  ? { background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                <Heart size={14} /> Kind
              </button>
              <button onClick={() => setEventForm(f => ({ ...f, type: 'hurtful' }))}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                style={eventForm.type === 'hurtful'
                  ? { background: 'rgba(244,63,94,0.2)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                <HeartCrack size={14} /> Hurtful
              </button>
            </div>

            <input value={eventForm.text} onChange={e => setEventForm(f => ({ ...f, text: e.target.value }))}
              placeholder={eventForm.type === 'kind' ? 'What did they do?' : 'What happened?'}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

            <div>
              <p className="text-xs text-gray-400 mb-1.5">Severity</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setEventForm(f => ({ ...f, severity: n }))}
                    className="flex-1 h-9 rounded-lg text-xs font-bold"
                    style={eventForm.severity >= n
                      ? { background: eventForm.type === 'kind' ? '#10b981' : '#f43f5e', color: '#000' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {[
                { id: '', label: 'No favor owed' },
                { id: 'i_owe', label: 'I owe them' },
                { id: 'they_owe', label: 'They owe me' },
              ].map(o => (
                <button key={o.id} onClick={() => setEventForm(f => ({ ...f, owedDirection: o.id }))}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold"
                  style={eventForm.owedDirection === o.id
                    ? { background: 'rgba(124,58,237,0.25)', color: '#a78bfa' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }}>
                  {o.label}
                </button>
              ))}
            </div>
            {eventForm.owedDirection && (
              <input value={eventForm.owedDesc} onChange={e => setEventForm(f => ({ ...f, owedDesc: e.target.value }))}
                placeholder="What's owed?"
                className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            )}

            <button onClick={handleAddEvent} className="btn-primary w-full">Save Event</button>
          </div>
        )}

        <p className="section-title">Timeline</p>
        {sortedEvents.length === 0 && <div className="text-center py-8 text-gray-600 text-sm">No events logged yet.</div>}
        <div className="space-y-2">
          {sortedEvents.map(e => (
            <div key={e.id} className="flex items-start gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {e.type === 'kind'
                ? <Heart size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                : <HeartCrack size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#f43f5e' }} />}
              <div className="flex-1">
                <p className="text-sm text-white/90 leading-snug">{e.text}</p>
                <p className="text-[10px] text-gray-500">{e.date}</p>
              </div>
              <span className="text-xs font-bold flex-shrink-0" style={{ color: e.points > 0 ? '#10b981' : '#f43f5e' }}>
                {e.points > 0 ? '+' : ''}{e.points}
              </span>
              <button onClick={() => removeEvent(e.id)} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────
  return (
    <div className="px-4 pb-8 pt-3 space-y-4">
      <button onClick={() => setShowAddContact(v => !v)} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus size={18} /> Add Contact
      </button>

      {showAddContact && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-title mb-0">New Contact</p>
            <button onClick={() => setShowAddContact(false)}><X size={16} style={{ color: 'rgba(255,255,255,0.4)' }} /></button>
          </div>
          <input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <input value={contactForm.relationship} onChange={e => setContactForm(f => ({ ...f, relationship: e.target.value }))}
            placeholder="Relationship (e.g. friend, colleague, family)"
            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <textarea value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" rows={2}
            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <button onClick={handleAddContact} className="btn-primary w-full">Add Contact</button>
        </div>
      )}

      {list.length === 0 && !showAddContact && (
        <div className="text-center py-12 text-gray-600 text-sm">No contacts yet — add one above ↑</div>
      )}

      <div className="space-y-2">
        {list.map(p => {
          const score = scoreOf(p)
          const owedCount = (p.events || []).filter(e => e.owed && !e.owed.settled).length
          return (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90">{p.name}</p>
                {p.relationship && <p className="text-[11px] text-gray-500">{p.relationship}</p>}
              </div>
              {owedCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                  {owedCount} owed
                </span>
              )}
              <span className="text-sm font-black flex-shrink-0" style={{ color: scoreColor(score) }}>
                {score > 0 ? '+' : ''}{score}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
