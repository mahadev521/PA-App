import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Brush,
} from 'recharts'
import { getMetricSeries, getWeeklyAverages, getMetricStats, generateInsight, getProjection, getCompoundSummary } from '../../utils/analytics'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const METRICS = [
  // Health
  { key: 'sleep_hours',      label: 'Sleep',      emoji: '😴', unit: 'h',   color: '#38bdf8', target: 8,   max: 12,  dir: 'health' },
  { key: 'energy_score',     label: 'Energy',     emoji: '⚡', unit: '/10', color: '#34d399', target: 8,   max: 10,  dir: 'health' },
  { key: 'mood_score',       label: 'Mood',       emoji: '😊', unit: '/10', color: '#a78bfa', target: 8,   max: 10,  dir: 'health' },
  { key: 'water_liters',     label: 'Hydration',  emoji: '💧', unit: 'L',   color: '#22d3ee', target: 2,   max: 5,   dir: 'health' },
  // Professional
  { key: 'deep_work_hours',  label: 'Deep Work',  emoji: '🔥', unit: 'h',   color: '#f97316', target: 4,   max: 10,  dir: 'pro' },
  { key: 'learning_minutes', label: 'Learning',   emoji: '📚', unit: 'm',   color: '#6366f1', target: 60,  max: 200, dir: 'pro' },
  // God
  { key: 'god_minutes',      label: 'God Time',   emoji: '🕊️', unit: 'm',  color: '#fde68a', target: 30,  max: 120, dir: 'god' },
  // Wealth
  { key: 'expense_amount',   label: 'Spend',      emoji: '💳', unit: '₹',   color: '#fb7185', target: null,max: null,dir: 'wealth' },
  // Family
  { key: 'family_time',      label: 'Family',     emoji: '❤️', unit: 'm',  color: '#f472b6', target: 60,  max: 300, dir: 'family' },
]

const DIR_FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'health', label: '💪 Health' },
  { key: 'pro',    label: '💼 Work' },
  { key: 'god',    label: '🕊️ God' },
  { key: 'wealth', label: '💰 Wealth' },
  { key: 'family', label: '❤️ Family' },
]

const RANGES = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 365 },
]

function StatChip({ label, value, unit, highlight }) {
  return (
    <div className="flex-1 bg-elevated rounded-xl p-3 text-center">
      <div className={`text-lg font-black ${highlight ? 'gradient-text-accent' : 'text-white'}`}>
        {value ?? '—'}{value != null ? unit : ''}
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div className="bg-elevated border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-bold">{val != null ? `${val}${unit}` : '—'}</p>
    </div>
  )
}

