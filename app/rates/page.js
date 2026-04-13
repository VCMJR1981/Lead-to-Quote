'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { TRADE_LIST, formatCurrency } from '@/lib/trades'

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}` }

export default function RatesPage() {
  const { user, loading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [sections, setSections] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addTradeOpen, setAddTradeOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    const { data: biz } = await supabase
      .from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.replace('/onboarding'); return }
    setBusiness(biz)

    // Load from localStorage keyed by business
    const stored = localStorage.getItem(`rates_v2_${biz.id}`)
    if (stored) {
      setSections(JSON.parse(stored))
    } else {
      // Default: one section for their primary trade
      const tradeName = TRADE_LIST.find(t => t.key === biz.industry)?.name || 'General'
      setSections([{
        id: genId(),
        tradeKey: biz.industry || 'general',
        tradeName,
        rates: [
          { id: genId(), name: 'Labor (hourly)', unit_price: biz.currency === 'USD' ? 95 : 70 },
          { id: genId(), name: 'Call-out fee',   unit_price: biz.currency === 'USD' ? 75 : 50 },
          { id: genId(), name: 'Parts & materials', unit_price: 0 },
        ]
      }])
    }
  }

  function addTrade(tradeKey) {
    const tradeName = TRADE_LIST.find(t => t.key === tradeKey)?.name || tradeKey
    setSections(p => [...p, {
      id: genId(), tradeKey, tradeName,
      rates: [
        { id: genId(), name: 'Labor (hourly)', unit_price: business?.currency === 'USD' ? 95 : 70 },
        { id: genId(), name: 'Call-out fee',   unit_price: business?.currency === 'USD' ? 75 : 50 },
        { id: genId(), name: 'Parts & materials', unit_price: 0 },
      ]
    }])
    setSaved(false)
    setAddTradeOpen(false)
  }

  function removeSection(id) {
    if (!confirm('Remove this trade section?')) return
    setSections(p => p.filter(s => s.id !== id))
    setSaved(false)
  }

  function addRate(secId) {
    setSections(p => p.map(s => s.id !== secId ? s : {
      ...s, rates: [...s.rates, { id: genId(), name: '', unit_price: 0 }]
    }))
    setSaved(false)
  }

  function updateRate(secId, rateId, field, value) {
    setSaved(false)
    setSections(p => p.map(s => s.id !== secId ? s : {
      ...s, rates: s.rates.map(r => r.id !== rateId ? r : {
        ...r, [field]: field === 'name' ? value : (parseFloat(value) || 0)
      })
    }))
  }

  function removeRate(secId, rateId) {
    setSaved(false)
    setSections(p => p.map(s => s.id !== secId ? s : {
      ...s, rates: s.rates.filter(r => r.id !== rateId)
    }))
  }

  function saveRates() {
    setSaving(true)
    localStorage.setItem(`rates_v2_${business.id}`, JSON.stringify(sections))
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => router.push('/'), 800)
    }, 400)
  }

  const sym = business?.currency === 'USD' ? '$' : business?.currency === 'GBP' ? '£' : '€'
  const usedKeys = sections.map(s => s.tradeKey)
  const availableTrades = TRADE_LIST.filter(t => !usedKeys.includes(t.key))

  if (loading || !business) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-heading text-gray-900">My Saved Rates</h1>
            <p className="text-xs text-gray-600">Load into any quote with one tap</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto pb-32">

        {/* Explanation */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">⚡</span>
          <p className="text-sm text-amber-800">
            Save your standard prices here per trade. When building a quote, tap <strong>"Load my rates"</strong> to drop them in instantly.
          </p>
        </div>

        {/* Trade sections */}
        {sections.map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="font-semibold text-sm font-heading text-gray-800">{section.tradeName}</p>
              {sections.length > 1 && (
                <button onClick={() => removeSection(section.id)}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                  Remove
                </button>
              )}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_100px_36px] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price {sym}</span>
              <span />
            </div>

            {/* Rate rows */}
            {section.rates.map(rate => (
              <div key={rate.id}
                className="grid grid-cols-[1fr_100px_36px] gap-2 px-4 py-3 items-center border-b border-gray-50 last:border-0">
                <input
                  value={rate.name}
                  onChange={e => updateRate(section.id, rate.id, 'name', e.target.value)}
                  placeholder="Item name"
                  className="text-sm text-gray-900 bg-transparent focus:outline-none w-full placeholder-gray-400"
                />
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1.5">
                  <span className="text-xs text-gray-500">{sym}</span>
                  <input
                    type="number" value={rate.unit_price}
                    onChange={e => updateRate(section.id, rate.id, 'unit_price', e.target.value)}
                    placeholder="0" min="0" step="0.01"
                    className="flex-1 text-sm font-medium text-gray-900 bg-transparent focus:outline-none w-full"
                  />
                </div>
                <button onClick={() => removeRate(section.id, rate.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center">
                  <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}

            <button onClick={() => addRate(section.id)}
              className="w-full px-4 py-3 text-sm text-brand font-medium text-left border-t border-gray-50 hover:bg-brand-light transition-colors">
              + Add item
            </button>
          </div>
        ))}

        {/* Add trade section */}
        {availableTrades.length > 0 && (
          <button onClick={() => setAddTradeOpen(true)}
            className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm font-medium text-gray-600 hover:border-brand hover:text-brand transition-colors">
            + Add another trade
          </button>
        )}

        <p className="text-xs text-gray-500 text-center">
          Set price to 0 for items you always price differently per job
        </p>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8">
        <button onClick={saveRates} disabled={saving}
          className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-60">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save my rates'}
        </button>
      </div>

      {/* Add trade modal */}
      {addTradeOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAddTradeOpen(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Add trade</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableTrades.map(t => (
                <button key={t.key} onClick={() => addTrade(t.key)}
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
