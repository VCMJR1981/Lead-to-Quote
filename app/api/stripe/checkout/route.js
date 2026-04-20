import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe, PRICE_IDS } from '@/lib/stripe'

export async function POST(request) {
  try {
    const { business_id } = await request.json()
    if (!business_id) return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single()

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const currency = business.currency || 'USD'
    const priceId = PRICE_IDS[currency] || PRICE_IDS.USD

    if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 500 })

    let customerId = business.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: business.email,
        name: business.name,
        metadata: { business_id: business.id },
      })
      customerId = customer.id
      await supabase.from('businesses').update({ stripe_customer_id: customerId }).eq('id', business.id)
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { business_id: business.id } },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
      metadata: { business_id: business.id },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
