import { useCallback, useState } from 'react'
import BottomNav      from './components/layout/BottomNav'
import HomeScreen     from './components/screens/HomeScreen'
import DailyScreen    from './components/screens/DailyScreen'
import LifeScreen     from './components/screens/LifeScreen'
import SettingsScreen from './components/screens/SettingsScreen'
import OnboardingScreen from './components/screens/OnboardingScreen'
import UtilitiesScreen from './components/screens/UtilitiesScreen'
import PortfolioScreen from './components/screens/PortfolioScreen'
import AgendaScreen from './components/screens/AgendaScreen'
import GuideScreen from './components/screens/GuideScreen'
import GlobalSearch from './components/GlobalSearch'
import QuickCapture from './components/QuickCapture'
import { ToastProvider } from './hooks/useToast'
import { useApp } from './hooks/useApp'

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  )
}

function AppShell() {
  const [tab, setTab] = useState('home')
  // Deep-link targets within a tab: which tool is open, which sub-tab is
  // selected. Bumping `nonce` re-applies the same target on a repeat jump.
  const [focus, setFocus] = useState({ utility: null, mode: null, date: null, nonce: 0 })
  const [overlay, setOverlay] = useState(null)  // 'search' | 'agenda' | 'guide'
  const app = useApp()

  /** Single entry point for every in-app jump, including from search results. */
  const navigate = useCallback((target, utility = null) => {
    const nav = typeof target === 'string' ? { tab: target, utility } : (target || {})
    if (nav.tab === 'agenda') { setOverlay('agenda'); return }
    if (nav.tab === 'guide')  { setOverlay('guide'); return }
    setFocus(f => ({
      utility: nav.utility ?? null,
      mode: nav.mode ?? null,
      date: nav.date ?? null,
      nonce: f.nonce + 1,
    }))
    setTab(nav.tab || 'home')
    setOverlay(null)
  }, [])

  if (app.loading) {
    return (
      <div className="flex-1 bg-base flex flex-col items-center justify-center gap-4">
        <div className="text-4xl animate-bounce-in">🚀</div>
        <p className="text-gray-400 text-sm">Loading Jarvis…</p>
      </div>
    )
  }

  // Local storage is the whole app — if it won't open, say so plainly instead of
  // spinning forever. The common cause is an older cached build opening a
  // database a newer build already upgraded, which a reload fixes.
  if (app.loadError) {
    return (
      <div className="flex-1 bg-base flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="text-4xl">🔒</div>
        <div>
          <p className="text-base font-bold text-white mb-1.5">Can't open your local data</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)' }}>
            Your data is still on this device — the app just couldn't read it. This usually means
            another tab has Jarvis open, or the app was updated. Close other tabs and reload.
          </p>
          <p className="text-[10px] mt-3 font-mono" style={{ color: 'rgba(240,244,255,0.28)' }}>
            {app.loadError?.name || 'Error'}: {app.loadError?.message || 'unknown'}
          </p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
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
            logStreak={app.logStreak}
            profile={app.profile}
            onSave={app.logEntry}
            entries={app.entries}
            onNavigate={navigate}
            backlog={app.backlog}
            utilityItems={app.utilityItems}
            errandRuns={app.errandRuns}
            goals={app.goals}
            people={app.people}
            onUpdateBacklogStatus={app.updateBacklogStatus}
            onDeleteBacklog={app.removeBacklogItem}
            onSetBacklogReminder={app.setBacklogReminder}
            onSetUtilityItemReminder={app.setUtilityItemReminder}
            onToggleUtilityItem={app.toggleUtilityItem}
            onDeleteUtilityItem={app.removeUtilityItem}
            onAddExperience={app.addExperience}
            onUpdateProfile={app.updateProfile}
            onOpenSearch={() => setOverlay('search')}
            onOpenAgenda={() => setOverlay('agenda')}
          />
        )
      case 'daily':
        return (
          <DailyScreen
            key={`daily-${focus.nonce}`}
            initialMode={focus.mode}
            initialDate={focus.date}
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
            key={`life-${focus.nonce}`}
            initialMode={focus.mode}
            entries={app.entries}
            levelInfo={app.levelInfo}
            streaks={app.streaks}
            earnedBadges={app.earnedBadges}
            totalXP={app.totalXP}
            goals={app.goals}
            onSaveGoal={app.upsertGoal}
            onDeleteGoal={app.removeGoal}
            onToggleMilestone={app.toggleMilestone}
          />
        )
      case 'utilities':
        return (
          <UtilitiesScreen
            key={`utilities-${focus.nonce}`}
            initialUtility={focus.utility}
            errandRuns={app.errandRuns}
            onSaveErrand={app.upsertErrandRun}
            onDeleteErrand={app.removeErrandRun}
            backlog={app.backlog}
            onAddBacklog={app.addBacklogItem}
            onDeleteBacklog={app.removeBacklogItem}
            onUpdateBacklogStatus={app.updateBacklogStatus}
            onSetBacklogReminder={app.setBacklogReminder}
            utilityItems={app.utilityItems}
            onAddUtilityItem={app.addUtilityItem}
            onToggleUtilityItem={app.toggleUtilityItem}
            onDeleteUtilityItem={app.removeUtilityItem}
            onSetUtilityItemReminder={app.setUtilityItemReminder}
            onUpdateUtilityItem={app.upsertUtilityItem}
            checklists={app.checklists}
            onSaveChecklist={app.upsertChecklist}
            onDeleteChecklist={app.removeChecklist}
            people={app.people}
            onSavePerson={app.upsertPerson}
            onDeletePerson={app.removePerson}
          />
        )
      case 'portfolio':
        return (
          <PortfolioScreen
            investments={app.investments}
            onSaveInvestment={app.upsertInvestment}
            onDeleteInvestment={app.removeInvestment}
          />
        )
      case 'settings':
        return (
          <SettingsScreen
            profile={app.profile}
            onUpdateProfile={app.updateProfile}
            onReload={app.reload}
            notificationPermission={app.notificationPermission}
            onRequestNotificationPermission={app.requestNotificationPermission}
            onOpenGuide={() => setOverlay('guide')}
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
    >
      <div key={tab} className="page-enter flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
        {renderScreen()}
      </div>
      <BottomNav active={tab} onChange={navigate} />
      <QuickCapture onAddBacklog={app.addBacklogItem} onAddUtilityItem={app.addUtilityItem} />

      {overlay === 'search' && (
        <GlobalSearch
          data={{
            backlog: app.backlog, utilityItems: app.utilityItems, experiences: app.experiences,
            goals: app.goals, people: app.people, checklists: app.checklists,
            errandRuns: app.errandRuns, investments: app.investments, entries: app.entries,
          }}
          onNavigate={navigate}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'agenda' && (
        <AgendaScreen
          backlog={app.backlog}
          utilityItems={app.utilityItems}
          goals={app.goals}
          people={app.people}
          onNavigate={navigate}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'guide' && <GuideScreen onClose={() => setOverlay(null)} />}
    </div>
  )
}
