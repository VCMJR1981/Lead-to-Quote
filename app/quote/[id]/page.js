'use client'
import { useEffect, useState } from 'react'
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
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: q } = await supabase.from('quotes').select('*').eq('id', params.id).single()
      if (!q) { setLoading(false); return }
      setQuote(q)
      setAccepted(q.status === 'accepted')
      const { data: biz } = await supabase.from('businesses').select('*').eq('id', q.business_id).single()
      setBusiness(biz)
      const { data: ld } = await supabase.from('leads').select('*').eq('id', q.lead_id).single()
      setLead(ld)
      // Track view
      if (q.status === 'sent' && !q.viewed_at) {
        await supabase.from('quotes').update({ viewed_at: new Date().toISOString() }).eq('id', q.id)
        await supabase.from('leads').update({ viewed_at: new Date().toISOString() }).eq('id', q.lead_id)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function acceptQuote() {
    setAccepting(true)
    await supabase.from('quotes').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', quote.id)
    await supabase.from('leads').update({ status: 'won' }).eq('id', quote.lead_id)
    setAccepted(true); setAccepting(false)
  }

  if (loading) return <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
  if (!quote) return <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center"><p className="text-gray-600">Quote not found.</p></div>

  const currency = business?.currency || 'USD'
  const fmt = n => formatCurrency(n, currency)
  const accent = '#E85D26'
  const paymentMethods = quote.payment_methods || ['bank']
  const depositPct = quote.deposit_pct || 0
  const depositAmt = (quote.total || 0) * depositPct / 100
  const remaining = (quote.total || 0) - depositAmt
  const stripeLabel = currency === 'USD' ? '2.9% + $0.30' : '1.5% + €0.25'
  const stripeRate = currency === 'USD' ? 0.029 : 0.015
  const stripeFixed = currency === 'USD' ? 0.30 : 0.25

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Business header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business.name} className="w-14 h-14 rounded-2xl object-contain bg-white border border-gray-100 flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold font-heading text-white text-xl" style={{ backgroundColor: accent }}>
              {business?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold font-heading text-gray-900">{business?.name}</h1>
            {business?.tagline && <p className="text-xs text-gray-600 mt-0.5">{business.tagline}</p>}
            <div className="flex flex-wrap gap-x-3 mt-1">
              {business?.phone && <a href={`tel:${business.phone}`} className="text-xs text-brand font-medium">{business.phone}</a>}
              {business?.email && <a href={`mailto:${business.email}`} className="text-xs text-brand font-medium">{business.email}</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-xl mx-auto">
        {/* Quote header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Prepared for</p>
              <p className="font-bold font-heading text-gray-900">{lead?.name}</p>
              {lead?.phone && <p className="text-xs text-gray-600 mt-0.5">{lead.phone}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold font-heading text-xl" style={{ color: accent }}>{quote.quote_number || 'Q-0001'}</p>
              <p className="text-xs text-gray-600 mt-0.5">{new Date(quote.created_at).toLocaleDateString()}</p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">Valid 30 days</p>
            </div>
          </div>
          {lead?.job_type && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-600">Job: <span className="text-gray-900 font-medium">{lead.job_type}</span></p>
            </div>
          )}
        </div>

        {/* Accepted banner */}
        {accepted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold text-green-800 font-heading">Quote accepted!</p>
            <p className="text-sm text-green-700 mt-1">Thank you — {business?.name} will be in touch shortly.</p>
          </div>
        )}

        {/* Line items */}
        {(quote.sections || []).map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="font-semibold text-sm font-heading text-gray-700">{section.tradeName}</p>
            </div>
            {section.items.filter(i => i.name || i.unit_price > 0).map(item => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{item.name || '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.qty} × {fmt(item.unit_price)}</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{fmt(item.total || 0)}</p>
              </div>
            ))}
          </div>
        ))}

        {/* Notes */}
        {quote.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-600 mb-1">Notes from {business?.name}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Job site photo */}
        {quote.photo_url && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 pt-3 pb-2"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Job Site Photo</p></div>
            <img src={quote.photo_url} alt="Job site" className="w-full object-cover max-h-64" />
            <div className="px-4 py-2"><p className="text-xs text-gray-600">📷 Photo taken during site visit</p></div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span>{fmt(quote.subtotal || 0)}</span></div>
          {quote.tax_rate > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">{business?.country === 'PT' ? 'IVA' : 'Tax'} ({quote.tax_rate}%)</span><span>{fmt(quote.tax_amount || 0)}</span></div>}
          {paymentMethods.includes('card') && quote.stripe_fee > 0 && (
            <div className="flex justify-between text-sm bg-blue-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">💳 Card fee</span>
                <button onClick={() => setShowStripeInfo(p => !p)} className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center">?</button>
              </div>
              <span className="font-medium text-blue-600">{fmt(quote.stripe_fee)}</span>
            </div>
          )}
          {showStripeInfo && (
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed border border-blue-100">
              Stripe is a secure payment processor. A small fee ({stripeLabel}) is added when paying by card. No fee for bank transfer.
            </div>
          )}
          <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-100 font-heading">
            <span>Total</span><span style={{ color: accent }}>{fmt(quote.total || 0)}</span>
          </div>
        </div>

        {/* Deposit */}
        {depositPct > 0 && (
          <div className="rounded-2xl p-4 border border-amber-200 bg-amber-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-sm font-heading text-amber-900">Deposit to confirm job</p>
                <p className="text-xs text-amber-700 mt-0.5">{depositPct}% upfront · Remainder due on completion</p>
              </div>
              <p className="text-xl font-bold text-amber-900 font-heading">{fmt(depositAmt)}</p>
            </div>
            <div className="flex justify-between text-xs text-amber-700 pt-2 border-t border-amber-200">
              <span>Remaining on completion</span><span>{fmt(remaining)}</span>
            </div>
          </div>
        )}

        {/* Payment options — shown after accept */}
        {accepted && showPayment && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="font-semibold text-sm font-heading text-gray-900">How would you like to pay{depositPct > 0 ? ' the deposit' : ''}?</p>
            {paymentMethods.includes('bank') && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🏦</span>
                  <div className="flex-1"><p className="text-sm font-semibold text-gray-900">Bank Transfer</p><span className="text-xs text-green-600 font-semibold">No fee</span></div>
                </div>
                {business?.bank_detail ? (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Transfer details</p>
                    <p className="text-sm font-medium text-gray-900">{business.bank_detail}</p>
                    <p className="text-xs text-gray-600 mt-1">Reference: {quote.quote_number} · {lead?.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">Amount: {fmt(depositPct > 0 ? depositAmt : quote.total)}</p>
                  </div>
                ) : <p className="text-xs text-gray-600">Contact {business?.name} for bank details.</p>}
              </div>
            )}
            {paymentMethods.includes('cash') && (
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">💵</span>
                <p className="text-sm font-semibold text-gray-900">Cash on the day · No fee</p>
              </div>
            )}
          </div>
        )}

        {/* PDF download */}
        <button onClick={() => window.location.href = `/quote/${params.id}/print`}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600">
          📄 Download PDF
        </button>

        {/* Legal */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Important Notice</p>
          <p className="text-xs text-gray-500 leading-relaxed">This quotation is valid for 30 days. Final costs may vary due to unforeseen site conditions or scope changes. Any changes will be communicated and approved in writing before work proceeds.</p>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">Powered by <span className="text-brand">Lead-to-Quote</span></p>
      </div>

      {/* Accept button */}
      {!accepted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8">
          <div className="max-w-xl mx-auto">
            <button onClick={acceptQuote} disabled={accepting}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-60"
              style={{ backgroundColor: accent }}>
              {accepting ? 'Confirming...' : '✓ Accept quote'}
            </button>
            <p className="text-center text-xs text-gray-600 mt-2">By accepting, you confirm you want to proceed.</p>
          </div>
        </div>
      )}

      {/* Pay button after accept */}
      {accepted && !showPayment && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8">
          <div className="max-w-xl mx-auto">
            <button onClick={() => setShowPayment(true)}
              className="w-full py-4 rounded-2xl text-white font-bold text-base"
              style={{ backgroundColor: accent }}>
              💳 View payment options
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
