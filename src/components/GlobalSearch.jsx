import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, CornerDownLeft } from 'lucide-react'
import { buildSearchIndex, searchIndex, groupResults } from '../utils/search'
import { haptic } from '../utils/haptics'

const RECENT_KEY = 'jarvis-recent-searches'

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function saveRecent(q) {
  try {
    const next = [q, ...loadRecent().filter(r => r !== q)].slice(0, 6)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch { /* private mode — recents are a nicety, not a requirement */ }
}

export default function GlobalSearch({ data, onNavigate, onClose }) {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(loadRecent)
  const inputRef = useRef(null)

  // Built once per open: these stores change rarely relative to keystrokes.
  const docs = useMemo(() => buildSearchIndex(data), [data])
  const results = useMemo(() => searchIndex(docs, query), [docs, query])
  const groups = useMemo(() => groupResults(results), [results])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function open(doc) {
    haptic('select')
    if (query.trim().length >= 2) {
      saveRecent(query.trim())
      setRecent(loadRecent())
    }
    onNavigate(doc.nav)
    onClose()
  }

  const totalDocs = docs.length

  return (
    <div className="fixed inset-0 z-[120] flex flex-col" style={{ background: 'rgba(6,8,20,0.97)', backdropFilter: 'blur(24px)' }}>
      {/* Search bar */}
      <div className="px-4 pb-3" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(167,139,250,0.28)' }}>
            <Search size={16} style={{ color: '#a78bfa' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search everything…"
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none py-3.5"
              style={{ fontSize: 16 }}
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search">
                <X size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </button>
            )}
          </div>
          <button onClick={onClose}
            className="px-3 py-3 rounded-2xl text-sm font-semibold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>
            Done
          </button>
        </div>
        <p className="text-[11px] mt-2 px-1" style={{ color: 'rgba(240,244,255,0.28)' }}>
          {query.trim().length >= 2
            ? `${results.length} match${results.length === 1 ? '' : 'es'} across ${totalDocs} items`
            : `${totalDocs} items indexed — backlog, tools, journal, goals, people, big rocks`}
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        {query.trim().length < 2 && (
          <div className="space-y-4 pt-2">
            {recent.length > 0 && (
              <div>
                <p className="section-title">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {recent.map(r => (
                    <button key={r} onClick={() => setQuery(r)}
                      className="px-3 py-2 rounded-xl text-xs font-medium"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="card">
              <p className="section-title">Try searching for</p>
              <ul className="space-y-1.5 text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>
                <li>· a person's name — to see every favour and note logged with them</li>
                <li>· a topic like <span className="text-accent-light">insurance</span> — across Life Admin, Journal and Backlog at once</li>
                <li>· a lesson you half-remember — Journal bodies are indexed too</li>
                <li>· a past Big Rock, to see what you were fighting that week</li>
              </ul>
            </div>
          </div>
        )}

        {query.trim().length >= 2 && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm font-bold text-white mb-1">No matches</p>
            <p className="text-xs text-gray-500">Nothing in your second brain mentions "{query.trim()}" yet.</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.name} className="mb-4">
            <p className="section-title">{group.name} · {group.items.length}</p>
            <div className="space-y-1.5">
              {group.items.map(doc => (
                <button key={doc.id} onClick={() => open(doc)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left active:scale-[0.99] transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.045)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    opacity: doc.done ? 0.5 : 1,
                  }}>
                  <span className="text-lg leading-none flex-shrink-0">{doc.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm leading-snug ${doc.done ? 'line-through text-gray-400' : 'text-white/90'}`}>
                      {doc.title}
                    </span>
                    {doc.subtitle && (
                      <span className="block text-[11px] mt-0.5 truncate" style={{ color: 'rgba(240,244,255,0.32)' }}>
                        {doc.subtitle}
                      </span>
                    )}
                  </span>
                  <CornerDownLeft size={13} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
