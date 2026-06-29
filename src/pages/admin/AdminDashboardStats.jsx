// ============================================================
// src/pages/admin/AdminDashboardStats.jsx  (REMPLACEMENT COMPLET)
// Tableau de bord professionnel :
// - Filtres de période (7j / 30j / 3 mois / personnalisé)
// - Comparaison avec la période précédente équivalente
// - Graphique CA + nombre de commandes combinés, barres/courbe
// - Répartition du CA par catégorie de produit
// - Activité par jour de la semaine et par heure
// - Export CSV des données affichées
// - Enregistrement de performances (snapshots figés)
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  fetchDashboardStats,
  fetchTopProducts,
  fetchRevenueByDay,
  fetchTopCustomers,
  fetchRevenueByCategory,
  fetchOrdersByWeekday,
  fetchOrdersByHour,
  saveSnapshot,
} from '../../lib/api'
import { fetchStockDashboard } from '../../lib/stockApi'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const PERIODS = [
  { id: '7d',  label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: '3m',  label: '3 mois' },
  { id: 'custom', label: 'Personnalisé' },
]

function formatEUR(n) {
  return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

function computeRange(periodId, customStart, customEnd) {
  const today = new Date()
  const end = new Date(today)
  let start = new Date(today)

  if (periodId === '7d') start.setDate(start.getDate() - 6)
  else if (periodId === '30d') start.setDate(start.getDate() - 29)
  else if (periodId === '3m') start.setMonth(start.getMonth() - 3)
  else if (periodId === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd, prevStart: null, prevEnd: null }
  }

  const startISO = toISODate(start)
  const endISO = toISODate(end)

  const spanDays = Math.round((end - start) / 86400000) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - spanDays + 1)

  return { start: startISO, end: endISO, prevStart: toISODate(prevStart), prevEnd: toISODate(prevEnd) }
}

