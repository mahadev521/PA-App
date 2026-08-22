import { useState } from 'react'
import { PenLine, Star, BookOpen } from 'lucide-react'
import LogScreen        from './LogScreen'
import RitualScreen     from './RitualScreen'
import ExperienceScreen from './ExperienceScreen'

const TABS = [
  { id: 'log',     icon: PenLine,  label: 'Log',     gradient: 'linear-gradient(135deg,#0d9488,#059669)' },
  { id: 'ritual',  icon: Star,     label: 'Ritual',  gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
  { id: 'journal', icon: BookOpen, label: 'Journal', gradient: 'linear-gradient(135deg,#e11d48,#be123c)' },
]

export default function DailyScreen({ todayEntry, onSave, tasks, onAddTask, onToggleTask, onDeleteTask, experiences, onAddExperience, onDeleteExperience }) {
  const [mode, setMode] = useState('log')

  return (
    <div className="min-h-screen bg-base">
      {/* Sticky sub-header */}
      <div
        className="sticky top-0 z-10 px-4 pb-2"
        style={{
          paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
          background: 'rgba(9,11,26,0.95)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {TABS.map(({ id, icon: Icon, label, gradient }) => {
            const isActive = mode === id
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isActive
                  ? { background: gradient, color: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }
                  : { color: 'rgba(240,244,255,0.45)' }
                }
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'log' && (
        <LogScreen
          todayEntry={todayEntry}
          onSave={onSave}
          tasks={tasks}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          embedded
        />
      )}
      {mode === 'ritual' && (
        <RitualScreen todayEntry={todayEntry} onSave={onSave} embedded />
      )}
      {mode === 'journal' && (
        <ExperienceScreen
          experiences={experiences}
          onAdd={onAddExperience}
          onDelete={onDeleteExperience}
          embedded
        />
      )}
    </div>
  )
}
