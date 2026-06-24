// ============================================================
// supabase/functions/create-checkout-session/index.ts
// Crée une session Stripe Checkout pour une commande confirmée.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import Stripe from 'https://esm.sh/stripe@16?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { order_id } = await req.json()
    if (!order_id) {
      return json({ error: 'order_id manquant' }, 400)
    }

    // 1. Vérifier que Stripe est activé par l'admin
    const { data: config, error: configErr } = await supabase
      .from('site_config')
      .select('stripe_enabled')
      .eq('id', 1)
      .single()
    if (configErr) return json({ error: 'Configuration introuvable' }, 500)
    if (!config.stripe_enabled) {
      return json({ error: 'Le paiement par carte est désactivé.' }, 403)
    }

    // 2. Récupérer la commande
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()
    if (orderErr || !order) {
      return json({ error: 'Commande introuvable' }, 404)
    }

    // 3. Vérifications de sécurité métier
    if (order.status === 'refused') {
      return json({ error: 'Cette commande a été refusée.' }, 400)
    }
    if (order.status === 'cancelled') {
      return json({ error: 'Cette commande a été annulée.' }, 400)
    }
    if (order.payment_status === 'paid') {
      return json({ error: 'Cette commande est déjà payée.' }, 400)
    }
    if (order.status !== 'confirmed') {
      return json({ error: "La commande doit être confirmée par la boucherie avant paiement." }, 400)
    }

    // 4. Empêcher la création de plusieurs sessions simultanées :
    //    si une session existe déjà et n'est pas expirée, on la réutilise.
    if (order.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
        if (existing.status === 'open' && existing.url) {
          return json({ url: existing.url })
        }
      } catch {
        // session introuvable ou expirée -> on en recrée une
      }
    }

    const siteUrl = Deno.env.get('SITE_URL') ?? ''
    const items = order.items || []

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map((i: any) => ({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(i.price * 100),
          product_data: { name: `${i.name} (${i.qty} kg)` },
        },
        quantity: 1, // le prix unitaire ci-dessus correspond déjà à price * qty
      })),
      customer_email: undefined,
      metadata: { order_id: order.id },
      success_url: `${siteUrl}/commande/${order.id}?paiement=succes`,
      cancel_url: `${siteUrl}/commande/${order.id}?paiement=annule`,
    })

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id, payment_status: 'pending', payment_method: 'card' })
      .eq('id', order.id)

    return json({ url: session.url })
  } catch (err) {
    console.error(err)
    return json({ error: 'Erreur serveur lors de la création du paiement.' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
