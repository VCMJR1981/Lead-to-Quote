'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { getTrade, getJobTypes, getDefaultItems, TRADE_LIST, formatCurrency } from '@/lib/trades'

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}` }

export default function LeadPage({ params }) {
  const { user, loading } = useAuth()
  const [lead, setLead] = useState(null)
  const [business, setBusiness] = useState(null)
  const [sections, setSections] = useState([])
  const [notes, setNotes] = useState('')
  const [quoteId, setQuoteId] = useState(null)
  const [depositPct, setDepositPct] = useState(30)
  const [payMethods, setPayMethods] = useState(['bank', 'card'])
  const [dataLoading, setDataLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [leadStatus, setLeadStatus] = useState('new')
  const [addSecOpen, setAddSecOpen] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [smsModal, setSmsModal] = useState(false)
  const [smsPhone, setSmsPhone] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.replace('/onboarding'); return }
    setBusiness(biz)
    // Default deposit from business settings
    setDepositPct(biz.deposit_pct ?? 30)
    setPayMethods(biz.payment_methods || ['bank', 'card'])

    const { data: ld } = await supabase.from('leads').select('*').eq('id', params.id).single()
    if (!ld) { router.replace('/'); return }
    setLead(ld)
    setLeadStatus(ld.status)
    setEmailInput(ld.email || '')
    setEditForm({ name: ld.name, phone: ld.phone || '', email: ld.email || '', job_type: ld.job_type || '', description: ld.description || '' })

    const { data: qt } = await supabase.from('quotes').select('*').eq('lead_id', params.id).maybeSingle()
    if (qt) {
      setQuoteId(qt.id)
      setSections(qt.sections || [])
      setNotes(qt.notes || '')
      setDepositPct(qt.deposit_pct ?? biz.deposit_pct ?? 30)
      setPayMethods(qt.payment_methods || biz.payment_methods || ['bank', 'card'])
    } else {
      const tradeKey = biz.industry || 'handyman'
      const trade = getTrade(tradeKey)
      setSections([{ id: genId(), tradeKey, tradeName: trade?.name || 'General', items: getDefaultItems(tradeKey) }])
    }
    setDataLoading(false)
  }

  function loadSavedRates() {
    if (!business) return
    // Try new v2 format first (per trade sections)
    const storedV2 = localStorage.getItem(`rates_v2_${business.id}`)
    // Fall back to old flat format
    const storedV1 = localStorage.getItem(`rates_${business.id}`)

    if (!storedV2 && !storedV1) {
      alert('No saved rates yet. Go to ⚡ Rates to set them up.')
      return
    }

    if (storedV2) {
      // New format: array of sections, each with rates array
      const savedSections = JSON.parse(storedV2)
      setSections(prev => {
        const updated = [...prev]
        savedSections.forEach(savedSec => {
          const existing = updated.find(s => s.tradeKey === savedSec.tradeKey)
          const newItems = savedSec.rates
            .filter(r => r.name)
            .map(r => ({ id: genId(), name: r.name, qty: 1, unit_price: r.unit_price, total: r.unit_price }))
          if (existing) {
            // Merge into existing section
            const fresh = newItems.filter(ni => !existing.items.find(i => i.name === ni.name))
            existing.items = [...existing.items, ...fresh]
          } else {
            // Add new section
            updated.push({ id: genId(), tradeKey: savedSec.tradeKey, tradeName: savedSec.tradeName, items: newItems })
          }
        })
        return updated
      })
    } else {
      // Old flat format
      const rates = JSON.parse(storedV1)
      setSections(prev => prev.map((sec, i) => {
        if (i !== 0) return sec
        const newItems = rates
          .filter(r => r.name && !sec.items.find(it => it.name === r.name))
          .map(r => ({ id: genId(), name: r.name, qty: 1, unit_price: r.unit_price, total: r.unit_price }))
        return { ...sec, items: [...sec.items, ...newItems] }
      }))
    }
    setRatesLoaded(true)
    setSaved(false)
  }

  // Calculations
  const subtotal = sections.reduce((s, sec) => s + sec.items.reduce((ss, i) => ss + (i.total || 0), 0), 0)
  const taxRate = business?.vat_registered ? (business?.vat_rate || 0) : 0
  const taxAmount = subtotal * (taxRate / 100)
  const stripeRate = business?.currency === 'USD' ? 0.029 : 0.015
  const stripeFixed = business?.currency === 'USD' ? 0.30 : 0.25
  const hasCard = payMethods.includes('card')
  const stripeFee = hasCard ? subtotal * stripeRate + stripeFixed : 0
  const total = subtotal + taxAmount
  const grandTotal = total + stripeFee

  function updItem(secId, itemId, field, val) {
    setSaved(false)
    setSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return { ...sec, items: sec.items.map(item => {
        if (item.id !== itemId) return item
        const u = { ...item, [field]: field === 'name' ? val : (parseFloat(val) || 0) }
        u.total = u.qty * u.unit_price
        return u
      })}
    }))
  }

  function addItem(secId) {
    setSections(prev => prev.map(sec => sec.id !== secId ? sec : {
      ...sec, items: [...sec.items, { id: genId(), name: '', qty: 1, unit_price: 0, total: 0 }]
    }))
  }

  function removeItem(secId, itemId) {
    setSaved(false)
    setSections(prev => prev.map(sec => sec.id !== secId ? sec : {
      ...sec, items: sec.items.filter(i => i.id !== itemId)
    }))
  }

  function addSection(tradeKey) {
    const trade = getTrade(tradeKey)
    setSections(prev => [...prev, { id: genId(), tradeKey, tradeName: trade?.name || tradeKey, items: getDefaultItems(tradeKey) }])
    setAddSecOpen(false)
    setSaved(false)
  }

  async function saveQuote() {
    setSaving(true)
    const payload = {
      lead_id: lead.id, business_id: business.id,
      sections, notes,
      subtotal, tax_rate: taxRate, tax_amount: taxAmount,
      stripe_fee: stripeFee, total: grandTotal,
      deposit_pct: depositPct, deposit_amount: grandTotal * depositPct / 100,
      payment_methods: payMethods, status: 'draft',
    }
    let id = quoteId
    if (quoteId) {
      await supabase.from('quotes').update(payload).eq('id', quoteId)
    } else {
      const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('business_id', business.id)
      const num = String((count || 0) + 1).padStart(4, '0')
      const { data } = await supabase.from('quotes').insert({ ...payload, quote_number: `Q-${num}`, status: 'draft' }).select().single()
      id = data?.id
      setQuoteId(id)
    }
    setSaving(false)
    setSaved(true)
    return id
  }

  async function saveEdit() {
    await supabase.from('leads').update({
      name: editForm.name,
      phone: editForm.phone || null,
      email: editForm.email || null,
      job_type: editForm.job_type || null,
      description: editForm.description || null,
    }).eq('id', lead.id)
    setLead(prev => ({ ...prev, ...editForm }))
    setEmailInput(editForm.email || '')
    setEditModal(false)
  }

  async function deleteLead() {
    if (!confirm('Delete this lead and its quote? This cannot be undone.')) return
    await supabase.from('leads').delete().eq('id', lead.id)
    router.push('/')
  }

  async function markStatus(status) {
    await supabase.from('leads').update({ status }).eq('id', lead.id)
    setLeadStatus(status)
    setLead(prev => ({ ...prev, status }))
  }

  async function sendWhatsApp() {
    const id = await saveQuote()
    await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
    await markStatus('quoted')
    const quoteUrl = `${window.location.origin}/quote/${id}`
    const msg = encodeURIComponent(`Hi ${lead.name}, here's your quote from ${business.name}:\n\n${quoteUrl}\n\nLet me know if you have any questions!`)
    const phone = lead.phone ? lead.phone.replace(/\D/g, '') : ''
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank')
  }

  async function sendSMS() {
    if (!lead.phone && !smsPhone) {
      setSmsPhone(lead.phone || '')
      setSmsModal(true)
      return
    }
    doSendSMS(lead.phone || smsPhone)
  }

  async function doSendSMS(phone) {
    const id = await saveQuote()
    await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
    // Save phone to lead if it was missing
    if (!lead.phone && phone) {
      await supabase.from('leads').update({ phone }).eq('id', lead.id)
      setLead(prev => ({ ...prev, phone }))
    }
    await markStatus('quoted')
    const quoteUrl = `${window.location.origin}/quote/${id}`
    const msg = encodeURIComponent(`Hi ${lead.name}, your quote from ${business.name} is ready:\n${quoteUrl}`)
    const cleanPhone = phone.replace(/\D/g, '')
    window.location.href = `sms:${cleanPhone}?&body=${msg}`
    setSmsModal(false)
  }

  async function sendEmail() {
    if (!lead.email && !emailInput) { setEmailModal(true); return }
    doSendEmail(lead.email || emailInput)
  }

  async function doSendEmail(email) {
    setEmailSending(true)
    const id = await saveQuote()
    await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
    if (emailInput && emailInput !== lead.email) {
      await supabase.from('leads').update({ email: emailInput }).eq('id', lead.id)
    }
    await markStatus('quoted')
    const quoteUrl = `${window.location.origin}/quote/${id}`
    const subject = encodeURIComponent(`Your quote from ${business.name}`)
    const body = encodeURIComponent(`Hi ${lead.name},\n\nPlease find your quote here:\n${quoteUrl}\n\nDon't hesitate to reach out if you have any questions.\n\n${business.name}`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    setEmailSending(false)
    setEmailModal(false)
  }

  const fmt = (n) => formatCurrency(n, business?.currency)
  const sym = business?.currency === 'USD' ? '$' : '€'

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold font-heading text-gray-900">{lead?.name}</h2>
            <p className="text-xs text-gray-600">
              {lead?.job_type || ''}{lead?.job_type && lead?.phone ? ' · ' : ''}{lead?.phone || ''}
              {!lead?.job_type && !lead?.phone ? '—' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
              ✏️ Edit
            </button>
            <button onClick={() => markStatus('won')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                leadStatus==='won' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>✓ Won</button>
            <button onClick={() => markStatus('lost')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                leadStatus==='lost' ? 'bg-gray-100 text-gray-500 border-gray-300' : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>✕ Lost</button>
          </div>
        </div>
        {leadStatus==='won' && (
          <div className="mt-3 bg-green-50 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-green-700 font-medium">🏆 Job won!</span>
            <button onClick={() => router.push(`/invoice/${quoteId}`)}
              className="bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              📄 Convert to Invoice
            </button>
          </div>
        )}
        {lead?.viewed_at && (
          <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-sm">👁</span>
            <p className="text-xs text-blue-700 font-medium">Customer opened the quote — good time to follow up!</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-4 pb-40">

        {/* Load saved rates */}
        <button onClick={loadSavedRates} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${
          ratesLoaded ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{ratesLoaded ? '✓' : '⚡'}</span>
            <div className="text-left">
              <p className={`text-sm font-semibold ${ratesLoaded ? 'text-green-700' : 'text-amber-800'}`}>
                {ratesLoaded ? 'Rates loaded!' : 'Load my saved rates'}
              </p>
              <p className={`text-xs ${ratesLoaded ? 'text-green-600' : 'text-amber-600'}`}>
                {ratesLoaded ? 'Edit freely below' : 'Drop your standard items in instantly'}
              </p>
            </div>
          </div>
          {!ratesLoaded && <span className="text-xs text-amber-700 font-semibold">Tap to load</span>}
        </button>

        {/* Sections */}
        {sections.map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <span className="font-semibold text-sm font-heading text-gray-700">{section.tradeName}</span>
              {sections.length > 1 && (
                <button onClick={() => { setSections(p => p.filter(s => s.id !== section.id)); setSaved(false) }}
                  className="text-gray-500 text-xs hover:text-red-400">Remove</button>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {section.items.map(item => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input value={item.name} onChange={e => updItem(section.id, item.id, 'name', e.target.value)}
                      placeholder="Item description"
                      className="flex-1 text-sm text-gray-900 bg-transparent focus:outline-none placeholder-gray-300"
                    />
                    <button onClick={() => removeItem(section.id, item.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors">
                      <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-gray-600">Qty</span>
                      <input type="number" value={item.qty} onChange={e => updItem(section.id, item.id, 'qty', e.target.value)}
                        className="w-12 text-sm text-gray-900 bg-transparent focus:outline-none text-center" min="0" step="0.5"/>
                    </div>
                    <span className="text-gray-400">×</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 flex-1">
                      <span className="text-xs text-gray-600">{sym}</span>
                      <input type="number" value={item.unit_price} onChange={e => updItem(section.id, item.id, 'unit_price', e.target.value)}
                        className="flex-1 text-sm text-gray-900 bg-transparent focus:outline-none" min="0" step="0.01" placeholder="0.00"/>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 min-w-[60px] text-right">{fmt(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => addItem(section.id)}
              className="w-full px-4 py-3 text-sm text-brand font-medium hover:bg-brand-light transition-colors text-left border-t border-gray-50">
              + Add line item
            </button>
          </div>
        ))}

        <button onClick={() => setAddSecOpen(true)}
          className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm font-medium text-gray-600 hover:border-brand hover:text-brand transition-colors">
          + Add another trade section
        </button>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold font-heading text-gray-500 uppercase tracking-wide mb-2">Notes</p>
          <textarea value={notes} onChange={e => { setNotes(e.target.value); setSaved(false) }}
            placeholder="Any extra info for the customer..."
            rows={3} className="w-full text-sm text-gray-700 placeholder-gray-300 focus:outline-none resize-none bg-transparent"
          />
        </div>

        {/* Payment settings — from profile, overridable per quote */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold font-heading text-gray-500 uppercase tracking-wide">Payment Settings</p>
            <span className="text-xs text-gray-600">From your profile · override below</span>
          </div>

          {/* Deposit override */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Deposit for this quote
              {business?.deposit_pct > 0 && (
                <span className="text-gray-600 font-normal"> (default: {business.deposit_pct}%)</span>
              )}
            </p>
            <div className="flex gap-2">
              {[0, 25, 30, 50].map(pct => (
                <button key={pct} onClick={() => { setDepositPct(pct); setSaved(false) }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    depositPct===pct ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-600'
                  }`}>
                  {pct===0 ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Payment methods</p>
            <div className="space-y-2">
              {[
                { key:'bank', label:'Bank Transfer', icon:'🏦', sub: business?.currency==='USD' ? 'ACH · No fee' : 'IBAN · No fee' },
                { key:'card', label:`Card (Stripe) · ${business?.currency==='USD'?'2.9% + $0.30':'1.5% + €0.25'} paid by client`, icon:'💳', sub:'' },
                { key:'cash', label:'Cash on the day', icon:'💵', sub:'' },
              ].map(m => (
                <button key={m.key} onClick={() => {
                  setPayMethods(p => p.includes(m.key) ? p.filter(x=>x!==m.key) : [...p, m.key])
                  setSaved(false)
                }} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  payMethods.includes(m.key) ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white'
                }`}>
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${payMethods.includes(m.key) ? 'text-brand' : 'text-gray-700'}`}>{m.label}</p>
                    {m.sub && <p className="text-xs text-gray-600">{m.sub}</p>}
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                    payMethods.includes(m.key) ? 'bg-brand border-brand' : 'border-gray-300'
                  }`}>
                    {payMethods.includes(m.key) && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{fmt(subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{business?.country==='PT' ? 'IVA' : 'Tax'} ({taxRate}%)</span>
              <span className="font-medium">{fmt(taxAmount)}</span>
            </div>
          )}
          {hasCard && (
            <div className="flex justify-between text-sm bg-blue-50 rounded-lg px-2 py-1.5">
              <span className="text-blue-600">💳 Card fee (paid by client)</span>
              <span className="font-medium text-blue-600">{fmt(stripeFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 font-heading">
            <span>Total</span>
            <span className="text-brand">{fmt(grandTotal)}</span>
          </div>
          {depositPct > 0 && (
            <>
              <div className="flex justify-between text-sm bg-amber-50 rounded-lg px-2 py-1.5">
                <span className="text-amber-700 font-semibold">Deposit ({depositPct}%)</span>
                <span className="font-bold text-amber-700">{fmt(grandTotal * depositPct / 100)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 px-2">
                <span>Remaining on completion</span>
                <span>{fmt(grandTotal * (1 - depositPct/100))}</span>
              </div>
            </>
          )}
        </div>

        {/* Legal disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Important Notice</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            This quotation is based on information available at the time of assessment. Final costs may vary due to unforeseen site conditions, material price changes, or variations in scope requested by the client. Any changes will be communicated and approved in writing before proceeding.
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8 z-10">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={saveQuote} disabled={saving}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50">
              {saving ? '...' : saved ? '✓ Saved' : 'Save'}
            </button>
            <button onClick={() => { saveQuote().then(id => { if(id) window.open(`/quote/${id}`, '_blank') }) }}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50">
              Preview
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={sendWhatsApp} disabled={grandTotal===0}
              className="flex-1 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#25D366' }}>
              📱 WhatsApp
            </button>
            <button onClick={sendSMS} disabled={grandTotal===0}
              className="flex-1 bg-purple-600 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              💬 SMS
            </button>
            <button onClick={sendEmail} disabled={emailSending || grandTotal===0}
              className="flex-1 bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {emailSending ? '...' : '✉️ Email'}
            </button>
          </div>
        </div>
      </div>

      {/* Add section modal */}
      {addSecOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAddSecOpen(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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

      {/* Email modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setEmailModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✉️</span>
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-gray-900">No email on file</h3>
                <p className="text-sm text-gray-600">Add {lead?.name?.split(' ')[0]}{"'s"} email to send the quote.</p>
              </div>
            </div>
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
              placeholder="client@example.com" autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setEmailModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-3 rounded-xl">
                Cancel
              </button>
              <button onClick={() => { if(emailInput) doSendEmail(emailInput) }}
                disabled={!emailInput || emailSending}
                className="flex-2 flex-grow bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-50">
                {emailSending ? 'Sending...' : 'Save & send ✉️'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* SMS modal — shown when no phone on file */}
      {smsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setSmsModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-gray-900">No phone number on file</h3>
                <p className="text-sm text-gray-600">Add {lead?.name?.split(' ')[0]}{"'s"} number to send by SMS.</p>
              </div>
            </div>
            <input
              type="tel"
              value={smsPhone}
              onChange={e => setSmsPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setSmsModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-3 rounded-xl">
                Cancel
              </button>
              <button
                onClick={() => { if (smsPhone) doSendSMS(smsPhone) }}
                disabled={!smsPhone}
                className="flex-grow bg-purple-600 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-50">
                Save & open SMS 💬
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit client modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setEditModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-5">Edit client details</h3>
            <div className="space-y-4">
              {[
                { field: 'name',        label: 'Name *',       placeholder: 'Client name',         type: 'text' },
                { field: 'phone',       label: 'Phone',        placeholder: '+1 555 000 0000',     type: 'tel' },
                { field: 'email',       label: 'Email',        placeholder: 'client@example.com',  type: 'email' },
                { field: 'job_type',    label: 'Job type',     placeholder: 'e.g. Boiler repair',  type: 'text' },
                { field: 'description', label: 'Description',  placeholder: 'Job details...',      type: 'text' },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input type={type} value={editForm[field] || ''}
                    onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={deleteLead}
                className="px-4 py-3 border border-red-200 text-red-500 font-semibold text-sm rounded-xl">
                🗑 Delete
              </button>
              <button onClick={() => setEditModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-3 rounded-xl">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={!editForm.name}
                className="flex-1 brand-gradient text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-50">
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
