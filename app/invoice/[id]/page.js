'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/trades'

export default function InvoicePage({ params }) {
  const [quote, setQuote] = useState(null)
  const [business, setBusiness] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: q } = await supabase.from('quotes').select('*').eq('id', params.id).single()
      if (!q) { router.push('/'); return }
      setQuote(q)
      const { data: biz } = await supabase.from('businesses').select('*').eq('id', q.business_id).single()
      setBusiness(biz)
      const { data: ld } = await supabase.from('leads').select('*').eq('id', q.lead_id).single()
      setLead(ld)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const fmt = n => formatCurrency(n, business?.currency)

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="flex items-center gap-4 max-w-xl mx-auto">
          <div className="w-12 h-12 brand-gradient rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold font-heading">{business?.name?.[0]}</span>
          </div>
          <div>
            <h1 className="font-bold font-heading text-gray-900">{business?.name}</h1>
            {business?.phone && <p className="text-sm text-gray-500">{business.phone}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Invoice</p>
              <h2 className="text-2xl font-bold font-heading text-brand">
                {quote?.quote_number?.replace('Q-', 'INV-') || 'INV-0001'}
              </h2>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full mt-2">
                📄 Invoice
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Invoiced to</p>
              <p className="font-semibold font-heading text-gray-900">{lead?.name}</p>
              <p className="text-xs text-red-500 font-medium mt-1">
                Due: {new Date(Date.now() + 30*86400000).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {(quote?.sections || []).map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-brand-light border-b border-gray-100">
              <p className="font-semibold text-sm font-heading text-brand">{section.tradeName}</p>
            </div>
            {section.items.filter(i => i.name || i.unit_price).map(item => (
              <div key={item.id} className="px-4 py-3 flex justify-between border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.qty !== 1 && <p className="text-xs text-gray-400">{item.qty} × {fmt(item.unit_price)}</p>}
                </div>
                <p className="font-semibold text-gray-900">{fmt(item.total || 0)}</p>
              </div>
            ))}
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{fmt(quote?.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t font-heading">
            <span>Total Due</span>
            <span className="text-brand">{fmt(quote?.total || 0)}</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-blue-700 font-medium">💳 Please arrange payment with {business?.name} directly.</p>
        </div>

        <p className="text-center text-xs text-gray-300 pb-8">Powered by Lead-to-Quote</p>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
