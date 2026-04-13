'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/trades'

export default function QuotePage({ params }) {
  const [quote, setQuote] = useState(null)
  const [business, setBusiness] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: q } = await supabase
        .from('quotes').select('*').eq('id', params.id).single()
      if (!q) { setError('Quote not found.'); setLoading(false); return }
      setQuote(q)
      if (q.status === 'accepted') setAccepted(true)

      const { data: biz } = await supabase
        .from('businesses').select('*').eq('id', q.business_id).single()
      setBusiness(biz)

      const { data: ld } = await supabase
        .from('leads').select('*').eq('id', q.lead_id).single()
      setLead(ld)

      setLoading(false)
    }
    fetchData()
  }, [])

  async function acceptQuote() {
    setAccepting(true)
    await supabase.from('quotes')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', quote.id)
    await supabase.from('leads')
      .update({ status: 'won' })
      .eq('id', quote.lead_id)
    setAccepted(true)
    setAccepting(false)
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
  const currency = business?.currency || 'EUR'

  return (
    <div className="min-h-screen bg-[#FAFAF9]">

      {/* Business header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4 py-5">
          <div className="flex items-start gap-4">
            {business?.logo_url ? (
              <img src={business.logo_url} alt={business.name}
                className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: accent }}>
                <span className="text-white text-xl font-bold font-heading">
                  {business?.name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold font-heading text-gray-900">{business?.name}</h1>
              {business?.tagline && <p className="text-sm text-gray-400">{business.tagline}</p>}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {business?.phone && (
                  <a href={`tel:${business.phone}`} className="text-sm text-gray-500 hover:underline">
                    {business.phone}
                  </a>
                )}
                {business?.email && (
                  <a href={`mailto:${business.email}`} className="text-sm text-gray-500 hover:underline">
                    {business.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

        {/* Quote header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Quotation</p>
              <h2 className="text-2xl font-bold font-heading" style={{ color: accent }}>
                {quote?.quote_number || `Q-${quote?.id?.slice(0, 8).toUpperCase()}`}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Prepared for</p>
              <p className="font-semibold text-gray-900 font-heading">{lead?.name}</p>
              {lead?.phone && <p className="text-xs text-gray-400">{lead.phone}</p>}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs text-gray-400">
            <span>Date: {new Date(quote?.created_at).toLocaleDateString()}</span>
            {quote?.valid_until && <span>Valid until: {new Date(quote.valid_until).toLocaleDateString()}</span>}
          </div>
        </div>

        {/* Line items */}
        {(quote?.sections || []).map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50" style={{ backgroundColor: `${accent}10` }}>
              <p className="font-semibold text-sm font-heading" style={{ color: accent }}>
                {section.tradeName}
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {section.items.filter(i => i.name || i.unit_price).map(item => (
                <div key={item.id} className="px-4 py-3 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name || 'Item'}</p>
                    {item.qty !== 1 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.qty} × {formatCurrency(item.unit_price, currency)}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm flex-shrink-0">
                    {formatCurrency(item.total || 0, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Notes */}
        {quote?.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(quote?.subtotal || 0, currency)}</span>
          </div>
          {business?.vat_registered && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {business?.country === 'PT' ? 'IVA' : 'Tax'} ({quote?.tax_rate || 0}%)
              </span>
              <span>{formatCurrency(quote?.tax_amount || 0, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-100 font-heading">
            <span>Total</span>
            <span style={{ color: accent }}>{formatCurrency(quote?.total || 0, currency)}</span>
          </div>
        </div>

        {/* Business details footer */}
        {(business?.address || business?.vat_number) && (
          <div className="text-center text-xs text-gray-300 space-y-0.5 pb-2">
            {business.address && <p>{business.address}</p>}
            {business.vat_number && (
              <p>{business.country === 'PT' ? 'NIF' : 'Tax ID'}: {business.vat_number}</p>
            )}
          </div>
        )}

        {/* Powered by */}
        <p className="text-center text-xs text-gray-200 pb-6">
          Powered by <a href="/" className="hover:underline">Quotify</a>
        </p>
      </div>

      {/* Accept button */}
      {!accepted && quote?.status === 'sent' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe">
          <div className="max-w-xl mx-auto">
            <button onClick={acceptQuote} disabled={accepting}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accent }}>
              {accepting ? 'Confirming...' : '✓ Accept this quote'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              By accepting, you confirm you want to proceed with this quote.
            </p>
          </div>
        </div>
      )}

      {/* Accepted state */}
      {accepted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-green-600 font-bold text-base">🎉 Quote accepted!</p>
            <p className="text-xs text-gray-400 mt-1">
              {business?.name} has been notified. They'll be in touch soon.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
-e 
export const dynamic = 'force-dynamic'