export default function ChartsScreen({ entries, embedded = false }) {
  const [activeMetric, setActiveMetric] = useState(METRICS[0])
  const [range, setRange] = useState(30)
  const [dirFilter, setDirFilter] = useState('all')

  const visibleMetrics = useMemo(
    () => dirFilter === 'all' ? METRICS : METRICS.filter(m => m.dir === dirFilter),
    [dirFilter]
  )

  const series = useMemo(
    () => getMetricSeries(entries, activeMetric.key, range),
    [entries, activeMetric.key, range]
  )

  const weekly = useMemo(
    () => getWeeklyAverages(entries, activeMetric.key, 8),
    [entries, activeMetric.key]
  )

  const stats = useMemo(
    () => getMetricStats(entries, activeMetric.key),
    [entries, activeMetric.key]
  )

  const projection = useMemo(
    () => getProjection(entries, activeMetric.key, 30),
    [entries, activeMetric.key]
  )

  const combined = useMemo(() => {
    const actual = series.map(d => ({ ...d, projected: null }))
    return [...actual, ...projection]
  }, [series, projection])

  const compound = useMemo(
    () => getCompoundSummary(entries, activeMetric.key),
    [entries, activeMetric.key]
  )

  const insight = useMemo(
    () => generateInsight(entries, activeMetric.key),
    [entries, activeMetric.key]
  )

  const trendDir = useMemo(() => {
    const last7 = series.slice(-7).map(d => d.value).filter(v => v != null)
    const prev7 = series.slice(-14, -7).map(d => d.value).filter(v => v != null)
    if (!last7.length || !prev7.length) return 'flat'
    const a = last7.reduce((s, v) => s + v, 0) / last7.length
    const b = prev7.reduce((s, v) => s + v, 0) / prev7.length
    if (a > b + 0.3) return 'up'
    if (a < b - 0.3) return 'down'
    return 'flat'
  }, [series])

  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus
  const trendColor = trendDir === 'up' ? 'text-emerald' : trendDir === 'down' ? 'text-rose' : 'text-gray-400'

  if (!entries.length) {
    return (
      <div className="screen flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">📊</span>
        <p className="text-gray-400 text-center text-sm">Start logging daily data to see your trends here.</p>
      </div>
    )
  }

  // Ensure active metric is in the filtered list
  const activeInView = visibleMetrics.find(m => m.key === activeMetric.key)
  const displayMetric = activeInView || visibleMetrics[0]

  return (
    <div
      className={`${embedded ? 'px-4 space-y-5 animate-fade-in' : 'screen space-y-5 animate-fade-in'}`}
      style={embedded ? { paddingTop: '1.25rem', paddingBottom: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))' } : {}}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Charts</h1>
        <div className="flex gap-1.5">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                range === r.days ? 'bg-accent text-white' : 'bg-elevated text-gray-400'
              }`}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Direction filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {DIR_FILTERS.map(f => (
          <button key={f.key} onClick={() => { setDirFilter(f.key); if (!visibleMetrics.find(m => m.key === activeMetric.key)) setActiveMetric(METRICS.find(m => f.key === 'all' || m.dir === f.key) || METRICS[0]) }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              dirFilter === f.key ? 'bg-accent text-white' : 'bg-elevated text-gray-400'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {visibleMetrics.map(m => (
          <button key={m.key} onClick={() => setActiveMetric(m)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
              displayMetric.key === m.key ? 'text-white' : 'bg-elevated text-gray-400 border-transparent'
            }`}
            style={displayMetric.key === m.key ? { borderColor: m.color, backgroundColor: `${m.color}20` } : {}}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Hero stat + trend */}
      <div className="card-elevated space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">{displayMetric.label}</p>
            <p className="text-3xl font-black text-white">
              {stats.avg}{displayMetric.unit}
              <span className="text-sm font-normal text-gray-400 ml-1">avg</span>
            </p>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon size={18} />
            <span className="text-sm font-semibold capitalize">{trendDir}</span>
          </div>
        </div>

        {/* Line Chart with Brush for zoom/scroll + dotted compound projection */}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combined} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#4b5563', fontSize: 10 }}
                interval={range <= 7 ? 0 : range <= 30 ? 4 : 13}
                tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} tickLine={false} axisLine={false}
                domain={[0, displayMetric.max || 'auto']} />
              <Tooltip content={<CustomTooltip unit={displayMetric.unit} />} />
              {displayMetric.target && (
                <ReferenceLine y={displayMetric.target} stroke={displayMetric.color}
                  strokeDasharray="4 4" strokeOpacity={0.4} />
              )}
              {/* Actual data — solid line */}
              <Line type="monotone" dataKey="value" stroke={displayMetric.color} strokeWidth={2.5}
                dot={range <= 14 ? { r: 3, fill: displayMetric.color } : false}
                activeDot={{ r: 5, fill: displayMetric.color }}
                connectNulls={false} />
              {/* Compound projection — dotted */}
              {projection.length > 0 && (
                <Line type="monotone" dataKey="projected" stroke={displayMetric.color}
                  strokeWidth={1.5} strokeDasharray="4 4" dot={false}
                  strokeOpacity={0.5} connectNulls />
              )}
              {range >= 30 && (
                <Brush dataKey="label" height={18} stroke="#2a2a3e" travellerWidth={10}
                  fill="#131320" tickFormatter={() => ''} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-2">
          <StatChip label="Average" value={stats.avg} unit={displayMetric.unit} />
          <StatChip label="Best" value={stats.best} unit={displayMetric.unit} highlight />
          <StatChip label="Days logged" value={stats.count} unit="" />
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="card space-y-3">
        <p className="section-title">Weekly averages</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#4b5563', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} tickLine={false} axisLine={false}
                domain={[0, displayMetric.max || 'auto']} />
              <Tooltip content={<CustomTooltip unit={displayMetric.unit} />} />
              <Bar dataKey="avg" fill={displayMetric.color} radius={[6, 6, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {insight && (
        <div className="card border border-accent/20 bg-accent/5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">Insight</p>
              <p className="text-sm text-gray-200 leading-relaxed">{insight}</p>
            </div>
          </div>
        </div>
      )}

      {compound && (
        <div className="card border border-gold/20 bg-gold/5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="text-xs text-gold font-semibold uppercase tracking-wider mb-1">Compound Effect</p>
              <p className="text-sm text-gray-200 leading-relaxed">{compound}</p>
              {projection.length > 0 && (
                <p className="text-[11px] text-gray-500 mt-1">↳ Dotted line = projection at current average</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
