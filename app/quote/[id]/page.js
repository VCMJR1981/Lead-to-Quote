'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/trades'

export default function QuotePage({ params }) {
  const [quote, setQuote] = useState(null)
  const [business, setBusiness] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepted, setAccepted] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showStripeInfo, setShowStripeInfo] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Mark as viewed
      const { data: q } = await supabase.from('quotes').select('*').eq('id', params.id).single()
      if (!q) { setError('Quote not found.'); setLoading(false); return }
      setQuote(q)
      if (q.status === 'accepted') setAccepted(true)

      const { data: biz } = await supabase.from('businesses').select('*').eq('id', q.business_id).single()
      setBusiness(biz)

      const { data: ld } = await supabase.from('leads').select('*').eq('id', q.lead_id).single()
      setLead(ld)

      // Mark lead as viewed
      if (ld && !ld.viewed_at) {
        await supabase.from('leads').update({ viewed_at: new Date().toISOString() }).eq('id', ld.id)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function acceptQuote() {
    setAccepting(true)
    await supabase.from('quotes').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', quote.id)
    await supabase.from('leads').update({ status: 'won' }).eq('id', quote.lead_id)
    setAccepted(true)
    setAccepting(false)
    setShowPayment(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  )

  const accent = business?.accent_color || '#E85D26'
  const currency = business?.currency || 'USD'
  const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€'
  const fmt = n => formatCurrency(n, currency)

  // Use quote values, fall back to business defaults
  const depositPct = quote?.deposit_pct ?? business?.deposit_pct ?? 30
  const paymentMethods = (quote?.payment_methods?.length > 0
    ? quote.payment_methods
    : business?.payment_methods) || ['bank', 'card']

  const depositAmt = (quote?.total || 0) * depositPct / 100
  const remaining = (quote?.total || 0) - depositAmt
  const stripeLabel = currency === 'USD' ? '2.9% + $0.30' : '1.5% + €0.25'
  const stripeRate = currency === 'USD' ? 0.029 : 0.015
  const stripeFixed = currency === 'USD' ? 0.30 : 0.25
  const cardTotal = depositAmt + depositAmt * stripeRate + stripeFixed

  return (
    <div className="min-h-screen bg-[#FAFAF9]">

      {/* Business header — builds trust */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold font-heading text-white text-xl"
              style={{ backgroundColor: accent }}>
              {business?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold font-heading text-gray-900">{business?.name}</h1>
            {business?.tagline && <p className="text-xs text-gray-400 mt-0.5">{business.tagline}</p>}
            <div className="flex flex-wrap gap-x-3 mt-1">
              {business?.phone && (
                <a href={`tel:${business.phone}`} className="text-xs text-brand font-medium">{business.phone}</a>
              )}
              {business?.email && (
                <a href={`mailto:${business.email}`} className="text-xs text-gray-400">{business.email}</a>
              )}
            </div>
            {business?.address && (
              <p className="text-xs text-gray-400 mt-0.5">{business.address}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-4 pb-36">

        {/* Quote header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Quotation</p>
              <h2 className="text-2xl font-bold font-heading" style={{ color: accent }}>
                {quote?.quote_number || 'Q-0001'}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Prepared for</p>
              <p className="font-semibold font-heading text-gray-900">{lead?.name}</p>
              {lead?.phone && <p className="text-xs text-gray-400">{lead.phone}</p>}
            </div>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <span>Date: {new Date(quote?.created_at).toLocaleDateString()}</span>
            <span>Valid 30 days</span>
          </div>
        </div>

        {/* Line items */}
        {(quote?.sections || []).map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50" style={{ backgroundColor: `${accent}12` }}>
              <p className="font-semibold text-sm font-heading" style={{ color: accent }}>{section.tradeName}</p>
            </div>
            {section.items.filter(i => i.name || i.unit_price).map(item => (
              <div key={item.id} className="px-4 py-3 flex justify-between items-start gap-4 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name || 'Item'}</p>
                  {item.qty !== 1 && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.qty} × {fmt(item.unit_price)}</p>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm flex-shrink-0">{fmt(item.total || 0)}</p>
              </div>
            ))}
          </div>
        ))}

        {/* Notes */}
        {quote?.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Notes from {business?.name}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{fmt(quote?.subtotal || 0)}</span>
          </div>
          {quote?.tax_rate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {business?.country === 'PT' ? 'IVA' : 'Tax'} ({quote.tax_rate}%)
              </span>
              <span>{fmt(quote?.tax_amount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-100 font-heading">
            <span>Total</span>
            <span style={{ color: accent }}>{fmt(quote?.total || 0)}</span>
          </div>
        </div>

        {/* Deposit — always shown */}
        <div className="rounded-2xl p-4 border border-amber-200 bg-amber-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-sm font-heading text-amber-900">
                Deposit to confirm job
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {depositPct > 0
                  ? `${depositPct}% upfront · Remainder due on completion`
                  : 'No deposit required · Full amount due on completion'}
              </p>
            </div>
            <p className="font-bold text-lg font-heading text-amber-900">
              {depositPct > 0 ? fmt(depositAmt) : fmt(quote?.total || 0)}
            </p>
          </div>
          {depositPct > 0 && (
            <div className="flex justify-between text-xs text-amber-600 pt-2 border-t border-amber-200">
              <span>Remaining on completion</span>
              <span>{fmt(remaining)}</span>
            </div>
          )}
        </div>

        {/* Payment methods — always shown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="font-semibold font-heading text-gray-900 text-sm">
            {showPayment ? 'Choose how to pay the deposit' : 'How to pay'}
          </p>

            {/* Bank transfer */}
            {paymentMethods.includes('bank') && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🏦</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bank Transfer</p>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">No fee</span>
                  </div>
                </div>
                {business?.bank_detail ? (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">Transfer details</p>
                    <p className="text-sm font-medium text-gray-900">{business.bank_detail}</p>
                    <p className="text-xs text-gray-400 mt-2">Reference: {quote?.quote_number} · {lead?.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      Amount: {fmt(depositPct > 0 ? depositAmt : (quote?.total || 0))}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Contact {business?.name} for bank details.</p>
                )}
              </div>
            )}

            {/* Card via Stripe */}
            {paymentMethods.includes('card') && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">💳</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Pay by Card</p>
                    <p className="text-xs text-blue-500">Processed securely by Stripe</p>
                  </div>
                  <button onClick={() => setShowStripeInfo(p => !p)}
                    className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    ?
                  </button>
                </div>
                {showStripeInfo && (
                  <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100 text-xs text-gray-500 leading-relaxed">
                    <p className="font-semibold text-gray-700 mb-1">About this fee</p>
                    Stripe is a secure payment processor used by millions of businesses worldwide. A small processing fee ({stripeLabel}) is added to card payments to cover their service. This is charged to you, not {business?.name}. There is no fee for bank transfers.
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Deposit amount</span>
                    <span>{fmt(depositPct > 0 ? depositAmt : (quote?.total || 0))}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-600 mb-2">
                    <span>Stripe fee ({stripeLabel})</span>
                    <span>+{fmt(depositAmt * stripeRate + stripeFixed)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                    <span>You pay by card</span>
                    <span className="text-blue-700">{fmt(cardTotal)}</span>
                  </div>
                </div>
                {showPayment && (
                  <button className="w-full mt-3 py-3 rounded-xl text-white text-sm font-bold"
                    style={{ background: '#635BFF' }}>
                    🔒 Pay {fmt(cardTotal)} by card
                  </button>
                )}
              </div>
            )}

            {/* Cash */}
            {(quote?.payment_methods || []).includes('cash') && (
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">💵</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cash on the day</p>
                  <p className="text-xs text-gray-400">Arrange directly with {business?.name}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legal disclaimer */}
        <div className="rounded-2xl p-4 bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Important Notice</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            This quotation is valid for 30 days from the date issued and is based on information available at time of assessment.
            Final costs may vary due to unforeseen site conditions, changes in material prices, or variations in scope requested by the client.
            Any changes to the agreed scope will be communicated and approved in writing before work proceeds.
            This quote is not binding until a deposit is received or written acceptance is confirmed by both parties.
          </p>
        </div>

        {/* Business footer */}
        {(business?.address || business?.vat_number) && (
          <div className="text-center text-xs text-gray-300 space-y-0.5">
            {business.address && <p>{business.address}</p>}
            {business.vat_number && <p>{business.country === 'PT' ? 'NIF' : 'Tax ID'}: {business.vat_number}</p>}
          </div>
        )}

        <p className="text-center text-xs text-gray-200 pb-4">
          Powered by <span className="text-brand">Lead-to-Quote</span>
        </p>
      </div>

      {/* Accept button — sticky bottom */}
      {!accepted && quote?.status === 'sent' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8">
          <div className="max-w-xl mx-auto">
            <button onClick={acceptQuote} disabled={accepting}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-60"
              style={{ backgroundColor: accent }}>
              {accepting ? 'Confirming...' : `✓ Accept quote & confirm deposit`}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              By accepting, you confirm you want to proceed. You'll then choose how to pay the deposit.
            </p>
          </div>
        </div>
      )}

      {/* Accepted — pay now */}
      {accepted && !showPayment && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-3">
              <p className="text-green-600 font-bold">🎉 Quote accepted!</p>
              <p className="text-xs text-gray-400 mt-1">Choose how you'd like to pay the deposit below.</p>
            </div>
            <button onClick={() => setShowPayment(true)}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
              style={{ backgroundColor: accent }}>
              View payment options →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
