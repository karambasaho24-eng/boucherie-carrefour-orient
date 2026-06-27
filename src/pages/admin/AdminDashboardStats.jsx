// ============================================================
// src/pages/admin/AdminDashboardStats.jsx  (NOUVEAU FICHIER)
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
  if (!data || data.length === 0) {
    return <p className="text-muted" style={{ fontSize: 13 }}>Pas encore de données de paiement sur les 30 derniers jours.</p>
  }
  const max = Math.max(...data.map((d) => Number(d.revenue)), 1)
  const width = 700
  const height = 160
  const barGap = 3
  const barWidth = data.length > 0 ? Math.max((width / data.length) - barGap, 4) : 4

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="revenue-chart" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = Math.max((Number(d.revenue) / max) * (height - 24), 2)
        const x = i * (barWidth + barGap)
        const y = height - h - 18
        const dateLabel = new Date(d.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={barWidth} height={h} className="revenue-bar">
              <title>{dateLabel} — {formatEUR(d.revenue)} ({d.orders_count} commande{d.orders_count > 1 ? 's' : ''})</title>
            </rect>
          </g>
        )
      })}
      <line x1="0" y1={height - 18} x2={width} y2={height - 18} className="revenue-axis" />
    </svg>
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

        .revenue-chart { width: 100%; height: 160px; display: block; }
        .revenue-bar { fill: var(--color-ink); }
        .revenue-axis { stroke: var(--color-border); stroke-width: 1; }

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
