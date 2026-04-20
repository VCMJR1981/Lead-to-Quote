'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

const STATUS_LABELS = {
  trialing:   { label: 'Free Trial',  bg: '#EFF6FF', c: '#2563EB' },
  active:     { label: 'Active',      bg: '#F0FDF4', c: '#15803D' },
  past_due:   { label: 'Past Due',    bg: '#FEF2F2', c: '#DC2626' },
  canceled:   { label: 'Canceled',    bg: '#F4F4F5', c: '#71717A' },
  incomplete: { label: 'Incomplete',  bg: '#FFFBEB', c: '#B45309' },
}

function BillingContent() {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    fetchBusiness()
    // Show messages from redirects
    if (params.get('success'))         setMessage('✓ Subscription activated!')
    if (params.get('canceled'))        setMessage('Checkout canceled.')
    if (params.get('connect_success')) setMessage('✓ Stripe account connected!')
    if (params.get('connect_error'))   setMessage('⚠ Stripe connect failed. Try again.')
  }, [])

  async function fetchBusiness() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase
      .from('businesses').select('*').eq('owner_id', user.id).single()
    setBusiness(data)
    setLoading(false)
  }

  async function startCheckout() {
    setCheckoutLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url, error } = await res.json()
    if (error) { setMessage('Error: ' + error); setCheckoutLoading(false); return }
    window.location.href = url
  }

  async function openPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url, error } = await res.json()
    if (error) { setMessage('Error: ' + error); setPortalLoading(false); return }
    window.location.href = url
  }

  async function startConnect() {
    setConnectLoading(true)
    if (!business?.id) {
      setMessage('Error: Business not loaded')
      setConnectLoading(false)
      return
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'ca_UMkrkNLRrUy02czI9h2gAmRgOicRJ4uD',
      scope: 'read_write',
      redirect_uri: `${window.location.origin}/api/stripe/connect/callback`,
      state: business.id,
    })
    // Open in new tab so auth listener on current page doesn't fire
    window.open(`https://connect.stripe.com/oauth/authorize?${params.toString()}`, '_blank')
    setConnectLoading(false)
  }

  const price = business?.currency === 'EUR' ? '€24' : '$29'
  const status = business?.subscription_status || 'trialing'
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.trialing
  const isActive = ['trialing', 'active'].includes(status)
  const trialEnd = business?.trial_ends_at
    ? new Date(business.trial_ends_at).toLocaleDateString()
    : null

  const freeFeatures = [
    '5 quotes per month',
    'Quote builder',
    'WhatsApp, SMS & Email send',
    'Client quote page',
    'Deposit & payment methods',
  ]

  const premiumFeatures = [
    'Unlimited quotes',
    'PDF download',
    'Revenue summary',
    'Job site photos',
    'Client history',
    'Saved rates',
    'Repeat client detection',
    'Public intake form',
  ]

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')}
            className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold font-heading text-gray-900">Billing & Payments</h1>
            <p className="text-xs text-gray-600">Your subscription and payment setup</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-16">

        {message && (
          <div className={`rounded-xl p-3 text-sm font-medium ${
            message.startsWith('✓')
              ? 'bg-green-50 text-green-700'
              : message.startsWith('⚠')
              ? 'bg-red-50 text-red-600'
              : 'bg-gray-50 text-gray-500'
          }`}>
            {message}
          </div>
        )}

        {/* ── SECTION 1: Your plan ── */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Your plan
          </p>

          {/* Status card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: statusInfo.bg, color: statusInfo.c }}>
                  {status === 'active' ? 'Premium' : 'Free'}
                </span>
                <p className="font-bold font-heading text-gray-900 text-lg mt-2">
                  {status === 'active' ? `Lead-to-Quote Premium · ${price}/mo` : 'Lead-to-Quote Free'}
                </p>
                {status !== 'active' && (
                  <p className="text-sm text-gray-600 mt-1">
                    5 quotes per month · Upgrade for unlimited
                  </p>
                )}
                {status === 'active' && business?.current_period_end && (
                  <p className="text-sm text-gray-600 mt-1">                    Next billing: {new Date(business.current_period_end).toLocaleDateString()}
                  </p>
                )}
                {status === 'past_due' && (
                  <p className="text-sm text-red-500 mt-1">
                    Payment failed. Update your card to keep access.
                  </p>
                )}
                {status === 'canceled' && (
                  <p className="text-sm text-gray-600 mt-1">
                    Subscription ended. Resubscribe to continue.
                  </p>
                )}
              </div>
              <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
            {status !== 'active' ? (
              <>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Free includes</p>
                  {freeFeatures.map(f => (
                    <div key={f} className="flex items-center gap-2 py-1">
                      <span className="text-gray-400 text-xs">✓</span>
                      <span className="text-xs text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Premium unlocks</p>
                  {premiumFeatures.map(f => (
                    <div key={f} className="flex items-center gap-2 py-1">
                      <span className="text-brand text-xs font-bold">✓</span>
                      <span className="text-xs text-gray-700 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-y-2">
                {[...freeFeatures, ...premiumFeatures].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-md bg-brand-light flex items-center justify-center flex-shrink-0">
                      <span className="text-brand text-xs font-bold">✓</span>
                    </div>
                    <span className="text-xs text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {status !== 'active' ? (
            <button onClick={startCheckout} disabled={checkoutLoading}
              className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity">
              {checkoutLoading ? 'Redirecting...' : `Upgrade to Premium — ${price}/mo`}
            </button>
          ) : (
            <button onClick={openPortal} disabled={portalLoading}
              className="w-full border border-gray-200 text-gray-600 rounded-xl py-3.5 font-semibold text-sm disabled:opacity-60 hover:bg-gray-50 transition-colors">
              {portalLoading ? 'Opening...' : 'Manage subscription & invoices'}
            </button>
          )}
        </div>

        {/* ── SECTION 2: Stripe Connect ── */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Receive client payments
          </p>

          {business?.stripe_connect_onboarded ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#635BFF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-base tracking-tighter">S</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Stripe connected ✓</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Clients can pay deposits and invoices by card. Fee is added to their total.
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Card fee (paid by client)</span>
                  <span className="font-medium text-gray-600">
                    {business?.currency === 'EUR' ? '1.5% + €0.25' : '2.9% + $0.30'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#635BFF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-base tracking-tighter">S</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Connect with Stripe</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Let clients pay deposits and invoices by card. The Stripe fee is added to
                    their total — you receive the full quote amount.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
                {[
                  'Client pays: quote + Stripe fee',
                  'You receive: full quote amount',
                  `Fee: ${business?.currency === 'EUR' ? '1.5% + €0.25' : '2.9% + $0.30'} per transaction`,
                  'Payouts to your bank account',
                ].map(item => (
                  <p key={item} className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="text-brand">✓</span> {item}
                  </p>
                ))}
              </div>
              <button onClick={startConnect} disabled={connectLoading || !isActive}
                className="w-full text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: '#635BFF' }}>
                {connectLoading ? 'Redirecting to Stripe...' : 'Connect with Stripe →'}
              </button>
              {!isActive && (
                <p className="text-xs text-gray-600 text-center mt-2">
                  Activate your subscription first
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500">
          Powered by Stripe · Cancel anytime · No lock-in
        </p>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
