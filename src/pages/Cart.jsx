import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { createOrder } from '../lib/api'
import { rememberActiveOrder } from '../components/OrderReminder'
import Receipt from '../components/Receipt'

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const CUSTOMER_STORAGE_KEY = 'carrefour_orient_customer'

// Validation simple d'un numéro de téléphone français (mobile ou fixe)
function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s.\-]/g, '')
  return /^(\+33|0)[1-9](\d{8})$/.test(cleaned)
}

function buildWhatsAppMessage({ orderId, form, items, total }) {
  const lines = [
    `Commande #${orderId}`,
    `${form.customer_name}`,
    `Tél. ${form.phone}`,
    form.address ? `Adresse : ${form.address}` : null,
    ``,
    ...items.map((i) => `- ${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)} €`),
    ``,
    `Total : ${total.toFixed(2)} €`,
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
  // Mode défini par l'admin : 'site' | 'whatsapp' | 'both'. Par défaut 'both' si non configuré.
  const orderMode = config?.order_mode || 'both'
  const showSiteButton = orderMode === 'site' || orderMode === 'both'
  const showWhatsAppButton = (orderMode === 'whatsapp' || orderMode === 'both') && !!whatsappNumber

  // Pré-remplir nom/téléphone si le client est déjà venu sur cet appareil
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

  // Validation centralisée — retourne un message d'erreur clair ou null si OK
  function validate() {
    if (!form.customer_name.trim()) return 'Veuillez indiquer votre nom.'
    if (!form.phone.trim()) return 'Veuillez indiquer votre téléphone.'
    if (!isValidPhone(form.phone.trim())) return 'Le numéro de téléphone semble invalide.'
    if (items.length === 0) return 'Votre panier est vide.'
    return null
  }

  // OPTION 1 — Commande classique enregistrée dans Supabase, sans WhatsApp
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

  // OPTION 2 — Commande via WhatsApp : enregistre aussi dans Supabase si possible,
  // mais ouvre WhatsApp dans tous les cas (jamais bloquant).
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
      // On ne bloque jamais WhatsApp si l'enregistrement échoue
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
        <div className="order-success">
          <div className="order-success-mark" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12.5l2.6 2.6L16 9.5" />
            </svg>
          </div>
          <h2>Commande envoyée</h2>
          <p>Votre commande <strong>#{order.id.slice(0, 8).toUpperCase()}</strong> a été enregistrée.</p>
          <p className="text-muted">La boucherie va la traiter dans les plus brefs délais.</p>
          <div className="order-meta">
            <span>Statut</span>
            <span className="badge badge-status">{STATUS_LABELS[order.status]}</span>
          </div>

          <div className="order-receipt-wrap">
            <Receipt order={order} shopName={config?.site_title} />
          </div>

          <Link to={`/commande/${order.id}`} className="btn btn-ghost btn-block" style={{ marginTop: 14 }}>
            Voir / modifier ma commande
          </Link>
          <Link to="/boutique" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
            Continuer mes achats
          </Link>
        </div>

        <style>{`
          .order-success {
            max-width: 460px;
            margin: 64px auto;
            padding: 0;
            text-align: center;
          }
          .order-success-mark { color: var(--color-ink); margin-bottom: 20px; }
          .order-success h2 { font-family: var(--font-display); font-weight: 600; font-size: 26px; margin: 0 0 12px; }
          .order-receipt-wrap { margin-top: 28px; }
          .order-meta {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--color-border);
            border-bottom: 1px solid var(--color-border);
            padding: 16px 0;
            font-family: var(--font-mono);
            font-size: 11px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: var(--color-text-muted);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-page-header">
        <div className="container">
          <div className="section-label section-label-light">Récapitulatif</div>
          <h1>Mon panier {count > 0 && <span className="cart-count-sub">({count} article{count > 1 ? 's' : ''})</span>}</h1>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Votre panier est vide.</p>
          <Link to="/boutique" className="btn btn-primary">Voir la boutique</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  {item.image_url ? <img src={item.image_url} alt={item.name} loading="lazy" /> : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M4 4h16v16H4z" /><path d="M4 14l5-5 4 4 7-7" />
                    </svg>
                  )}
                </div>
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="text-muted">{item.price.toFixed(2)} € / unité</p>
                </div>
                <div className="cart-item-actions">
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} aria-label="Diminuer">−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} aria-label="Augmenter">+</button>
                  </div>
                  <p className="item-total">{(item.price * item.qty).toFixed(2)} €</p>
                  <button className="remove-btn" onClick={() => removeItem(item.id)} aria-label="Retirer">✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-sidebar">
            <div className="order-form">
              <h3>Vos coordonnées</h3>

              <div className="field">
                <label>Nom *</label>
                <input className="input" name="customer_name" value={form.customer_name} onChange={handleField} placeholder="Votre nom" />
              </div>
              <div className="field">
                <label>Téléphone *</label>
                <input className="input" name="phone" value={form.phone} onChange={handleField} placeholder="06 XX XX XX XX" type="tel" />
              </div>

              <div className="pickup-notice">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z" />
                </svg>
                <span>Retrait directement à la boutique — {config?.address || '55 Place des Sablons, 72100 Le Mans'}</span>
              </div>

              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}

              <div className="total-row">
                <span>Total</span>
                <strong>{total.toFixed(2)} €</strong>
              </div>

              {showSiteButton && (
                <button
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 16 }}
                  onClick={handleSubmitOrder}
                  disabled={loading}
                >
                  {loading ? 'Envoi en cours…' : 'Valider la commande'}
                </button>
              )}

              {showWhatsAppButton && (
                <button
                  className="btn btn-whatsapp btn-block"
                  style={{ marginTop: 10 }}
                  onClick={handleSubmitWhatsApp}
                  disabled={loading}
                >
                  Commander via WhatsApp
                </button>
              )}

              {!showSiteButton && !showWhatsAppButton && (
                <p className="error-msg" style={{ marginTop: 12 }}>
                  La commande en ligne est momentanément indisponible. Merci de nous appeler directement.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cart-page { padding: 0 0 70px; }
        .cart-page-header {
          background: var(--color-ink);
          padding: 56px 0 40px;
          color: var(--color-paper);
          margin-bottom: 40px;
        }
        .cart-page h1 {
          font-family: var(--font-heading);
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 6px 0 0;
          color: var(--color-paper);
        }
        .cart-count-sub { font-weight: 400; font-size: 18px; opacity: 0.55; }
        .empty-cart {
          text-align: center;
          padding: 80px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          color: var(--color-text-muted);
        }
        .empty-cart > p { font-size: 15px; color: var(--color-text-muted); margin: 0; }
        .cart-layout { display: grid; gap: 28px; padding: 0 20px; max-width: 1200px; margin: 0 auto; }
        .cart-items { display: flex; flex-direction: column; gap: 0; border-top: 1px solid var(--color-border); }
        .cart-item {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .cart-item-img {
          width: 72px;
          height: 72px;
          overflow: hidden;
          background: var(--color-paper-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-border-dark);
          flex-shrink: 0;
        }
        .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item-name { font-weight: 700; margin: 0 0 4px; font-size: 15px; font-family: var(--font-heading); letter-spacing: -0.1px; }
        .cart-item-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .qty-controls { display: flex; align-items: center; gap: 0; border: 1px solid var(--color-border); }
        .qty-controls button {
          width: 28px; height: 28px;
          border: none;
          background: transparent;
          font-size: 15px; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .qty-controls button:hover { background: var(--color-paper-dim); }
        .qty-controls span { font-weight: 600; min-width: 26px; text-align: center; font-size: 13px; font-family: var(--font-mono); }
        .item-total { font-weight: 700; font-size: 15px; margin: 0; color: var(--color-text); font-family: var(--font-mono); }
        .remove-btn {
          background: none; border: none;
          color: var(--color-text-muted); font-size: 13px;
          width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.15s;
        }
        .remove-btn:hover { color: var(--color-red); }
        .order-form { padding: 0; }
        .order-form h3 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 19px;
          margin: 0 0 24px;
          color: var(--color-text);
        }
        .pickup-notice {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          background: var(--color-paper-dim);
          border: 1px solid var(--color-border);
          padding: 12px 14px;
          margin: 4px 0 16px;
          font-size: 12.5px;
          color: var(--color-text-muted);
          line-height: 1.5;
        }
        .pickup-notice svg { flex-shrink: 0; margin-top: 1px; color: var(--color-text); }
        .total-row {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 1px solid var(--color-border); padding-top: 16px; margin-top: 8px;
          font-size: 22px; font-weight: 700;
          font-family: var(--font-mono);
          color: var(--color-text);
        }
        .total-row span { font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--color-text-muted); font-family: var(--font-mono); }
        .error-msg { color: var(--color-red); font-size: 13px; margin: 4px 0; background: rgba(181,24,31,0.06); padding: 12px 14px; border: 1px solid rgba(181,24,31,0.25); }
        .success-msg { color: #2f6b3a; font-size: 13px; margin: 4px 0; font-weight: 600; background: rgba(47,107,58,0.06); padding: 12px 14px; border: 1px solid rgba(47,107,58,0.25); }
        .btn-whatsapp { background: #25d366; color: #fff; border-color: #25d366; }
        .btn-whatsapp:hover { background: transparent; color: #25d366; }
        @media (min-width: 768px) {
          .cart-layout { grid-template-columns: 1fr 380px; padding: 0 32px; }
        }
      `}</style>
    </div>
  )
}
