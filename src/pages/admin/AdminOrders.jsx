import { useEffect, useRef, useState } from 'react'
import { fetchOrders, updateOrderStatus } from '../../lib/api'

const STATUSES = [
  { value: 'pending', label: '⏳ En attente', color: '#f39c12' },
  { value: 'confirmed', label: '✅ Confirmée', color: '#2980b9' },
  { value: 'preparing', label: '👨‍🍳 En préparation', color: '#8e44ad' },
  { value: 'ready', label: '🎁 Prête', color: '#27ae60' },
  { value: 'completed', label: '✔️ Terminée', color: '#7f8c8d' },
  { value: 'cancelled', label: '❌ Annulée', color: '#c0392b' },
]

const REFRESH_INTERVAL_MS = 15000

// Son court joué via l'API Web Audio — pas de fichier externe à charger
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
  } catch {
    // Certains navigateurs bloquent l'audio sans interaction préalable — on ignore silencieusement
  }
}

function statusLabel(s) {
  return STATUSES.find((x) => x.value === s)?.label || s
}

function statusColor(s) {
  return STATUSES.find((x) => x.value === s)?.color || '#aaa'
}

function formatDate(d) {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const knownIdsRef = useRef(new Set())
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

  async function handleStatus(id, status) {
    try {
      const updated = await updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
    } catch (e) {
      alert('Erreur mise à jour statut.')
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Commandes ({orders.length})</h2>
        <select className="select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Toutes</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {newOrderAlert && (
        <div className="new-order-alert">🔔 Nouvelle commande reçue !</div>
      )}

      {loading ? (
        <p className="text-muted">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">Aucune commande.</p>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => (
            <div key={order.id} className="order-card card">
              <div className="order-head" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div>
                  <span className="order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="order-client">{order.customer_name}</span>
                </div>
                <div className="order-head-right">
                  <span className="order-total">{Number(order.total_price).toFixed(2)} €</span>
                  <span className="order-status-dot" style={{ background: statusColor(order.status) }}>
                    {statusLabel(order.status)}
                  </span>
                  <span className="text-muted">{expanded === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === order.id && (
                <div className="order-body">
                  <div className="order-meta-row">
                    <span>📞 {order.phone}</span>
                    {order.address && <span>📍 {order.address}</span>}
                    <span className="text-muted">🕒 {formatDate(order.created_at)}</span>
                  </div>

                  <div className="order-items-list">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="order-item-row">
                        <span>{item.name}</span>
                        <span className="text-muted">x{item.qty}</span>
                        <span>{(item.price * item.qty).toFixed(2)} €</span>
                      </div>
                    ))}
                    <div className="order-item-row total">
                      <strong>Total</strong><span /><strong>{Number(order.total_price).toFixed(2)} €</strong>
                    </div>
                  </div>

                  <div className="status-actions">
                    <span className="text-muted" style={{ fontSize: 12 }}>Changer le statut :</span>
                    <div className="status-btns">
                      {STATUSES.map((s) => (
                        <button
                          key={s.value}
                          className={`btn btn-sm ${order.status === s.value ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => handleStatus(order.id, s.value)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-header h2 { margin: 0; }
        .new-order-alert {
          background: var(--color-accent);
          color: #1a1a1a;
          font-weight: 700;
          padding: 10px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
          animation: pulse-alert 1s ease-in-out infinite;
        }
        @keyframes pulse-alert {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .orders-list { display: flex; flex-direction: column; gap: 12px; }
        .order-card { overflow: hidden; }
        .order-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; cursor: pointer; gap: 12px; flex-wrap: wrap;
        }
        .order-id { font-family: monospace; font-weight: 700; font-size: 13px; margin-right: 10px; }
        .order-client { font-weight: 600; }
        .order-head-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .order-total { font-weight: 700; color: var(--color-primary); }
        .order-status-dot {
          font-size: 12px; font-weight: 700;
          color: #fff; padding: 4px 10px; border-radius: 999px;
        }
        .order-body { padding: 0 16px 16px; border-top: 1px solid var(--color-border); }
        .order-meta-row { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px 0; font-size: 13px; }
        .order-items-list { background: var(--color-bg); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .order-item-row { display: grid; grid-template-columns: 1fr 40px 80px; gap: 8px; padding: 4px 0; font-size: 13px; }
        .order-item-row.total { border-top: 1px solid var(--color-border); margin-top: 6px; padding-top: 8px; }
        .status-actions { display: flex; flex-direction: column; gap: 8px; }
        .status-btns { display: flex; flex-wrap: wrap; gap: 6px; }
      `}</style>
    </div>
  )
}
