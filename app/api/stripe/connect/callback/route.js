import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

export async function GET(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const businessId = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (error) {
    console.error('Connect OAuth error:', error)
    return NextResponse.redirect(`${appUrl}/billing?connect_error=1`)
  }

  if (!code || !businessId) {
    return NextResponse.redirect(`${appUrl}/billing?connect_error=1`)
  }

  try {
    // Exchange code for connected account ID
    const response = await getStripe().oauth.token({
      grant_type: 'authorization_code',
      code,
    })

    const connectedAccountId = response.stripe_user_id

    // Save to database
    await supabaseAdmin.from('businesses').update({
      stripe_connect_account_id: connectedAccountId,
      stripe_connect_onboarded: true,
    }).eq('id', businessId)

    return NextResponse.redirect(`${appUrl}/billing?connect_success=1`)
  } catch (err) {
    console.error('Connect callback error:', err)
    return NextResponse.redirect(`${appUrl}/billing?connect_error=1`)
  }
}

export const dynamic = 'force-dynamic'