function StatCard({ label, value, sub, trend, accent }) {
  const isUp = trend && trend.value >= 0
  return (
    <div className={`stat-card${accent ? ' accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        {sub && <span className="stat-sub">{sub}</span>}
        {trend && (
          <span className={`stat-trend ${isUp ? 'up' : 'down'}`}>
            {isUp ? '▲' : '▼'}{' '}
            {trend.kind === 'pct'
              ? `${Math.abs(trend.value).toFixed(0)}%`
              : `${Math.abs(trend.value)}`}
          </span>
        )}
      </div>
    </div>
  )
}

function RevenueChart({ data }) {
  const [mode, setMode] = useState('bars')
  const [showOrders, setShowOrders] = useState(true)
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return <p className="text-muted" style={{ fontSize: 13 }}>Pas encore de données sur cette période.</p>
  }

  const width = 760
  const height = 260
  const padLeft = 56
  const padBottom = 26
  const padTop = 14
  const plotW = width - padLeft - 10
  const plotH = height - padTop - padBottom

  const maxRevenue = Math.max(...data.map((d) => Number(d.revenue)), 1)
  const maxOrders = Math.max(...data.map((d) => Number(d.orders_count)), 1)

  const niceMax = (() => {
    const raw = maxRevenue * 1.15
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw || 1)))
    const steps = [1, 2, 2.5, 5, 10]
    for (const s of steps) {
      if (raw <= s * magnitude) return s * magnitude
    }
    return 10 * magnitude
  })()
  const ySteps = 4
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((niceMax / ySteps) * i))

  function xFor(i) {
    if (data.length === 1) return padLeft + plotW / 2
    return padLeft + (i / (data.length - 1)) * plotW
  }
  function yFor(value) {
    return padTop + plotH - (value / niceMax) * plotH
  }
  function yForOrders(value) {
    return padTop + plotH - (value / maxOrders) * plotH
  }

  const barSlot = plotW / data.length
  const barWidth = Math.min(Math.max(barSlot - 8, 3), 36)

  const linePoints = data.map((d, i) => `${xFor(i)},${yFor(Number(d.revenue))}`).join(' ')
  const areaPoints = `${padLeft},${padTop + plotH} ${linePoints} ${padLeft + plotW},${padTop + plotH}`
  const orderLinePoints = data.map((d, i) => `${xFor(i)},${yForOrders(Number(d.orders_count))}`).join(' ')

  const labelStride = Math.ceil(data.length / 8)

  return (
    <div className="revenue-chart-wrap">
      <div className="chart-controls">
        <div className="chart-toggle">
          <button className={`chart-toggle-btn${mode === 'bars' ? ' active' : ''}`} onClick={() => setMode('bars')}>Barres</button>
          <button className={`chart-toggle-btn${mode === 'line' ? ' active' : ''}`} onClick={() => setMode('line')}>Courbe</button>
        </div>
        <label className="chart-checkbox">
          <input type="checkbox" checked={showOrders} onChange={(e) => setShowOrders(e.target.checked)} />
          Afficher le nombre de commandes
        </label>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="revenue-chart" preserveAspectRatio="xMidYMid meet">
        {yLabels.map((val, i) => (
          <line key={`gl-${i}`} x1={padLeft} y1={yFor(val)} x2={width - 10} y2={yFor(val)} className="grid-line" />
        ))}

        {mode === 'bars' ? (
          data.map((d, i) => {
            const x = xFor(i) - barWidth / 2
            const y = yFor(Number(d.revenue))
            const h = padTop + plotH - y
            return (
              <rect
                key={d.day}
                x={x} y={y} width={barWidth} height={Math.max(h, 1.5)}
                className={`revenue-bar${hovered === i ? ' hovered' : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })
        ) : (
          <>
            <polygon points={areaPoints} className="revenue-area" />
            <polyline points={linePoints} className="revenue-line" />
            {data.map((d, i) => (
              <circle
                key={d.day}
                cx={xFor(i)} cy={yFor(Number(d.revenue))} r={hovered === i ? 5 : 3}
                className="revenue-dot"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </>
        )}

        {showOrders && (
          <polyline points={orderLinePoints} className="orders-line" />
        )}

        {data.map((d, i) => (
          <rect
            key={`hit-${d.day}`}
            x={xFor(i) - barSlot / 2} y={padTop} width={barSlot} height={plotH}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        <line x1={padLeft} y1={padTop + plotH} x2={width - 10} y2={padTop + plotH} className="revenue-axis" />
        {data.map((d, i) => {
          if (i % labelStride !== 0 && i !== data.length - 1) return null
          const dateLabel = new Date(d.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          return (
            <text key={d.day} x={xFor(i)} y={height - 6} textAnchor="middle" className="axis-label-x">
              {dateLabel}
            </text>
          )
        })}

        {hovered !== null && (
          <line x1={xFor(hovered)} y1={padTop} x2={xFor(hovered)} y2={padTop + plotH} className="hover-line" />
        )}

        {yLabels.map((val, i) => (
          <g key={`yl-${i}`}>
            <rect x={0} y={yFor(val) - 9} width={padLeft - 6} height={16} className="axis-label-bg" />
            <text x={padLeft - 10} y={yFor(val) + 3} textAnchor="end" className="axis-label">
              {val >= 1000 ? `${Math.round(val / 100) / 10}k€` : `${val}€`}
            </text>
          </g>
        ))}
      </svg>

      <div className="chart-legend">
        <span className="legend-item"><span className="legend-dot legend-dot-revenue" /> Chiffre d'affaires</span>
        {showOrders && <span className="legend-item"><span className="legend-dot legend-dot-orders" /> Nombre de commandes</span>}
      </div>

      {hovered !== null && (
        <div className="chart-tooltip" style={{ left: `${(xFor(hovered) / width) * 100}%` }}>
          <strong>{formatEUR(data[hovered].revenue)}</strong>
          <span>{new Date(data[hovered].day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}</span>
          <span className="text-muted">{data[hovered].orders_count} commande{data[hovered].orders_count > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

function CategoryBars({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-muted" style={{ fontSize: 13 }}>Aucune vente sur cette période.</p>
  }
  const total = data.reduce((s, c) => s + Number(c.total_revenue), 0) || 1
  const max = Math.max(...data.map((c) => Number(c.total_revenue)), 1)

  return (
    <div className="category-bars">
      {data.map((c) => {
        const pct = (Number(c.total_revenue) / total) * 100
        const barPct = (Number(c.total_revenue) / max) * 100
        return (
          <div key={c.category} className="category-row">
            <div className="category-row-head">
              <span className="category-name">{c.category}</span>
              <span className="category-value">{formatEUR(c.total_revenue)} · {pct.toFixed(0)}%</span>
            </div>
            <div className="category-track">
              <div className="category-fill" style={{ width: `${barPct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
