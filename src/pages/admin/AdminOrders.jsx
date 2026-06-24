// ============================================================
// src/pages/admin/AdminOrders.jsx  (REMPLACEMENT COMPLET)
// Liste des commandes avec décrément de stock automatique
// lorsqu'une commande passe en statut "confirmed".
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { fetchOrders, updateOrderStatus, deleteOrder } from '../../lib/api'
import { decrementStockForOrder } from '../../lib/stockApi'

const STATUSES = [
  { value: 'pending',   label: 'En attente',      color: '#8a8a86' },
  { value: 'confirmed', label: 'Confirmée',        color: '#0a0a0a' },
  { value: 'preparing', label: 'En préparation',   color: '#0a0a0a' },
  { value: 'ready',     label: 'Prête',            color: '#2f6b3a' },
  { value: 'paid',      label: 'Payée',            color: '#2f6b3a' },
  { value: 'completed', label: 'Terminée',         color: '#6b6b68' },
  { value: 'refused',   label: 'Refusée',          color: '#b5181f' },
  { value: 'cancelled', label: 'Annulée',          color: '#b5181f' },
]

const PAYMENT_LABELS = {
  unpaid: 'Non payé',
  pending: 'Paiement en attente',
  paid: 'Payé',
  failed: 'Échoué',
}

const REFRESH_INTERVAL_MS = 15000

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.4)
  } catch { /* navigateurs qui bloquent l'audio */ }
}

function statusLabel(s) { return STATUSES.find((x) => x.value === s)?.label || s }
function statusColor(s)  { return STATUSES.find((x) => x.value === s)?.color || '#aaa' }

