import { useState, useRef } from 'react'
import HomeScreen     from './components/screens/HomeScreen'
import DailyScreen    from './components/screens/DailyScreen'
import LifeScreen     from './components/screens/LifeScreen'
import SettingsScreen from './components/screens/SettingsScreen'
import OnboardingScreen from './components/screens/OnboardingScreen'
import UtilitiesScreen from './components/screens/UtilitiesScreen'
import { useApp } from './hooks/useApp'

const TABS = ['home', 'daily', 'utilities', 'life']

export default function App() {
  const [tab, setTab] = useState('home')
  const app = useApp()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Only treat as horizontal swipe if mostly horizontal and long enough
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return
    const idx = TABS.indexOf(tab)
    if (dx < 0 && idx < TABS.length - 1) setTab(TABS[idx + 1])  // swipe left → next
    if (dx > 0 && idx > 0)              setTab(TABS[idx - 1])  // swipe right → prev
  }

  if (app.loading) {
    return (
      <div className="flex-1 bg-base flex flex-col items-center justify-center gap-4">
        <div className="text-4xl animate-bounce-in">🚀</div>
        <p className="text-gray-400 text-sm">Loading LifeOS…</p>
      </div>
    )
  }

  // Show onboarding on first launch (name is default 'You')
  if (!app.loading && (!app.profile?.name || app.profile.name === 'You')) {
    return (
      <div className="flex-1 overflow-hidden">
        <OnboardingScreen onComplete={name => app.updateProfile({ name })} />
      </div>
    )
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
      case 'daily':
        return (
          <DailyScreen
            todayEntry={app.todayEntry}
            onSave={app.logEntry}
            tasks={app.tasks}
            onAddTask={app.addTask}
            onToggleTask={app.toggleTask}
            onDeleteTask={app.removeTask}
            experiences={app.experiences}
            onAddExperience={app.addExperience}
            onDeleteExperience={app.removeExperience}
          />
        )
      case 'life':
        return (
          <LifeScreen
            entries={app.entries}
            levelInfo={app.levelInfo}
            streaks={app.streaks}
            earnedBadges={app.earnedBadges}
            totalXP={app.totalXP}
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
            checklists={app.checklists}
            onSaveChecklist={app.upsertChecklist}
            onDeleteChecklist={app.removeChecklist}
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
      default:
        return null
    }
  }

  return (
    <div
      className="bg-base flex flex-col"
      style={{ flex: 1, overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div key={tab} className="page-enter flex-1 overflow-y-auto">
        {renderScreen()}
      </div>
    </div>
  )
}
