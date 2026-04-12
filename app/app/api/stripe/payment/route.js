import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { quoteId, type = 'deposit' } = await request.json()
    // type: 'deposit' | 'full'

    const { data: quote } = await supabaseAdmin
      .from('quotes')
      .select('*, businesses(*), leads(*)')
      .eq('id', quoteId)
      .single()

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

    const business = quote.businesses
    const lead = quote.leads

    if (!business.stripe_connect_account_id) {
      return NextResponse.json({ error: 'Business not connected to Stripe' }, { status: 400 })
    }

    const currency = (business.currency || 'USD').toLowerCase()
    const stripeRate = currency === 'usd' ? 0.029 : 0.015
    const stripeFixed = currency === 'usd' ? 0.30 : 0.25

    // Amount client pays (includes Stripe fee passed through)
    const baseAmount = type === 'deposit'
      ? quote.deposit_amount || (quote.total * (quote.deposit_pct || 30) / 100)
      : quote.total

    const stripeFee = baseAmount * stripeRate + stripeFixed
    const totalWithFee = baseAmount + stripeFee

    // Stripe amounts are in cents (integer)
    const amountCents = Math.round(totalWithFee * 100)
    // Builder receives base amount (fee is added on top)
    const applicationFeeAmount = Math.round(stripeFee * 100)

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: lead.email || undefined,
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: type === 'deposit'
                ? `Deposit — ${business.name} (${quote.quote_number || quoteId.slice(0, 8)})`
                : `Payment — ${business.name} (${quote.quote_number || quoteId.slice(0, 8)})`,
              description: lead.job_type || 'Service',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          metadata: {
            quote_id: quoteId,
            business_id: business.id,
            lead_id: lead.id,
            type,
          },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/quote/${quoteId}?paid=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/quote/${quoteId}?canceled=1`,
        metadata: { quote_id: quoteId, type },
      },
      {
        // Charge through the connected account
        stripeAccount: business.stripe_connect_account_id,
      }
    )

    // Record pending payment
    await supabaseAdmin.from('payments').insert({
      quote_id: quoteId,
      business_id: business.id,
      stripe_checkout_session_id: session.id,
      amount: totalWithFee,
      currency: business.currency || 'USD',
      type,
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Payment session error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
