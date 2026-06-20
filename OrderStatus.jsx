import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchOrderById, updateOrderItems, cancelOwnOrder, fetchSiteConfig } from '../lib/api'
import { clearActiveOrder } from '../components/OrderReminder'
import Receipt from '../components/Receipt'

const STATUS_LABELS = {
  pending: '⏳ En attente',
  confirmed: '✅ Confirmée',
  preparing: '👨‍🍳 En préparation',
  ready: '🎁 Prête',
  completed: '✔️ Terminée',
  cancelled: '❌ Annulée',
}

const STATUS_DESCRIPTIONS = {
  pending: 'Votre commande a été reçue. La boucherie va bientôt la traiter — vous pouvez encore la modifier ou l\'annuler.',
  confirmed: 'Votre commande a été confirmée par la boucherie et est en cours de traitement.',
  preparing: 'La boucherie prépare actuellement votre commande.',
  ready: 'Votre commande est prête à être récupérée !',
  completed: 'Cette commande a été terminée. Merci de votre confiance !',
  cancelled: 'Cette commande a été annulée.',
}

export default function OrderStatus() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editItems, setEditItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [shopName, setShopName] = useState('Boucherie')

  useEffect(() => {
    fetchSiteConfig()
      .then((cfg) => setShopName(cfg?.site_title || 'Boucherie'))
      .catch(() => {})
  }, [])

  async function load() {
    try {
      const data = await fetchOrderById(id)
      setOrder(data)
      setEditItems(data.items || [])
      if (data.status === 'completed' || data.status === 'cancelled') {
        clearActiveOrder()
      }
    } catch (err) {
      console.error(err)
      setError("Cette commande n'existe pas ou n'est plus accessible.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  function startEditing() {
    setEditItems(order.items.map((i) => ({ ...i })))
    setEditing(true)
    setActionError('')
  }

  function updateQty(itemId, qty) {
    setEditItems((prev) =>
      prev
        .map((i) => (i.id === itemId ? { ...i, qty } : i))
        .filter((i) => i.qty > 0)
    )
  }

  const editTotal = editItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  async function saveEdits() {
    if (editItems.length === 0) {
      setActionError('Votre commande ne peut pas être vide. Annulez-la plutôt si vous ne voulez plus rien.')
      return
    }
    setSaving(true)
    setActionError('')
    try {
      const updated = await updateOrderItems(order.id, { items: editItems, total_price: editTotal })
      setOrder(updated)
      setEditing(false)
    } catch (err) {
      console.error(err)
      setActionError("Impossible de modifier la commande — elle est peut-être déjà en cours de préparation.")
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Voulez-vous vraiment annuler cette commande ?')) return
    setSaving(true)
    setActionError('')
    try {
      const updated = await cancelOwnOrder(order.id)
      setOrder(updated)
    } catch (err) {
      console.error(err)
      setActionError("Impossible d'annuler — la commande est peut-être déjà en cours de préparation.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>Chargement...</div>
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 40 }}>🔍</p>
        <p>{error}</p>
        <Link to="/boutique" className="btn btn-primary" style={{ marginTop: 12 }}>Voir la boutique</Link>
      </div>
    )
  }

  const canModify = order.status === 'pending'

  return (
    <div className="order-status-page">
      <div className="order-status-header">
        <div className="container">
          <div className="section-label" style={{ color: 'rgba(170,176,182,0.85)' }}>Suivi de commande</div>
          <h1>Commande #{order.id.slice(0, 8).toUpperCase()}</h1>
        </div>
      </div>

      <div className="container order-status-body">
        <div className="card status-card">
          <span className="badge badge-status status-badge-large">{STATUS_LABELS[order.status]}</span>
          <p className="text-muted" style={{ marginTop: 10 }}>{STATUS_DESCRIPTIONS[order.status]}</p>
        </div>

        <div className="card">
          <h3>Détail de la commande</h3>

          {editing ? (
            <>
              {editItems.map((item) => (
                <div key={item.id} className="edit-item-row">
                  <span className="edit-item-name">{item.name}</span>
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <span className="edit-item-total">{(item.price * item.qty).toFixed(2)} €</span>
                </div>
              ))}
              <div className="total-row">
                <span>Nouveau total</span>
                <strong>{editTotal.toFixed(2)} €</strong>
              </div>
              {actionError && <p className="error-msg">⚠️ {actionError}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>Annuler les modifs</button>
                <button className="btn btn-primary" onClick={saveEdits} disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Valider les modifications'}
                </button>
              </div>
            </>
          ) : (
            <>
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row">
                  <span>{item.name} <span className="text-muted">x{item.qty}</span></span>
                  <span>{(item.price * item.qty).toFixed(2)} €</span>
                </div>
              ))}
              <div className="total-row">
                <span>Total</span>
                <strong>{order.total_price.toFixed(2)} €</strong>
              </div>

              {actionError && <p className="error-msg">⚠️ {actionError}</p>}

              {canModify && (
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button className="btn btn-outline btn-block" onClick={startEditing} disabled={saving}>
                    ✏️ Modifier ma commande
                  </button>
                  <button className="btn btn-danger btn-block" onClick={handleCancel} disabled={saving}>
                    {saving ? '...' : '✕ Annuler'}
                  </button>
                </div>
              )}
              {!canModify && order.status !== 'cancelled' && (
                <p className="text-muted" style={{ marginTop: 14, fontSize: 13 }}>
                  La boucherie a commencé à traiter votre commande, elle ne peut plus être modifiée en ligne. Pour toute question, contactez directement la boucherie.
                </p>
              )}
            </>
          )}
        </div>

        <div className="card" style={{ fontSize: 13 }}>
          <p style={{ margin: 0 }}><strong>Client :</strong> {order.customer_name}</p>
          <p style={{ margin: '4px 0 0' }}><strong>Téléphone :</strong> {order.phone}</p>
          {order.address && <p style={{ margin: '4px 0 0' }}><strong>Adresse :</strong> {order.address}</p>}
        </div>

        <div className="card">
          <h3>Mon ticket</h3>
          <Receipt order={order} shopName={shopName} />
        </div>

        <Link to="/boutique" className="btn btn-ghost btn-block" style={{ marginTop: 16 }}>
          Continuer mes achats
        </Link>
      </div>

      <style>{`
        .order-status-page { padding-bottom: 60px; }
        .order-status-header {
          background: linear-gradient(135deg, var(--color-primary-deep), var(--color-primary));
          padding: 36px 0 28px;
          color: #fff;
          margin-bottom: 24px;
        }
        .order-status-header h1 {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 900;
          margin: 4px 0 0;
          color: #fff;
        }
        .order-status-body {
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .status-card { padding: 20px 24px; text-align: center; }
        .status-badge-large { font-size: 14px; padding: 8px 18px; }
        .order-status-body .card { padding: 20px 24px; }
        .order-status-body h3 {
          font-family: var(--font-display);
          font-size: 17px;
          margin: 0 0 14px;
          color: var(--color-primary);
        }
        .order-item-row, .edit-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-border);
          font-size: 14px;
        }
        .edit-item-row { gap: 10px; }
        .edit-item-name { flex: 1; }
        .edit-item-total { min-width: 56px; text-align: right; font-weight: 700; }
        .qty-controls { display: flex; align-items: center; gap: 8px; }
        .qty-controls button {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1.5px solid var(--color-border);
          background: var(--color-cream);
          font-size: 14px;
        }
        .qty-controls button:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
        .total-row {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 2px solid var(--color-border); padding-top: 12px; margin-top: 8px;
          font-size: 17px; font-weight: 800;
          font-family: var(--font-heading);
          color: var(--color-primary);
        }
        .total-row span { font-size: 13px; font-weight: 600; color: var(--color-text-muted); font-family: var(--font-body); }
        .error-msg { color: var(--color-danger); font-size: 13px; margin: 10px 0 0; background: #fef2f2; padding: 8px 12px; border-radius: 8px; border: 1px solid #fecaca; }
      `}</style>
    </div>
  )
}
