import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// Use service role to bypass RLS in webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const data = event.data.object

  try {
    switch (event.type) {

      // Trial started or subscription created
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const businessId = data.metadata?.business_id
        if (!businessId) break

        await supabaseAdmin.from('businesses').update({
          stripe_subscription_id: data.id,
          subscription_status: data.status,
          trial_ends_at: data.trial_end
            ? new Date(data.trial_end * 1000).toISOString()
            : null,
          current_period_end: data.current_period_end
            ? new Date(data.current_period_end * 1000).toISOString()
            : null,
        }).eq('id', businessId)
        break
      }

      // Subscription cancelled
      case 'customer.subscription.deleted': {
        const businessId = data.metadata?.business_id
        if (!businessId) break

        await supabaseAdmin.from('businesses').update({
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }).eq('id', businessId)
        break
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const customerId = data.customer
        await supabaseAdmin.from('businesses').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', customerId)
        break
      }

      // Payment succeeded
      case 'invoice.payment_succeeded': {
        const customerId = data.customer
        await supabaseAdmin.from('businesses').update({
          subscription_status: 'active',
        }).eq('stripe_customer_id', customerId)
        break
      }

      // Checkout completed (first subscription)
      case 'checkout.session.completed': {
        if (data.mode !== 'subscription') break
        const businessId = data.metadata?.business_id
        if (!businessId) break

        await supabaseAdmin.from('businesses').update({
          stripe_customer_id: data.customer,
          stripe_subscription_id: data.subscription,
          subscription_status: 'trialing',
        }).eq('id', businessId)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

