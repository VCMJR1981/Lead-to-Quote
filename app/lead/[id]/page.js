'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getTrade, getJobTypes, getDefaultItems, TRADE_LIST, formatCurrency } from '@/lib/trades'

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}` }

export default function LeadPage({ params }) {
  const [lead, setLead] = useState(null)
  const [business, setBusiness] = useState(null)
  const [sections, setSections] = useState([])
  const [notes, setNotes] = useState('')
  const [quoteId, setQuoteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.push('/onboarding'); return }
    setBusiness(biz)

    const { data: leadData } = await supabase.from('leads').select('*').eq('id', params.id).single()
    if (!leadData) { router.push('/'); return }
    setLead(leadData)

    const { data: quoteData } = await supabase
      .from('quotes').select('*').eq('lead_id', params.id).maybeSingle()

    if (quoteData) {
      setQuoteId(quoteData.id)
      setSections(quoteData.sections || [])
      setNotes(quoteData.notes || '')
    } else {
      // Pre-load default template from business industry
      const tradeKey = biz.industry || 'handyman'
      const trade = getTrade(tradeKey)
      setSections([{
        id: genId(),
        tradeKey,
        tradeName: trade?.name || 'General',
        items: getDefaultItems(tradeKey),
      }])
    }
    setLoading(false)
  }

  // Calculations
  const subtotal = sections.reduce((sum, sec) =>
    sum + sec.items.reduce((s, item) => s + (item.total || 0), 0), 0)
  const taxRate = business?.vat_registered ? (business?.vat_rate || 0) : 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  // Item management
  function updateItem(secId, itemId, field, rawValue) {
    const value = field === 'name' ? rawValue : parseFloat(rawValue) || 0
    setSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return {
        ...sec,
        items: sec.items.map(item => {
          if (item.id !== itemId) return item
          const updated = { ...item, [field]: value }
          if (field === 'qty' || field === 'unit_price') {
            updated.total = (updated.qty || 0) * (updated.unit_price || 0)
          }
          return updated
        })
      }
    }))
    setSaved(false)
  }

  function addItem(secId) {
    setSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return {
        ...sec,
        items: [...sec.items, { id: genId(), name: '', qty: 1, unit_price: 0, total: 0 }]
      }
    }))
  }

  function removeItem(secId, itemId) {
    setSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return { ...sec, items: sec.items.filter(i => i.id !== itemId) }
    }))
    setSaved(false)
  }

  function removeSection(secId) {
    setSections(prev => prev.filter(s => s.id !== secId))
    setSaved(false)
  }

  function addSection(tradeKey) {
    const trade = getTrade(tradeKey)
    setSections(prev => [...prev, {
      id: genId(),
      tradeKey,
      tradeName: trade?.name || tradeKey,
      items: getDefaultItems(tradeKey),
    }])
    setShowAddSection(false)
    setSaved(false)
  }

  async function saveQuote() {
    setSaving(true)
    const quoteData = {
      lead_id: lead.id,
      business_id: business.id,
      sections,
      notes,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      status: 'draft',
    }

    let id = quoteId
    if (quoteId) {
      await supabase.from('quotes').update(quoteData).eq('id', quoteId)
    } else {
      const count = await supabase.from('quotes').select('id', { count: 'exact' }).eq('business_id', business.id)
      const num = String((count.count || 0) + 1).padStart(4, '0')
      const { data } = await supabase.from('quotes')
        .insert({ ...quoteData, quote_number: `Q-${num}` }).select().single()
      id = data?.id
      setQuoteId(id)
    }
    setSaving(false)
    setSaved(true)
    return id
  }

  async function sendViaWhatsApp() {
    setSending(true)
    const id = await saveQuote()

    // Mark quote as sent
    await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
    // Update lead status
    await supabase.from('leads').update({ status: 'quoted' }).eq('id', lead.id)

    const quoteUrl = `${window.location.origin}/quote/${id}`
    const message = encodeURIComponent(
      `Hi ${lead.name}, here is your quote from ${business.name}:\n\n${quoteUrl}\n\nLet me know if you have any questions!`
    )
    const phone = lead.phone ? lead.phone.replace(/\D/g, '') : ''
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`

    window.open(waUrl, '_blank')
    setSending(false)

    // Update local lead status
    setLead(prev => ({ ...prev, status: 'quoted' }))
  }

  async function markStatus(status) {
    await supabase.from('leads').update({ status }).eq('id', lead.id)
    setLead(prev => ({ ...prev, status }))
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-heading text-gray-900">{lead.name}</h1>
            <p className="text-xs text-gray-400">{lead.job_type || 'No job type'} · {lead.phone || 'No phone'}</p>
          </div>
          {/* Status pill */}
          <div className="flex gap-2">
            {lead.status !== 'won' && (
              <button onClick={() => markStatus('won')}
                className="bg-green-50 text-green-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                ✓ Won
              </button>
            )}
            {lead.status !== 'lost' && (
              <button onClick={() => markStatus('lost')}
                className="bg-gray-100 text-gray-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                ✕ Lost
              </button>
            )}
          </div>
        </div>
        {/* Status banner if won/lost */}
        {['won', 'lost'].includes(lead.status) && (
          <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
            lead.status === 'won' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {lead.status === 'won' ? '🏆 Job won!' : '❌ Job lost'}
            <button onClick={() => markStatus('quoted')} className="ml-2 underline text-xs opacity-60">Undo</button>
          </div>
        )}
      </div>

      {/* Quote builder */}
      <div className="px-4 py-5 space-y-4 pb-40">

        {/* Sections */}
        {sections.map((section, secIdx) => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <span className="font-semibold text-sm font-heading text-gray-700">
                {section.tradeName}
              </span>
              {sections.length > 1 && (
                <button onClick={() => removeSection(section.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-xs">
                  Remove
                </button>
              )}
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {section.items.map(item => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="text" value={item.name}
                      onChange={e => updateItem(section.id, item.id, 'name', e.target.value)}
                      placeholder="Item description"
                      className="flex-1 text-sm text-gray-900 bg-transparent focus:outline-none placeholder-gray-300"
                    />
                    <button onClick={() => removeItem(section.id, item.id)}
                      className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 pt-0.5">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-gray-400">Qty</span>
                      <input type="number" value={item.qty}
                        onChange={e => updateItem(section.id, item.id, 'qty', e.target.value)}
                        className="w-12 text-sm text-gray-900 bg-transparent focus:outline-none text-center"
                        min="0" step="0.5"
                      />
                    </div>
                    <span className="text-gray-200">×</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 flex-1">
                      <span className="text-xs text-gray-400">{business?.currency === 'USD' ? '$' : '€'}</span>
                      <input type="number" value={item.unit_price}
                        onChange={e => updateItem(section.id, item.id, 'unit_price', e.target.value)}
                        className="flex-1 text-sm text-gray-900 bg-transparent focus:outline-none"
                        min="0" step="0.01" placeholder="0.00"
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 min-w-[60px] text-right">
                      {formatCurrency(item.total, business?.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item */}
            <button onClick={() => addItem(section.id)}
              className="w-full px-4 py-3 text-sm text-brand font-medium hover:bg-brand-light transition-colors text-left border-t border-gray-50">
              + Add line item
            </button>
          </div>
        ))}

        {/* Add section */}
        <button onClick={() => setShowAddSection(true)}
          className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm font-medium text-gray-400 hover:border-brand hover:text-brand transition-colors">
          + Add another trade section
        </button>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-semibold font-heading text-gray-600 mb-2">Notes</label>
          <textarea value={notes} onChange={e => { setNotes(e.target.value); setSaved(false) }}
            placeholder="Any extra information for the customer..."
            rows={3}
            className="w-full text-sm text-gray-700 placeholder-gray-300 focus:outline-none resize-none"
          />
        </div>

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal, business?.currency)}</span>
          </div>
          {business?.vat_registered && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {business?.country === 'PT' ? 'IVA' : 'Tax'} ({taxRate}%)
              </span>
              <span className="font-medium">{formatCurrency(taxAmount, business?.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 font-heading">
            <span>Total</span>
            <span className="text-brand">{formatCurrency(total, business?.currency)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-safe z-10">
        <div className="flex gap-2">
          <button onClick={saveQuote} disabled={saving}
            className="flex-shrink-0 border border-gray-200 text-gray-600 font-semibold text-sm px-4 py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
            {saving ? '...' : saved ? '✓ Saved' : 'Save'}
          </button>
          <button
            onClick={() => { saveQuote().then(id => { if(id) window.open(`/quote/${id}`, '_blank') }) }}
            className="flex-shrink-0 border border-gray-200 text-gray-600 font-semibold text-sm px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Preview
          </button>
          <button onClick={sendViaWhatsApp} disabled={sending || total === 0}
            className="flex-1 brand-gradient text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
            {sending ? 'Opening...' : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1C4.134 1 1 4.134 1 8C1 9.323 1.363 10.562 2 11.611L1 15L4.5 14.05C5.52 14.655 6.717 15 8 15C11.866 15 15 11.866 15 8C15 4.134 11.866 1 8 1Z" fill="white"/>
                  <path d="M6 5.5C6 5.5 5.5 6 5.5 7C5.5 8 6.5 9.5 7.5 10.5C8.5 11.5 10 12 10 12L10.5 11.5C10.5 11.5 11 11 10.5 10.5L9.5 9.5C9 9 8.5 9.5 8.5 9.5C8.5 9.5 7.5 8.5 6.5 7.5C6.5 7.5 7 7 6.5 6.5L6 5.5Z" fill="#25D366"/>
                </svg>
                Send via WhatsApp
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add section modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAddSection(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-safe max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold font-heading mb-4">Add trade section</h3>
            <div className="grid grid-cols-2 gap-2">
              {TRADE_LIST.filter(t => !sections.find(s => s.tradeKey === t.key)).map(t => (
                <button key={t.key} onClick={() => addSection(t.key)}
                  className="p-3 rounded-xl border border-gray-200 text-left hover:border-brand hover:bg-brand-light transition-all">
                  <span className="text-sm font-medium text-gray-800">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
