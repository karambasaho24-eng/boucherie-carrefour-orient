// ============================================================
// src/pages/admin/AdminDashboardStats.jsx  (REMPLACEMENT COMPLET)
// Tableau de bord : chiffre d'affaires, commandes, clients,
// produits les plus vendus, état des stocks.
// ============================================================

import { useEffect, useState } from 'react'
import {
  fetchDashboardStats,
  fetchTopProducts,
  fetchRevenueByDay,
  fetchTopCustomers,
} from '../../lib/api'
import { fetchStockDashboard } from '../../lib/stockApi'

function formatEUR(n) {
  return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card${accent ? ' accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function RevenueChart({ data }) {
  const [mode, setMode] = useState('bars')
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return <p className="text-muted" style={{ fontSize: 13 }}>Pas encore de données de paiement sur les 30 derniers jours.</p>
  }

  const width = 760
  const height = 240
  const padLeft = 56
  const padBottom = 26
  const padTop = 14
  const plotW = width - padLeft - 10
  const plotH = height - padTop - padBottom

  const maxRevenue = Math.max(...data.map((d) => Number(d.revenue)), 1)
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

  const barSlot = plotW / data.length
  const barWidth = Math.min(Math.max(barSlot - 8, 4), 40)

  const linePoints = data.map((d, i) => `${xFor(i)},${yFor(Number(d.revenue))}`).join(' ')
  const areaPoints = `${padLeft},${padTop + plotH} ${linePoints} ${padLeft + plotW},${padTop + plotH}`

  const labelStride = Math.ceil(data.length / 8)

  return (
    <div className="revenue-chart-wrap">
      <div className="chart-toggle">
        <button className={`chart-toggle-btn${mode === 'bars' ? ' active' : ''}`} onClick={() => setMode('bars')}>Barres</button>
        <button className={`chart-toggle-btn${mode === 'line' ? ' active' : ''}`} onClick={() => setMode('line')}>Courbe</button>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="revenue-chart" preserveAspectRatio="xMidYMid meet">
        {yLabels.map((val, i) => {
          const y = yFor(val)
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - 10} y2={y} className="grid-line" />
              <text x={padLeft - 8} y={y + 3} textAnchor="end" className="axis-label">
                {val >= 1000 ? `${Math.round(val / 100) / 10}k€` : `${val}€`}
              </text>
            </g>
          )
        })}

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
          <g>
            <line x1={xFor(hovered)} y1={padTop} x2={xFor(hovered)} y2={padTop + plotH} className="hover-line" />
          </g>
        )}
      </svg>

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

