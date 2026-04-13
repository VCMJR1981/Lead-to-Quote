import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    // Connect webhooks use a separate webhook secret
    event = getStripe().webhooks.constructEvent(
      body, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Connect webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const data = event.data.object

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const quoteId = data.metadata?.quote_id
        const type = data.metadata?.type
        if (!quoteId) break

        // Mark payment as succeeded
        await supabaseAdmin.from('payments').update({
          status: 'succeeded',
          paid_at: new Date().toISOString(),
          stripe_checkout_session_id: data.id,
        }).eq('stripe_checkout_session_id', data.id)

        // If deposit paid → update lead to won
        if (type === 'deposit' || type === 'full') {
          const { data: quote } = await supabaseAdmin
            .from('quotes').select('lead_id').eq('id', quoteId).single()
          if (quote) {
            await supabaseAdmin.from('leads')
              .update({ status: 'won' })
              .eq('id', quote.lead_id)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const quoteId = data.metadata?.quote_id
        if (!quoteId) break

        await supabaseAdmin.from('payments').update({
          status: 'failed',
        }).eq('stripe_payment_intent_id', data.id)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Connect webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'
