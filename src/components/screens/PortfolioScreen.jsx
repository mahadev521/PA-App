import { useState } from 'react'
import { Plus, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const CATEGORIES = [
  { id: 'lic',    label: 'LIC',            emoji: '🛡️', color: '#7c3aed' },
  { id: 'nps',    label: 'NPS',            emoji: '🏦', color: '#06b6d4' },
  { id: 'epfo',   label: 'EPFO',           emoji: '💼', color: '#10b981' },
  { id: 'stocks', label: 'Stocks',         emoji: '📈', color: '#f59e0b' },
  { id: 'gold',   label: 'Gold ETF',       emoji: '🥇', color: '#eab308' },
  { id: 'rd',     label: 'RD',             emoji: '💵', color: '#0ea5e9' },
  { id: 'mf',     label: 'Mutual Funds',   emoji: '📊', color: '#ec4899' },
  { id: 'other',  label: 'Other',          emoji: '📦', color: '#94a3b8' },
]

function catInfo(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const emptyForm = { category: 'stocks', name: '', currentValue: '', investedAmount: '', notes: '' }

export default function PortfolioScreen({ investments, onSaveInvestment, onDeleteInvestment }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const items = investments || []
  const totalCurrent  = items.reduce((s, i) => s + (Number(i.currentValue) || 0), 0)
  const totalInvested = items.reduce((s, i) => s + (Number(i.investedAmount) || 0), 0)
  const hasInvested   = items.some(i => i.investedAmount != null && i.investedAmount !== '')
  const gain          = totalCurrent - totalInvested
  const gainPct       = totalInvested > 0 ? (gain / totalInvested) * 100 : 0

  const chartData = CATEGORIES
    .map(c => ({ ...c, value: items.filter(i => i.category === c.id).reduce((s, i) => s + (Number(i.currentValue) || 0), 0) }))
    .filter(c => c.value > 0)

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({
      category: item.category,
      name: item.name,
      currentValue: item.currentValue ?? '',
      investedAmount: item.investedAmount ?? '',
      notes: item.notes || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim() || form.currentValue === '') return
    await onSaveInvestment({
      id: editingId || undefined,
      category: form.category,
      name: form.name.trim(),
      currentValue: Number(form.currentValue),
      investedAmount: form.investedAmount === '' ? null : Number(form.investedAmount),
      notes: form.notes.trim(),
    })
    setShowForm(false)
    setForm(emptyForm)
    setEditingId(null)
  }

  return (
    <div className="bg-base">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{
          paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))',
          background: 'rgba(9,11,26,0.95)',
          backdropFilter: 'blur(12px)',
        }}>
        <h1 className="text-2xl font-black text-white">Portfolio</h1>
        <p className="text-xs text-gray-500 mt-0.5">All your investments, one view</p>
      </div>

      <div className="px-4 pb-8 pt-2 space-y-4">
        {/* Summary */}
        <div className="card space-y-1">
          <p className="section-title">Total Value</p>
          <p className="metric-value">{fmt(totalCurrent)}</p>
          {hasInvested && (
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: gain >= 0 ? '#10b981' : '#f43f5e' }}>
              {gain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {fmt(Math.abs(gain))} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%) vs {fmt(totalInvested)} invested
            </div>
          )}
        </div>

        {/* Allocation chart */}
        {chartData.length > 0 && (
          <div className="card">
            <p className="section-title">Allocation</p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {chartData.map(c => <Cell key={c.id} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#111530', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {chartData.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{c.emoji} {c.label}</span>
                  <span className="font-semibold text-white">{((c.value / totalCurrent) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add button */}
        <button onClick={openAdd} className="btn-primary w-full flex items-center justify-center gap-2">
          <Plus size={18} /> Add Holding
        </button>

        {/* Add/edit form */}
        {showForm && (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0">{editingId ? 'Edit Holding' : 'New Holding'}</p>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}>
                <X size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: form.category === c.id ? `${c.color}33` : 'rgba(255,255,255,0.05)',
                    color:      form.category === c.id ? c.color : 'rgba(255,255,255,0.5)',
                    border:     form.category === c.id ? `1px solid ${c.color}55` : '1px solid transparent',
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name (e.g. HDFC Life LIC policy, Nifty 50 Index Fund)"
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            <div className="flex gap-2">
              <input
                type="number"
                value={form.currentValue}
                onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))}
                placeholder="Current value (₹)"
                className="flex-1 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <input
                type="number"
                value={form.investedAmount}
                onChange={e => setForm(f => ({ ...f, investedAmount: e.target.value }))}
                placeholder="Invested (optional)"
                className="flex-1 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            <button onClick={handleSave} className="btn-primary w-full">
              {editingId ? 'Save Changes' : 'Add Holding'}
            </button>
          </div>
        )}

        {/* Holdings by category */}
        {items.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-600 text-sm">No holdings yet — add one above ↑</div>
        )}

        {CATEGORIES.map(c => {
          const catItems = items.filter(i => i.category === c.id)
          if (catItems.length === 0) return null
          const catTotal = catItems.reduce((s, i) => s + (Number(i.currentValue) || 0), 0)
          return (
            <div key={c.id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.color }}>
                  {c.emoji} {c.label}
                </p>
                <p className="text-xs font-semibold text-white">{fmt(catTotal)}</p>
              </div>
              {catItems.map(item => {
                const itemGain = item.investedAmount != null ? Number(item.currentValue) - Number(item.investedAmount) : null
                return (
                  <div key={item.id} onClick={() => openEdit(item)}
                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">{item.name}</p>
                      {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white">{fmt(item.currentValue)}</p>
                      {itemGain != null && (
                        <p className="text-[11px]" style={{ color: itemGain >= 0 ? '#10b981' : '#f43f5e' }}>
                          {itemGain >= 0 ? '+' : ''}{fmt(itemGain)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteInvestment(item.id) }}
                      className="flex-shrink-0"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