export default function AdminDashboardStats() {
  const [stats, setStats] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [revenueByDay, setRevenueByDay] = useState([])
  const [stockDashboard, setStockDashboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll() {
    try {
      const [statsData, products, customers, revenue, stock] = await Promise.all([
        fetchDashboardStats(),
        fetchTopProducts(8),
        fetchTopCustomers(8),
        fetchRevenueByDay(),
        fetchStockDashboard().catch(() => []),
      ])
      setStats(statsData)
      setTopProducts(products)
      setTopCustomers(customers)
      setRevenueByDay(revenue)
      setStockDashboard(stock || [])
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les statistiques.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <p className="text-muted">Chargement des statistiques…</p>
  if (error) return <p className="error-msg">{error}</p>

  const lowStock = stockDashboard.filter((p) => p.alert_triggered)

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Tableau de bord</h2>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Chiffre d'affaires total"
          value={formatEUR(stats?.total_revenue)}
          sub={`${stats?.paid_orders ?? 0} commande${stats?.paid_orders === 1 ? '' : 's'} payée${stats?.paid_orders === 1 ? '' : 's'}`}
          accent
        />
        <StatCard
          label="Aujourd'hui"
          value={formatEUR(stats?.revenue_today)}
          sub={`${stats?.orders_today ?? 0} commande${stats?.orders_today === 1 ? '' : 's'} reçue${stats?.orders_today === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Panier moyen"
          value={formatEUR(stats?.avg_order_value)}
        />
        <StatCard
          label="Clients"
          value={stats?.unique_customers ?? 0}
          sub="numéros distincts"
        />
        <StatCard
          label="Commandes totales"
          value={stats?.total_orders ?? 0}
          sub={`${stats?.pending_orders ?? 0} en attente · ${stats?.confirmed_orders ?? 0} confirmée${stats?.confirmed_orders === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Produits en alerte stock"
          value={lowStock.length}
          sub={lowStock.length > 0 ? lowStock.slice(0, 3).map((p) => p.name).join(', ') : 'Tout va bien'}
        />
      </div>

      <div className="dash-block">
        <h4>Chiffre d'affaires — 30 derniers jours</h4>
        <RevenueChart data={revenueByDay} />
      </div>

      <div className="dash-columns">
        <div className="dash-block">
          <h4>Produits les plus vendus</h4>
          {topProducts.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>Aucune vente pour le moment.</p>
          ) : (
            <table className="dash-table">
              <thead>
                <tr><th>Produit</th><th>Qté vendue</th><th>CA généré</th></tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.product_id || p.product_name}>
                    <td>{p.product_name}</td>
                    <td>{Number(p.total_qty_kg).toFixed(2)} kg</td>
                    <td>{formatEUR(p.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-block">
          <h4>Meilleurs clients</h4>
          {topCustomers.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>Aucun client pour le moment.</p>
          ) : (
            <table className="dash-table">
              <thead>
                <tr><th>Client</th><th>Commandes</th><th>Total dépensé</th></tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.phone}>
                    <td>{c.customer_name}<br /><span className="text-muted mono-sm">{c.phone}</span></td>
                    <td>{c.order_count}</td>
                    <td>{formatEUR(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          margin-bottom: 28px;
        }
        .stat-card { background: var(--color-surface); padding: 18px 20px; }
        .stat-card.accent { background: var(--color-ink); color: var(--color-paper); }
        .stat-label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-muted); margin-bottom: 8px; }
        .stat-card.accent .stat-label { color: rgba(250,249,246,0.55); }
        .stat-value { font-family: var(--font-mono); font-size: 24px; font-weight: 700; line-height: 1.1; }
        .stat-sub { font-size: 11.5px; color: var(--color-text-muted); margin-top: 6px; }
        .stat-card.accent .stat-sub { color: rgba(250,249,246,0.6); }

        .dash-block { background: var(--color-surface); border: 1px solid var(--color-border); padding: 20px; margin-bottom: 20px; }
        .dash-block h4 { margin: 0 0 16px; font-family: var(--font-display); font-weight: 600; font-size: 15px; }

        .dash-columns { display: grid; grid-template-columns: 1fr; gap: 20px; }

        .revenue-chart-wrap { position: relative; }
        .chart-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
        .chart-toggle-btn { padding: 6px 14px; font-size: 11.5px; font-weight: 600; border: 1px solid var(--color-border); background: var(--color-paper-dim); color: var(--color-text-muted); transition: all 0.2s; }
        .chart-toggle-btn:hover { color: var(--color-text); }
        .chart-toggle-btn.active { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
        .revenue-chart { width: 100%; height: 240px; display: block; overflow: visible; }
        .grid-line { stroke: var(--color-border); stroke-width: 1; }
        .axis-label { font-family: var(--font-mono); font-size: 10px; fill: var(--color-text-muted); }
        .axis-label-x { font-family: var(--font-mono); font-size: 9.5px; fill: var(--color-text-muted); }
        .revenue-bar { fill: var(--color-ink); opacity: 0.85; transition: opacity 0.15s; cursor: pointer; }
        .revenue-bar.hovered { opacity: 1; fill: var(--color-red); }
        .revenue-area { fill: var(--color-red); opacity: 0.08; }
        .revenue-line { fill: none; stroke: var(--color-red); stroke-width: 2; }
        .revenue-dot { fill: var(--color-surface); stroke: var(--color-red); stroke-width: 2; cursor: pointer; transition: r 0.15s; }
        .revenue-axis { stroke: var(--color-border); stroke-width: 1; }
        .hover-line { stroke: var(--color-text-muted); stroke-width: 1; stroke-dasharray: 3 3; pointer-events: none; }
        .chart-tooltip {
          position: absolute;
          top: 6px;
          transform: translateX(-50%);
          background: var(--color-ink);
          color: var(--color-paper);
          padding: 8px 12px;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          pointer-events: none;
          white-space: nowrap;
          z-index: 2;
          box-shadow: var(--shadow-lg);
        }
        .chart-tooltip strong { font-family: var(--font-mono); font-size: 13px; }
        .chart-tooltip .text-muted { color: rgba(250,249,246,0.55); font-size: 10.5px; }

        .dash-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .dash-table th { text-align: left; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--color-text-muted); padding: 0 8px 10px 0; border-bottom: 1px solid var(--color-border); }
        .dash-table td { padding: 9px 8px 9px 0; border-bottom: 1px solid var(--color-border); vertical-align: top; }
        .dash-table tr:last-child td { border-bottom: none; }
        .mono-sm { font-family: var(--font-mono); font-size: 11px; }

        @media (min-width: 640px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .dash-columns { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
