import { useState, lazy, Suspense } from 'react'
import BottomNav from './components/layout/BottomNav'
import HomeScreen from './components/screens/HomeScreen'
import LogScreen from './components/screens/LogScreen'
import RitualScreen from './components/screens/RitualScreen'
import JournalScreen from './components/screens/JournalScreen'
import SettingsScreen from './components/screens/SettingsScreen'
import ProgressScreen from './components/screens/ProgressScreen'
import OnboardingScreen from './components/screens/OnboardingScreen'
import UtilitiesScreen from './components/screens/UtilitiesScreen'
import { useApp } from './hooks/useApp'

const ChartsScreen = lazy(() => import('./components/screens/ChartsScreen'))

const Loader = () => (
  <div className="screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
)

export default function App() {
  const [tab, setTab] = useState('home')
  const app = useApp()

  if (app.loading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4">
        <div className="text-4xl animate-bounce-in">🚀</div>
        <p className="text-gray-400 text-sm">Loading LifeOS…</p>
      </div>
    )
  }

  // Show onboarding on first launch (name is default 'You')
  if (!app.loading && (!app.profile?.name || app.profile.name === 'You')) {
    return <OnboardingScreen onComplete={name => app.updateProfile({ name })} />
  }

  function renderScreen() {
    switch (tab) {
      case 'home':
        return (
          <HomeScreen
            levelInfo={app.levelInfo}
            streaks={app.streaks}
            todayEntry={app.todayEntry}
            todayXP={app.todayXP}
            logStreak={app.logStreak}
            profile={app.profile}
            onSave={app.logEntry}
            entries={app.entries}
            onNavigate={setTab}
          />
        )
      case 'log':
        return (
          <LogScreen
            todayEntry={app.todayEntry}
            onSave={app.logEntry}
            tasks={app.tasks}
            onAddTask={app.addTask}
            onToggleTask={app.toggleTask}
            onDeleteTask={app.removeTask}
          />
        )
      case 'ritual':
        return <RitualScreen todayEntry={app.todayEntry} onSave={app.logEntry} />
      case 'charts':
        return (
          <Suspense fallback={<Loader />}>
            <ChartsScreen entries={app.entries} />
          </Suspense>
        )
      case 'journal':
        return (
          <JournalScreen
            experiences={app.experiences}
            entries={app.entries}
            onAdd={app.addExperience}
            onDelete={app.removeExperience}
          />
        )
      case 'progress':
        return (
          <ProgressScreen
            levelInfo={app.levelInfo}
            streaks={app.streaks}
            earnedBadges={app.earnedBadges}
            totalXP={app.totalXP}
            entries={app.entries}
          />
        )
      case 'settings':
        return (
          <SettingsScreen
            profile={app.profile}
            onUpdateProfile={app.updateProfile}
            onReload={app.reload}
          />
        )
      case 'utilities':
        return (
          <UtilitiesScreen
            errandRuns={app.errandRuns}
            onSaveErrand={app.upsertErrandRun}
            onDeleteErrand={app.removeErrandRun}
            backlog={app.backlog}
            onAddBacklog={app.addBacklogItem}
            onDeleteBacklog={app.removeBacklogItem}
            onUpdateBacklogStatus={app.updateBacklogStatus}
            utilityItems={app.utilityItems}
            onAddUtilityItem={app.addUtilityItem}
            onToggleUtilityItem={app.toggleUtilityItem}
            onDeleteUtilityItem={app.removeUtilityItem}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-base min-h-screen">
      <div key={tab} className="page-enter">
        {renderScreen()}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
