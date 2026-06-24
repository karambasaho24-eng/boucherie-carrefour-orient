// ============================================================
// supabase/functions/stripe-webhook/index.ts
// Seule source de vérité pour la confirmation de paiement.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import Stripe from 'https://esm.sh/stripe@16?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret)
  } catch (err) {
    console.error('Signature webhook invalide', err)
    return new Response('Signature invalide', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          payment_method: 'card',
          stripe_session_id: session.id,
          stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .neq('payment_status', 'paid') // idempotence : pas de double traitement
      if (error) console.error('Erreur mise à jour commande:', error)
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) {
      await supabase
        .from('orders')
        .update({ payment_status: 'unpaid' })
        .eq('id', orderId)
        .eq('payment_status', 'pending')
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
