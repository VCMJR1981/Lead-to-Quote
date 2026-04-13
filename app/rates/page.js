'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

export default function RatesPage() {
  const { user, loading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [rates, setRates] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  async function fetchData() {
    const { data: biz } = await supabase
      .from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.replace('/onboarding'); return }
    setBusiness(biz)

    // Load saved rates from localStorage (per business)
    const stored = localStorage.getItem(`rates_${biz.id}`)
    if (stored) {
      setRates(JSON.parse(stored))
    } else {
      // Default rates based on industry
      setRates([
        { id: '1', name: 'Labor (hourly)', unit_price: biz.currency === 'USD' ? 95 : 70 },
        { id: '2', name: 'Call-out fee', unit_price: biz.currency === 'USD' ? 75 : 50 },
        { id: '3', name: 'Parts & materials', unit_price: 0 },
      ])
    }
  }

  function addRate() {
    setRates(p => [...p, { id: Date.now().toString(), name: '', unit_price: 0 }])
    setSaved(false)
  }

  function updateRate(id, field, value) {
    setSaved(false)
    setRates(p => p.map(r => r.id !== id ? r : {
      ...r, [field]: field === 'name' ? value : (parseFloat(value) || 0)
    }))
  }

  function removeRate(id) {
    setSaved(false)
    setRates(p => p.filter(r => r.id !== id))
  }

  function saveRates() {
    setSaving(true)
    localStorage.setItem(`rates_${business.id}`, JSON.stringify(rates))
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => router.push('/'), 800)
    }, 400)
  }

  const sym = business?.currency === 'USD' ? '$' : '€'

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
          <button onClick={() => router.push('/')}
            className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold font-heading text-gray-900">My Saved Rates</h1>
            <p className="text-xs text-gray-600">Load into any quote with one tap</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-32">

        {/* Explanation */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
          <span className="text-xl flex-shrink-0">⚡</span>
          <p className="text-sm text-amber-800">
            Save your most common items here. When building a quote, tap <strong>"Load my rates"</strong> to drop them in instantly — then edit freely.
          </p>
        </div>

        {/* Rates table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_36px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Item</span>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Default {sym}</span>
            <span />
          </div>

          {/* Rows */}
          {rates.map((rate, i) => (
            <div key={rate.id}
              className={`grid grid-cols-[1fr_100px_36px] gap-2 px-4 py-3 items-center ${
                i < rates.length - 1 ? 'border-b border-gray-50' : ''
              }`}>
              <input
                value={rate.name}
                onChange={e => updateRate(rate.id, 'name', e.target.value)}
                placeholder="Item name"
                className="text-sm text-gray-900 bg-transparent focus:outline-none w-full"
              />
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-600">{sym}</span>
                <input
                  type="number" value={rate.unit_price}
                  onChange={e => updateRate(rate.id, 'unit_price', e.target.value)}
                  placeholder="0" min="0" step="0.01"
                  className="flex-1 text-sm font-medium text-gray-900 bg-transparent focus:outline-none w-full"
                />
              </div>
              <button onClick={() => removeRate(rate.id)}
                className="text-gray-500 hover:text-red-400 transition-colors flex items-center justify-center">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}

          <button onClick={addRate}
            className="w-full px-4 py-3 text-sm text-brand font-medium text-left border-t border-gray-50 hover:bg-brand-light transition-colors">
            + Add item
          </button>
        </div>

        <p className="text-xs text-gray-600 text-center">
          Set price to 0 for items you always adjust per job
        </p>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8">
        <button onClick={saveRates} disabled={saving}
          className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-60">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save my rates'}
        </button>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
