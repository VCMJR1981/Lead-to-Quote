import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const PUBLIC = [
  '/form',
  '/quote',
  '/login',
  '/auth',
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
  const { pathname } = request.nextUrl

  // Allow public routes
  const isPublic = PUBLIC.some(p => pathname.startsWith(p))
  if (isPublic) return response

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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — go to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Billing and onboarding always accessible when logged in
  const isBillingOk = BILLING_OK.some(p => pathname.startsWith(p))
  if (isBillingOk) return response

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
      return NextResponse.redirect(new URL('/billing', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
}
