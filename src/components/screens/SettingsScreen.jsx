import { useState, useRef } from 'react'
import { User, Download, Upload, Trash2, Info, ChevronRight, Bell, X, Lock } from 'lucide-react'
import { exportData, importData, clearAllEntries } from '../../utils/storage'
import { notificationsSupported } from '../../utils/notifications'

const PERMISSION_LABEL = {
  granted: 'Enabled',
  denied: 'Blocked — enable in browser settings',
  default: 'Not enabled',
  unsupported: 'Not supported on this device/browser',
}

export default function SettingsScreen({ profile, onUpdateProfile, onReload, notificationPermission, onRequestNotificationPermission }) {
  const [name, setName] = useState(profile?.name || '')
  const [saved, setSaved] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const fileRef = useRef()

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportPass, setExportPass] = useState('')
  const [exportPassConfirm, setExportPassConfirm] = useState('')
  const [exportError, setExportError] = useState('')

  const [showImportModal, setShowImportModal] = useState(false)
  const [importPass, setImportPass] = useState('')
  const [importError, setImportError] = useState('')
  const [pendingImportText, setPendingImportText] = useState(null)

  async function handleSaveName() {
    await onUpdateProfile({ name })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleExportSubmit() {
    setExportError('')
    if (!exportPass.trim()) { setExportError('Enter a passphrase.'); return }
    if (exportPass !== exportPassConfirm) { setExportError("Passphrases don't match."); return }
    try {
      await exportData(exportPass)
      setShowExportModal(false)
      setExportPass('')
      setExportPassConfirm('')
    } catch {
      setExportError('Export failed. Please try again.')
    }
  }

  async function handleFileSelected(e) {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    e.target.value = ''
    let parsed
    try { parsed = JSON.parse(text) } catch { alert('That file is not a valid backup.'); return }

    if (parsed.__encrypted) {
      setPendingImportText(text)
      setImportError('')
      setImportPass('')
      setShowImportModal(true)
    } else {
      await importData(text)
      onReload()
      alert('Data imported successfully!')
    }
  }

  async function handleImportSubmit() {
    setImportError('')
    if (!importPass.trim()) { setImportError('Enter the passphrase.'); return }
    try {
      await importData(pendingImportText, importPass)
      setShowImportModal(false)
      setImportPass('')
      setPendingImportText(null)
      onReload()
      alert('Data imported successfully!')
    } catch {
      setImportError('Incorrect password or corrupted file.')
    }
  }

  async function handleReset() {
    await clearAllEntries()
    onReload()
    setShowReset(false)
    alert('All entries deleted.')
  }

  return (
    <div className="screen space-y-5 animate-fade-in">
      <h1 className="text-2xl font-black text-white">Settings</h1>

      {/* Name */}
      <div className="card space-y-3">
        <p className="section-title">Your name</p>
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff' }}>
            {name.trim() ? name.trim()[0].toUpperCase() : '?'}
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            className="flex-1 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <button onClick={handleSaveName} className="btn-primary w-full">
          {saved ? '✓ Saved' : 'Save Name'}
        </button>
      </div>

      {/* Data */}
      <div className="card space-y-2">
        <p className="section-title">Data</p>
        <button
          onClick={() => { setExportError(''); setShowExportModal(true) }}
          className="flex items-center justify-between w-full p-3 bg-elevated rounded-xl"
        >
          <span className="text-sm text-white flex items-center gap-2">
            <Download size={16} className="text-emerald" /> Export backup (encrypted)
          </span>
          <ChevronRight size={14} className="text-gray-500" />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-between w-full p-3 bg-elevated rounded-xl"
        >
          <span className="text-sm text-white flex items-center gap-2">
            <Upload size={16} className="text-sky" /> Import backup
          </span>
          <ChevronRight size={14} className="text-gray-500" />
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelected} className="hidden" />
        <p className="text-[10px] text-gray-500 px-1">Backups are password-encrypted on your device before saving. Old unencrypted backups can still be imported.</p>
      </div>

      {/* Notifications */}
      <div className="card space-y-2">
        <p className="section-title">Notifications</p>
        <div className="flex items-center justify-between p-3 bg-elevated rounded-xl">
          <span className="text-sm text-white flex items-center gap-2">
            <Bell size={16} className="text-accent" /> Reminders
          </span>
          <span className="text-xs text-gray-400">{PERMISSION_LABEL[notificationPermission] || PERMISSION_LABEL.default}</span>
        </div>
        {notificationsSupported() && notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
          <button onClick={onRequestNotificationPermission} className="btn-primary w-full">
            Enable reminders
          </button>
        )}
        <p className="text-[10px] text-gray-500">Reminders you set on Backlog, Today, and Utility items fire while this app is open on this device.</p>
      </div>

      {/* Deploy to GitHub Pages */}
      <div className="card space-y-3">
        <p className="section-title">Deploy to GitHub Pages</p>
        <div className="space-y-1.5 text-xs text-gray-300 leading-relaxed">
          <p>1. Create a GitHub repo named <span className="text-accent font-semibold">PA-App</span></p>
          <p>2. In the terminal, from the project folder:</p>
          <div className="bg-elevated rounded-xl px-3 py-2 font-mono text-[11px] text-emerald">
            git init && git add . && git commit -m "init"<br/>
            git remote add origin https://github.com/YOUR_NAME/PA-App.git<br/>
            git push -u origin main
          </div>
          <p>3. On GitHub: <span className="text-white">Settings → Pages → Source → GitHub Actions</span></p>
          <p>4. Every <span className="text-white">git push</span> auto-deploys. Your app will live at:</p>
          <p className="text-accent font-medium">https://YOUR_NAME.github.io/PA-App/</p>
        </div>
        <p className="text-[10px] text-gray-500">All data stays on your device (IndexedDB). Nothing is sent to any server.</p>
      </div>

      {/* Danger zone */}
      <div className="card border border-rose/20 space-y-2">
        <p className="text-xs font-semibold text-rose uppercase tracking-widest">Danger zone</p>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center justify-between w-full p-3 bg-elevated rounded-xl"
          >
            <span className="text-sm text-rose flex items-center gap-2">
              <Trash2 size={16} /> Delete all entries
            </span>
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">This will permanently delete all logged data. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 rounded-xl bg-rose/20 border border-rose text-rose text-sm font-semibold">
                Yes, delete all
              </button>
              <button onClick={() => setShowReset(false)} className="flex-1 py-2 rounded-xl bg-elevated text-gray-300 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Info size={14} />
          <span>Jarvis v1.0 · All data stored on your device · <a href="https://github.com" className="text-accent">GitHub Pages</a></span>
        </div>
      </div>

      {/* Export passphrase modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-[400px] p-5 rounded-3xl space-y-3"
            style={{ background: 'rgba(17,21,48,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-white flex items-center gap-2"><Lock size={16} /> Encrypt Backup</p>
              <button onClick={() => setShowExportModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <input type="password" placeholder="Passphrase" value={exportPass}
              onChange={e => setExportPass(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <input type="password" placeholder="Confirm passphrase" value={exportPassConfirm}
              onChange={e => setExportPassConfirm(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <p className="text-[11px] text-rose leading-relaxed">
              If you lose this passphrase, this backup cannot be recovered — there is no reset.
            </p>
            {exportError && <p className="text-[11px] text-rose">{exportError}</p>}
            <button onClick={handleExportSubmit} className="btn-primary w-full">Encrypt &amp; Download</button>
          </div>
        </div>
      )}

      {/* Import passphrase modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-[400px] p-5 rounded-3xl space-y-3"
            style={{ background: 'rgba(17,21,48,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-white flex items-center gap-2"><Lock size={16} /> Enter Passphrase</p>
              <button onClick={() => { setShowImportModal(false); setPendingImportText(null) }}><X size={18} className="text-gray-400" /></button>
            </div>
            <input type="password" placeholder="Passphrase" value={importPass}
              onChange={e => setImportPass(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            {importError && <p className="text-[11px] text-rose">{importError}</p>}
            <button onClick={handleImportSubmit} className="btn-primary w-full">Decrypt &amp; Import</button>
          </div>
        </div>
      )}
    </div>
  )
}
