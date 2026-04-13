import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const PUBLIC = [
  '/form',
  '/quote',
  '/login',
  '/auth/callback',
  '/api/stripe/webhook',
  '/api/stripe/connect/webhook',
  '/api/stripe/connect/callback',
]

const BILLING_OK = [
  '/billing',
  '/onboarding',
  '/api/stripe',
]

export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Allow public routes — no auth needed
  const isPublic = PUBLIC.some(p => pathname.startsWith(p))
  if (isPublic) return response

  // Require login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Don't loop on login page
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Billing, onboarding, and Stripe API routes always accessible
  const isBillingOk = BILLING_OK.some(p => pathname.startsWith(p))
  if (isBillingOk) return response

  // Subscription gate — fetch business status
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
      return NextResponse.redirect(new URL('/billing', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
