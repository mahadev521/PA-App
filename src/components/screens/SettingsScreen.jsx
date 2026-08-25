import { useState, useRef } from 'react'
import { User, Download, Upload, Trash2, Info, ChevronRight } from 'lucide-react'
import { exportData, importData, clearAllEntries } from '../../utils/storage'

export default function SettingsScreen({ profile, onUpdateProfile, onReload }) {
  const [name, setName] = useState(profile?.name || '')
  const [saved, setSaved] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const fileRef = useRef()

  async function handleSaveName() {
    await onUpdateProfile({ name })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    await importData(text)
    onReload()
    alert('Data imported successfully!')
    e.target.value = ''
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
          onClick={exportData}
          className="flex items-center justify-between w-full p-3 bg-elevated rounded-xl"
        >
          <span className="text-sm text-white flex items-center gap-2">
            <Download size={16} className="text-emerald" /> Export backup (JSON)
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
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
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
    </div>
  )
}
