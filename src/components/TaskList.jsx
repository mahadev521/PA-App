import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'

export const SEVERITY = [
  { key: 'critical', label: 'Critical', emoji: '🔴', weight: 4, color: 'text-red-400 border-red-500/40 bg-red-500/10' },
  { key: 'high',     label: 'High',     emoji: '🟠', weight: 3, color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  { key: 'medium',   label: 'Medium',   emoji: '🟡', weight: 2, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { key: 'low',      label: 'Low',      emoji: '⚪', weight: 1, color: 'text-gray-400 border-gray-500/40 bg-gray-500/10' },
]

export const PRIORITY = [
  { key: 'p1', label: 'P1 · Now',    desc: 'Urgent',    weight: 3 },
  { key: 'p2', label: 'P2 · Soon',   desc: 'Important', weight: 2 },
  { key: 'p3', label: 'P3 · Later',  desc: 'Someday',   weight: 1 },
]

function frogScore(t) {
  const s = SEVERITY.find(x => x.key === t.severity)?.weight || 1
  const p = PRIORITY.find(x => x.key === t.priority)?.weight || 1
  return s * p
}

function AddForm({ onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState('high')
  const [priority, setPriority] = useState('p1')

  function submit() {
    if (!title.trim()) return
    onSave(title.trim(), severity, priority)
    onClose()
  }

  return (
    <div className="card space-y-3 border border-accent/20">
      <input
        type="text"
        placeholder="What needs to be done?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus
        className="w-full bg-elevated rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent"
      />

      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">Severity · How important?</p>
        <div className="flex gap-1.5">
          {SEVERITY.map(s => (
            <button key={s.key} onClick={() => setSeverity(s.key)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                severity === s.key ? s.color : 'bg-elevated border-border text-gray-500'
              }`}>
              {s.emoji}<br />{s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">Priority · How urgent?</p>
        <div className="flex gap-1.5">
          {PRIORITY.map(p => (
            <button key={p.key} onClick={() => setPriority(p.key)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                priority === p.key ? 'bg-accent/20 border-accent text-white' : 'bg-elevated border-border text-gray-500'
              }`}>
              {p.label}<br />
              <span className="text-[9px] font-normal">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={submit} disabled={!title.trim()} className={`flex-1 btn-primary py-2.5 text-sm ${!title.trim() ? 'opacity-40' : ''}`}>
          Add Task
        </button>
        <button onClick={onClose} className="btn-ghost py-2.5 px-3">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function TaskRow({ task, isFrog, onToggle, onDelete }) {
  const sev = SEVERITY.find(s => s.key === task.severity) || SEVERITY[1]
  const pri = PRIORITY.find(p => p.key === task.priority) || PRIORITY[1]

  return (
    <div className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
      task.completed
        ? 'opacity-35 bg-elevated border-border'
        : isFrog
          ? 'bg-orange-500/5 border-orange-500/25'
          : 'bg-elevated border-border'
    }`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          task.completed ? 'bg-emerald border-emerald' : 'border-gray-500'
        }`}
      >
        {task.completed && <Check size={10} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
          {isFrog && !task.completed && <span className="mr-1">🐸</span>}
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${sev.color}`}>
            {sev.emoji} {sev.label}
          </span>
          <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded border border-border">
            {pri.label}
          </span>
        </div>
      </div>

      <button onClick={() => onDelete(task.id)} className="p-1 text-gray-600 active:text-rose flex-shrink-0 mt-0.5">
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export default function TaskList({ tasks, onAdd, onToggle, onDelete }) {
  const [adding, setAdding] = useState(false)

  const incomplete = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => frogScore(b) - frogScore(a))

  const completed = [...tasks]
    .filter(t => t.completed)
    .sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0))
    .slice(0, 5)

  const frog = incomplete[0]

  return (
    <div className="space-y-2">
      {/* Eisenhower/Eat That Frog label */}
      {frog && (
        <div className="flex items-start gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <span className="text-base mt-0.5">🐸</span>
          <div>
            <p className="text-[10px] text-orange-300 font-semibold uppercase tracking-wide">Eat That Frog First</p>
            <p className="text-xs text-white font-medium">{frog.title}</p>
          </div>
        </div>
      )}

      {incomplete.map((task, i) => (
        <TaskRow key={task.id} task={task} isFrog={i === 0} onToggle={onToggle} onDelete={onDelete} />
      ))}

      {!incomplete.length && !adding && (
        <p className="text-xs text-gray-500 text-center py-2">No pending tasks — add your first frog 🐸</p>
      )}

      {adding ? (
        <AddForm onSave={onAdd} onClose={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-gray-400 text-sm active:bg-elevated transition-all"
        >
          <Plus size={14} /> Add task
        </button>
      )}

      {completed.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide px-1">Completed today</p>
          {completed.map(task => (
            <TaskRow key={task.id} task={task} isFrog={false} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
