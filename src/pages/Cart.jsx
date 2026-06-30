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

function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s.\-]/g, '')
  return /^(\+33|0)[1-9](\d{8})$/.test(cleaned)
}

function buildWhatsAppMessage({ orderId, fullOrderId, form, items, total, deliveryEnabled }) {
  const lines = [
    `Commande #${orderId}`,
    `${form.customer_name}`,
    `Tél. ${form.phone}`,
    deliveryEnabled && form.address ? `Adresse : ${form.address}` : `Retrait en boutique`,
    ``,
    ...items.map((i) => `- ${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)} €`),
    ``,
    `Total : ${total.toFixed(2)} €`,
  ]
  if (fullOrderId) {
    lines.push(``, `Suivre ma commande :`, `${window.location.origin}/commande/${fullOrderId}`)
  }
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
  const deliveryEnabled = config?.delivery_enabled ?? false

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setForm((f) => ({
          ...f,
          customer_name: saved.customer_name || '',
          phone: saved.phone || '',
          address: saved.address || '',
        }))
      }
    } catch {}
  }, [])

  function handleField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function rememberCustomer() {
    try { localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(form)) } catch {}
  }

  function validate() {
    if (!form.customer_name.trim()) return 'Veuillez indiquer votre nom.'
    if (!form.phone.trim()) return 'Veuillez indiquer votre téléphone.'
    if (!isValidPhone(form.phone.trim())) return 'Le numéro de téléphone semble invalide.'
    if (deliveryEnabled && !form.address.trim()) return 'Veuillez indiquer votre adresse de livraison.'
    if (items.length === 0) return 'Votre panier est vide.'
    return null
  }

  async function handleSubmitOrder() {
    const validationError = validate()
    if (validationError) { setError(validationError); setSuccess(''); return }
    setError(''); setSuccess(''); setLoading(true)
    try {
      const orderData = {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: deliveryEnabled ? form.address.trim() : '',
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
      console.error(err)
      setError("Erreur serveur. Votre commande n'a pas pu être enregistrée.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitWhatsApp() {
    const validationError = validate()
    if (validationError) { setError(validationError); setSuccess(''); return }
    if (!whatsappNumber) { setError("WhatsApp n'est pas configuré."); return }
    setError(''); setSuccess(''); setLoading(true)
    let orderId = Date.now().toString(36).toUpperCase()
    let fullOrderId = null
    try {
      const orderData = {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: deliveryEnabled ? form.address.trim() : '',
        items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        total_price: total,
        status: 'pending',
      }
      const created = await createOrder(orderData)
      orderId = created.id.slice(0, 8).toUpperCase()
      fullOrderId = created.id
      rememberCustomer()
      rememberActiveOrder(created.id)
    } catch (err) {
      console.error(err)
    }
    const message = buildWhatsAppMessage({ orderId, fullOrderId, form, items, total, deliveryEnabled })
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
    clearCart()
    setSuccess('Commande envoyée sur WhatsApp !')
    setLoading(false)
  }

  if (order) {
    return (
      <div className="container cart-page">
        <div className="order-success">
          <div className="order-success-mark">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.6 2.6L16 9.5" />
            </svg>
          </div>
          <h2>Commande envoyée</h2>
          <p>Votre commande <strong>#{order.id.slice(0, 8).toUpperCase()}</strong> a bien été enregistrée.</p>

          <div className="order-steps-info">
            <div className="order-step-line">
              <span className="order-step-icon">✓</span>
              <span>Votre commande a bien été enregistrée.</span>
            </div>
            <div className="order-step-line">
              <span className="order-step-icon">⏳</span>
              <span>Elle est maintenant en attente de validation par la boucherie.</span>
            </div>
            <div className="order-step-line">
              <span className="order-step-icon">🕒</span>
              <span>Merci de patienter, la préparation peut prendre un certain temps.</span>
            </div>
            <div className="order-step-warning">
              ⚠️ N'allez pas récupérer votre commande avant d'avoir reçu la confirmation de la boucherie.
            </div>
          </div>

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
          .order-success { max-width: 460px; margin: 64px auto; text-align: center; }
          .order-success-mark { color: var(--color-ink); margin-bottom: 20px; }
          .order-success h2 { font-family: var(--font-display); font-weight: 600; font-size: 26px; margin: 0 0 12px; }
          .order-receipt-wrap { margin-top: 28px; }
          .order-meta { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); padding: 16px 0; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-text-muted); }
          .order-steps-info { text-align: left; margin: 22px 0; border: 1px solid var(--color-border); background: var(--color-paper-dim); padding: 18px 18px 16px; display: flex; flex-direction: column; gap: 12px; }
          .order-step-line { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; line-height: 1.5; }
          .order-step-icon { flex-shrink: 0; font-size: 14px; line-height: 1.5; }
          .order-step-warning { background: rgba(181,24,31,0.07); border: 1px solid rgba(181,24,31,0.25); color: var(--color-red); padding: 10px 12px; font-size: 12.5px; font-weight: 600; line-height: 1.5; }
          .wait-msg { font-size: 12px; color: var(--color-text-muted); font-style: italic; margin: 6px 0; text-align: center; }
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
