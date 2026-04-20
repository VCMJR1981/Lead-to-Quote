'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

function BillingContent() {
  const { user, loading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (user) fetchData()
    if (params.get('success')) setMessage('✓ Subscription activated!')
    if (params.get('canceled')) setMessage('Checkout canceled.')
  }, [user])

  async function fetchData() {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    setBusiness(data)
    setDataLoading(false)
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

  const isPremium = business?.subscription_status === 'active'
  const price = business?.currency === 'EUR' ? '€24' : '$29'

  const freeFeatures = ['5 quotes per month','Quote builder','WhatsApp, SMS & Email send','Client quote page']
  const premiumFeatures = ['Unlimited quotes','Deposits & payment methods','Branded quotation page','Job site photos','PDF download','Revenue summary','Client history','Saved rates','Repeat client detection','Public intake form']

  if (loading || dataLoading) return <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/settings')} className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-lg font-bold font-heading text-gray-900">Subscription</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-16">
        {message && <div className={`rounded-xl p-3 text-sm font-medium ${message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>{message}</div>}

        {/* Current plan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPremium ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {isPremium ? 'Premium' : 'Free'}
              </span>
              <p className="font-bold font-heading text-gray-900 text-lg mt-2">
                {isPremium ? `Lead-to-Quote Premium · ${price}/mo` : 'Lead-to-Quote Free'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {isPremium ? 'All features unlocked' : '5 quotes/month · Upgrade for unlimited'}
              </p>
            </div>
          </div>

          {/* Features */}
          {!isPremium ? (
            <>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Free includes</p>
                {freeFeatures.map(f => <div key={f} className="flex items-center gap-2 py-1"><span className="text-gray-400 text-xs">✓</span><span className="text-xs text-gray-600">{f}</span></div>)}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Premium unlocks</p>
                {premiumFeatures.map(f => <div key={f} className="flex items-center gap-2 py-1"><span className="text-brand text-xs font-bold">✓</span><span className="text-xs text-gray-700 font-medium">{f}</span></div>)}
              </div>
              <button onClick={startCheckout} disabled={checkoutLoading}
                className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-60 mt-4">
                {checkoutLoading ? 'Redirecting...' : `Upgrade to Premium — ${price}/mo`}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-y-2 mb-4">
                {[...freeFeatures, ...premiumFeatures].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-md bg-brand-light flex items-center justify-center flex-shrink-0"><span className="text-brand text-xs font-bold">✓</span></div>
                    <span className="text-xs text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={openPortal} disabled={portalLoading}
                className="w-full border border-gray-200 text-gray-600 rounded-xl py-3.5 font-semibold text-sm disabled:opacity-60">
                {portalLoading ? 'Opening...' : 'Manage subscription & invoices'}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-500">Powered by Stripe · Cancel anytime · No lock-in</p>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>
}
