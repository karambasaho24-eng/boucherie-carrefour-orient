// ============================================================
// src/pages/admin/AdminOrders.jsx  (REMPLACEMENT COMPLET)
// Liste des commandes avec :
// - décrément de stock automatique au passage hors "En attente"
// - restauration automatique du stock si la commande revient en
//   "En attente", ou est refusée/annulée après décrémentation
// - cohérence automatique payment_status/payment_method lors des
//   changements manuels de statut par l'admin
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { fetchOrders, updateOrderStatus, deleteOrder } from '../../lib/api'
import { decrementStockForOrder, restockOrder } from '../../lib/stockApi'

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
   * Changement de statut avec :
   * - décrément de stock automatique la première fois que la commande
   *   sort de "En attente" (protection anti-double-décrément côté SQL
   *   via order.stock_decremented)
   * - restauration automatique du stock si la commande revient en
   *   "En attente", ou est refusée/annulée après décrémentation
   * - cohérence automatique payment_status/payment_method :
   *     - passage manuel à "Payée" = paiement sur place (espèces/carte
   *       physique en boutique), SAUF si déjà payé réellement en ligne
   *       via Stripe
   *     - tout autre changement de statut réinitialise le paiement à
   *       "Non payé", SAUF si la commande a été réellement payée en
   *       ligne via Stripe (présence de stripe_payment_intent, rempli
   *       uniquement par le webhook Stripe). Dans ce cas, un message
   *       d'avertissement s'affiche avant de pouvoir continuer.
   */
  async function handleStatusChange(order, newStatus) {
    const isRealOnlinePayment =
