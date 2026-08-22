import { useState } from 'react'
import ExperienceScreen from './ExperienceScreen'
import CoachScreen from './CoachScreen'
import { BookOpen, Compass } from 'lucide-react'

export default function JournalScreen({ experiences, entries, onAdd, onDelete, embedded = false }) {
  const [mode, setMode] = useState('experiences')

  return (
    <div className="min-h-screen bg-base">
      {/* Mode toggle */}
      <div className="sticky top-0 z-10 bg-base/95 backdrop-blur-sm px-4 pt-4 pb-2"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <div className="flex bg-elevated rounded-2xl p-1">
          <button
            onClick={() => setMode('experiences')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'experiences' ? 'bg-accent text-white' : 'text-gray-400'
            }`}
          >
            <BookOpen size={15} /> Journal
          </button>
          <button
            onClick={() => setMode('coach')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'coach' ? 'bg-accent text-white' : 'text-gray-400'
            }`}
          >
            <Compass size={15} /> Coach
          </button>
        </div>
      </div>

      {/* Content — ExperienceScreen / CoachScreen already have their own screen padding  */}
      {mode === 'experiences' ? (
        <ExperienceScreen
          experiences={experiences}
          onAdd={onAdd}
          onDelete={onDelete}
          embedded
        />
      ) : (
        <CoachScreen experiences={experiences} entries={entries} embedded />
      )}
    </div>
  )
}
