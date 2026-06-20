import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { createOrder } from '../lib/api'
import { rememberActiveOrder } from '../components/OrderReminder'
import Receipt from '../components/Receipt'

const STATUS_LABELS = {
  pending: '⏳ En attente',
  confirmed: '✅ Confirmée',
  preparing: '👨‍🍳 En préparation',
  ready: '🎁 Prête',
  completed: '✔️ Terminée',
  cancelled: '❌ Annulée',
}

const CUSTOMER_STORAGE_KEY = 'carrefour_orient_customer'

function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s.\-]/g, '')
  return /^(\+33|0)[1-9](\d{8})$/.test(cleaned)
}

function buildWhatsAppMessage({ orderId, form, items, total }) {
  const lines = [
    `🧾 *Commande #${orderId}*`,
    `👤 ${form.customer_name}`,
    `📞 ${form.phone}`,
    form.address ? `📍 ${form.address}` : null,
    ``,
    ...items.map((i) => `• ${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)} €`),
    ``,
    `💰 *Total : ${total.toFixed(2)} €*`,
  ]
  return lines.filter((l) => l !== null).join('\n')
}

export default function Cart({ config }) {
  const { items, removeItem, updateQty, clearCart, total, count } = useCart()
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const whatsappNumber = (config?.whatsapp_number || '').replace(/\D/g, '')
  const orderMode = config?.order_mode || 'both'
  const showSiteButton = orderMode === 'site' || orderMode === 'both'
  const showWhatsAppButton = (orderMode === 'whatsapp' || orderMode === 'both') && !!whatsappNumber

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setForm((f) => ({ ...f, customer_name: saved.customer_name || '', phone: saved.phone || '', address: saved.address || '' }))
      }
    } catch {
      // Pas grave si la lecture échoue, le client retape simplement ses infos
    }
  }, [])

  function handleField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function rememberCustomer() {
    try {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(form))
    } catch {
      // Stockage non disponible (navigation privée par ex.) — on continue sans bloquer
    }
  }

  function validate() {
    if (!form.customer_name.trim()) return 'Veuillez indiquer votre nom.'
    if (!form.phone.trim()) return 'Veuillez indiquer votre téléphone.'
    if (!isValidPhone(form.phone.trim())) return 'Le numéro de téléphone semble invalide.'
    if (items.length === 0) return 'Votre panier est vide.'
    return null
  }

  async function handleSubmitOrder() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const orderData = {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        total_price: total,
        status: 'pending',
      }

      const created = await createOrder(orderData)
      rememberCustomer()
      rememberActiveOrder(created.id)
      setOrder(created)
      clearCart()
    } catch (err) {
      console.error('Erreur création commande (mode site) :', err)
      setError("Erreur serveur. Votre commande n'a pas pu être enregistrée. Veuillez réessayer dans quelques instants.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitWhatsApp() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }
    if (!whatsappNumber) {
      setError("WhatsApp n'est pas configuré pour le moment. Utilisez la commande classique.")
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    let orderId = Date.now().toString(36).toUpperCase()

    try {
      const orderData = {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        total_price: total,
        status: 'pending',
      }
      const created = await createOrder(orderData)
      orderId = created.id.slice(0, 8).toUpperCase()
      rememberCustomer()
      rememberActiveOrder(created.id)
    } catch (err) {
      console.error('Commande non enregistrée en base (WhatsApp utilisé en secours) :', err)
    }

    const message = buildWhatsAppMessage({ orderId, form, items, total })
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')

    clearCart()
    setSuccess('Commande envoyée sur WhatsApp ! Le panier a été vidé.')
    setLoading(false)
  }

  if (order) {
    return (
      <div className="container cart-page">
        <div className="order-success card">
          <div className="order-success-icon">🎉</div>
          <h2>Commande envoyée !</h2>
          <p>Votre commande <strong>#{order.id.slice(0, 8).toUpperCase()}</strong> a été enregistrée.</p>
          <p className="text-muted">La boucherie va la traiter dans les plus brefs délais.</p>
          <div className="order-meta">
            <p>🏷️ Statut : <span className="badge badge-status">{STATUS_LABELS[order.status]}</span></p>
          </div>

          <div style={{ marginTop: 20 }}>
            <Receipt order={order} shopName={config?.site_title} />
          </div>

          <Link to={`/commande/${order.id}`} className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
            📋 Voir / modifier ma commande
          </Link>
          <Link to="/boutique" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
            Continuer mes achats
          </Link>
        </div>

        <style>{`
          .order-success {
            max-width: 480px;
            margin: 40px auto;
            padding: 32px 24px;
            text-align: center;
          }
          .order-success-icon { font-size: 48px; margin-bottom: 12px; }
          .order-meta { margin-top: 16px; text-align: left; background: var(--color-bg); border-radius: 10px; padding: 12px 16px; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-page-header">
        <div className="container">
          <div className="section-label" style={{ color: 'rgba(170, 176, 182,0.85)' }}>Récapitulatif</div>
          <h1>Mon panier {count > 0 && <span style={{ fontWeight: 400, fontSize: 22, opacity: 0.7 }}>({count} article{count > 1 ? 's' : ''})</span>}</h1>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p style={{ fontSize: 48 }}>🛒</p>
          <p>Votre panier est vide.</p>
          <Link to="/boutique" className="btn btn-primary">Voir la boutique</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item card">
                <div className="cart-item-img">
                  {item.image_url ? <img src={item.image_url} alt={item.name} loading="lazy" /> : <span>🥩</span>}
                </div>
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="text-muted">{item.price.toFixed(2)} € / unité</p>
                </div>
                <div className="cart-item-actions">
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <p className="item-total">{(item.price * item.qty).toFixed(2)} €</p>
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-sidebar">
            <div className="card order-form">
              <h3>Vos coordonnées</h3>

              <div className="field">
                <label>Nom *</label>
                <input className="input" name="customer_name" value={form.customer_name} onChange={handleField} placeholder="Votre nom" />
              </div>
              <div className="field">
                <label>Téléphone *</label>
                <input className="input" name="phone" value={form.phone} onChange={handleField} placeholder="06 XX XX XX XX" type="tel" />
              </div>
              <div className="field">
                <label>Adresse (optionnel)</label>
                <input className="input" name="address" value={form.address} onChange={handleField} placeholder="Pour livraison / retrait" />
              </div>

              {error && <p className="error-msg">⚠️ {error}</p>}
              {success && <p className="success-msg">✅ {success}</p>}

              <div className="total-row">
                <span>Total</span>
                <strong>{total.toFixed(2)} €</strong>
              </div>

              {showSiteButton && (
                <button
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 12 }}
                  onClick={handleSubmitOrder}
                  disabled={loading}
                >
                  {loading ? 'Envoi en cours...' : '✅ Valider la commande'}
                </button>
              )}

              {showWhatsAppButton && (
                <button
                  className="btn btn-whatsapp btn-block"
                  style={{ marginTop: 10 }}
                  onClick={handleSubmitWhatsApp}
                  disabled={loading}
                >
                  💬 Commander via WhatsApp
                </button>
              )}

              {!showSiteButton && !showWhatsAppButton && (
                <p className="error-msg" style={{ marginTop: 12 }}>
                  ⚠️ La commande en ligne est momentanément indisponible. Merci de nous appeler directement.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cart-page { padding: 0 0 60px; }
        .cart-page-header {
          background: linear-gradient(135deg, var(--color-primary-deep, #2e3236), var(--color-primary));
          padding: 40px 0 32px;
          color: #fff;
          margin-bottom: 32px;
        }
        .cart-page h1 {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 900;
          margin: 4px 0 0;
          color: #fff;
        }
        .empty-cart {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .empty-cart > p:first-child { font-size: 56px; margin: 0; }
        .empty-cart > p:last-of-type { font-size: 16px; color: var(--color-text-muted); margin: 0; }
        .cart-layout { display: grid; gap: 24px; padding: 0 20px; max-width: 1200px; margin: 0 auto; }
        .cart-items { display: flex; flex-direction: column; gap: 12px; }
        .cart-item {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: var(--radius);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow);
          transition: box-shadow 0.2s;
        }
        .cart-item:hover { box-shadow: var(--shadow-lg); }
        .cart-item-img {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          overflow: hidden;
          background: var(--color-cream);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item-name { font-weight: 700; margin: 0 0 4px; font-size: 15px; font-family: var(--font-heading); letter-spacing: 0.3px; }
        .cart-item-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .qty-controls { display: flex; align-items: center; gap: 10px; }
        .qty-controls button {
          width: 30px; height: 30px; border-radius: 8px;
          border: 1.5px solid var(--color-border);
          background: var(--color-cream);
          font-size: 16px; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .qty-controls button:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
        .qty-controls span { font-weight: 700; min-width: 24px; text-align: center; font-size: 15px; }
        .item-total { font-weight: 800; font-size: 16px; margin: 0; color: var(--color-primary); font-family: var(--font-heading); }
        .remove-btn {
          background: none; border: none;
          color: var(--color-text-muted); font-size: 14px;
          width: 28px; height: 28px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .remove-btn:hover { background: #fee; color: var(--color-danger); }
        .order-form { padding: 24px; }
        .order-form h3 {
          font-family: var(--font-display);
          font-size: 18px;
          margin: 0 0 20px;
          color: var(--color-primary);
        }
        .total-row {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 2px solid var(--color-border); padding-top: 14px; margin-top: 8px;
          font-size: 20px; font-weight: 800;
          font-family: var(--font-heading);
          color: var(--color-primary);
        }
        .total-row span { font-size: 14px; font-weight: 600; color: var(--color-text-muted); font-family: var(--font-body); }
        .error-msg { color: var(--color-danger); font-size: 13px; margin: 4px 0; background: #fef2f2; padding: 10px 14px; border-radius: 8px; border: 1px solid #fecaca; }
        .success-msg { color: var(--color-success); font-size: 13px; margin: 4px 0; font-weight: 600; background: #f0fdf4; padding: 10px 14px; border-radius: 8px; border: 1px solid #bbf7d0; }
        .btn-whatsapp { background: #25d366; color: #fff; }
        .btn-whatsapp:hover { background: #1ebe57; }
        @media (min-width: 768px) {
          .cart-layout { grid-template-columns: 1fr 380px; padding: 0 32px; }
        }
      `}</style>
    </div>
  )
}