function formatDate(d) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminOrders() {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState(null)
  const [filter, setFilter]           = useState('all')
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const knownIdsRef   = useRef(new Set())
  const isFirstLoadRef = useRef(true)

  async function load() {
    try {
      const data = await fetchOrders()
      if (!isFirstLoadRef.current) {
        const newOnes = data.filter((o) => !knownIdsRef.current.has(o.id))
        if (newOnes.length > 0) {
          playNotificationSound()
          setNewOrderAlert(true)
          setTimeout(() => setNewOrderAlert(false), 4000)
        }
      }
      knownIdsRef.current = new Set(data.map((o) => o.id))
      isFirstLoadRef.current = false
      setOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  /**
   * Changement de statut avec décrément de stock automatique
   * lorsque la commande passe de "pending" → "confirmed".
   */
  async function handleStatusChange(order, newStatus) {
    if (order.payment_status === 'paid' && (newStatus === 'refused' || newStatus === 'cancelled')) {
      if (!confirm('Cette commande est déjà payée. Voulez-vous vraiment changer son statut ?')) return
    }
    try {
      const wasConfirmed = order.status !== 'confirmed' && newStatus === 'confirmed'
      await updateOrderStatus(order.id, newStatus)

      // Décrémenter le stock si la commande vient d'être confirmée
      if (wasConfirmed) {
        try {
          await decrementStockForOrder(order.id)
        } catch (stockErr) {
          // On ne bloque pas le changement de statut si le stock échoue
          console.warn('Stock decrement warning:', stockErr)
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      )
    } catch (e) {
      alert('Erreur lors du changement de statut.')
      console.error(e)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer définitivement cette commande ?')) return
    try {
      await deleteOrder(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      if (expanded === id) setExpanded(null)
    } catch {
      alert('Erreur lors de la suppression.')
    }
  }

  const displayed = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter)

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Commandes</h2>
        {newOrderAlert && <span className="new-order-alert">Nouvelle commande !</span>}
      </div>

      {/* Filtres statut */}
      <div className="filter-bar">
        <button className={`filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          Toutes ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s.value).length
          return (
            <button
              key={s.value}
              className={`filter-btn${filter === s.value ? ' active' : ''}`}
              onClick={() => setFilter(s.value)}
            >
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : displayed.length === 0 ? (
        <p className="text-muted empty-row">Aucune commande.</p>
      ) : (
        <div className="orders-list">
          {displayed.map((order) => (
            <div key={order.id} className="order-card">
              <div
                className="order-card-header"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="order-id">
                  <span className="order-hash">#</span>
                  {order.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="order-meta">
                  <span className="order-client">{order.customer_name}</span>
                  <span className="order-phone text-muted">{order.phone}</span>
                </div>
                <span className="order-date text-muted">{formatDate(order.created_at)}</span>
                <span className="order-total">{parseFloat(order.total_price).toFixed(2)} €</span>
                <span
                  className="order-status-dot"
                  style={{ '--c': statusColor(order.status) }}
                >
                  {statusLabel(order.status)}
                </span>
                <svg
                  className={`chevron ${expanded === order.id ? 'open' : ''}`}
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {expanded === order.id && (
                <div className="order-card-body">
                  {/* Articles */}
                  <div className="order-items">
                    {(order.items ?? []).map((item, i) => (
                      <div key={i} className="order-item-line">
                        <span>{item.name}</span>
                        <span className="text-muted">×{item.qty} kg</span>
                        <span className="mono">{(item.price * item.qty).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>

                  {order.address && (
                    <p className="order-address text-muted">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {order.address}
                    </p>
                  )}

                  <div className="payment-info">
                    <span className={`payment-pill ${order.payment_status === 'paid' ? 'pill-paid' : ''}`}>
                      {PAYMENT_LABELS[order.payment_status] || 'Non payé'}
                    </span>
                    {order.payment_method && (
                      <span className="payment-pill">
                        {order.payment_method === 'card' ? 'Carte' : 'Sur place'}
                      </span>
                    )}
                  </div>

                  {/* Changement de statut */}
                  <div className="order-actions">
                    <div className="status-select-group">
                      <label className="status-select-label">Changer le statut :</label>
                      <div className="status-buttons">
                        {STATUSES.map((s) => (
                          <button
                            key={s.value}
                            className={`status-btn${order.status === s.value ? ' active' : ''}`}
                            style={{ '--c': s.color }}
                            onClick={() => handleStatusChange(order, s.value)}
                            disabled={order.status === s.value}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-delete"
                      onClick={() => handleDelete(order.id)}
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* Note stock */}
                  {order.status === 'pending' && (
                    <p className="stock-notice">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Le stock sera automatiquement décrémenté lors du passage en statut «&nbsp;Confirmée&nbsp;».
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .admin-section { padding: 0 0 40px; }
        .section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .section-header h2 { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 22px; letter-spacing: -0.3px; }
        .new-order-alert { background: var(--color-red); color: #fff; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 5px 12px; animation: pulse 1s ease infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

        .filter-bar { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 20px; }
        .filter-btn { padding: 6px 12px; font-size: 11.5px; font-weight: 600; background: var(--color-paper-dim); border: 1px solid var(--color-border); color: var(--color-text-muted); transition: all 0.2s; font-family: var(--font-mono); }
        .filter-btn:hover, .filter-btn.active { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }

        .orders-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--color-border); }
        .order-card { border-bottom: 1px solid var(--color-border); }
        .order-card:last-child { border-bottom: none; }
        .order-card-header {
          display: grid;
          grid-template-columns: 110px 1fr auto auto auto 20px;
          align-items: center; gap: 12px;
          padding: 14px 16px; cursor: pointer;
          transition: background 0.15s; font-size: 13px;
          min-width: 560px; overflow-x: auto;
        }
        .order-card-header:hover { background: var(--color-paper-dim); }
        .order-id { font-family: var(--font-mono); font-weight: 700; font-size: 12px; letter-spacing: 0.5px; }
        .order-hash { color: var(--color-text-muted); font-weight: 400; }
        .order-meta { display: flex; flex-direction: column; gap: 2px; }
        .order-client { font-weight: 600; font-size: 13px; }
        .order-phone { font-family: var(--font-mono); font-size: 11px; }
        .order-date { font-family: var(--font-mono); font-size: 11px; white-space: nowrap; }
        .order-total { font-family: var(--font-mono); font-weight: 700; white-space: nowrap; }
        .order-status-dot { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--c); white-space: nowrap; }
        .chevron { transition: transform 0.2s; flex-shrink: 0; }
        .chevron.open { transform: rotate(180deg); }

        .order-card-body { padding: 16px; background: var(--color-paper-dim); border-top: 1px solid var(--color-border); }
        .order-items { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .order-item-line { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }
        .mono { font-family: var(--font-mono); font-size: 12px; }
        .order-address { display: flex; align-items: center; gap: 6px; font-size: 12px; margin: 6px 0 14px; }
        .payment-info { display: flex; gap: 6px; margin-bottom: 14px; }
        .payment-pill { font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 4px 10px; background: var(--color-paper); border: 1px solid var(--color-border); color: var(--color-text-muted); }
        .pill-paid { color: #2f6b3a; border-color: rgba(47,107,58,0.3); background: rgba(47,107,58,0.08); }

        .order-actions { display: flex; flex-direction: column; gap: 12px; }
        .status-select-group { display: flex; flex-direction: column; gap: 8px; }
        .status-select-label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-muted); }
        .status-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
        .status-btn { padding: 6px 12px; font-size: 11px; font-weight: 600; border: 1px solid var(--color-border); background: transparent; color: var(--c); transition: all 0.2s; }
        .status-btn:hover:not(:disabled) { background: var(--c); color: #fff; border-color: var(--c); }
        .status-btn.active { background: var(--c); color: #fff; border-color: var(--c); opacity: 0.7; cursor: default; }
        .btn-delete { color: var(--color-red); margin-top: 4px; }

        .stock-notice { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--color-text-muted); background: var(--color-paper); border: 1px solid var(--color-border); padding: 10px 14px; margin-top: 14px; }

        .empty-row { padding: 20px 0; }
      `}</style>
    </div>
  )
}
