import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  const isPublic =
    pathname.startsWith('/form') ||
    pathname.startsWith('/quote') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/stripe/connect/webhook') ||
    pathname.startsWith('/api/stripe/connect/callback')

  if (isPublic) return supabaseResponse

  // Not logged in
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Billing/onboarding always accessible when logged in
  const isBillingOk =
    pathname.startsWith('/billing') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/stripe')

  if (isBillingOk) return supabaseResponse

  // Subscription gate
  const { data: business } = await supabase
    .from('businesses')
    .select('subscription_status, trial_ends_at')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (business) {
    const trialExpired =
      business.subscription_status === 'trialing' &&
      business.trial_ends_at &&
      new Date(business.trial_ends_at) < new Date()

    const blocked =
      business.subscription_status === 'canceled' ||
      business.subscription_status === 'past_due' ||
      trialExpired

    if (blocked) {
      const url = request.nextUrl.clone()
      url.pathname = '/billing'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
