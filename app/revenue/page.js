'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { formatCurrency } from '@/lib/trades'

export default function RevenuePage() {
  const { user, loading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [leads, setLeads] = useState([])
  const [view, setView] = useState('month') // month | year | all
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    const { data: biz } = await supabase
      .from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.replace('/onboarding'); return }
    setBusiness(biz)

    const { data } = await supabase
      .from('leads')
      .select('*, quotes(total, status, created_at)')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })

    setLeads(data || [])
    setDataLoading(false)
  }

  const fmt = n => formatCurrency(n, business?.currency)

  function filterLeads(leads) {
    const now = new Date()
    return leads.filter(l => {
      const d = new Date(l.created_at)
      if (view === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }
      if (view === 'year') {
        return d.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  const filtered = filterLeads(leads)
  const won    = filtered.filter(l => l.status === 'won')
  const lost   = filtered.filter(l => l.status === 'lost')
  const quoted = filtered.filter(l => ['quoted', 'won', 'lost'].includes(l.status))

  const wonVal    = won.reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)
  const quotedVal = quoted.reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)
  const lostVal   = lost.reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)
  const winRate   = quoted.length > 0 ? Math.round((won.length / quoted.length) * 100) : 0

  // Monthly breakdown for year view
  const monthlyData = view === 'year' ? Array.from({ length: 12 }, (_, i) => {
    const monthLeads = leads.filter(l => {
      const d = new Date(l.created_at)
      return d.getMonth() === i && d.getFullYear() === new Date().getFullYear()
    })
    const monthWon = monthLeads.filter(l => l.status === 'won')
    return {
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      won: monthWon.reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0),
      count: monthWon.length,
    }
  }) : []

  const maxMonthVal = Math.max(...monthlyData.map(m => m.won), 1)

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const viewLabel = view === 'month' ? 'This month' : view === 'year' ? 'This year' : 'All time'

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/')} className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-heading text-gray-900">Revenue</h1>
            <p className="text-xs text-gray-600">{business?.name}</p>
          </div>
        </div>
        {/* Period toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { k: 'month', label: 'This month' },
            { k: 'year',  label: 'This year' },
            { k: 'all',   label: 'All time' },
          ].map(t => (
            <button key={t.k} onClick={() => setView(t.k)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-20">

        {/* Won — hero number */}
        <div className="brand-gradient rounded-2xl p-6 text-white">
          <p className="text-sm font-medium opacity-80 mb-1">{viewLabel} · Won</p>
          <p className="text-4xl font-bold font-heading">{fmt(wonVal)}</p>
          <p className="text-sm opacity-70 mt-1">{won.length} {won.length === 1 ? 'job' : 'jobs'} closed</p>
        </div>

        {/* Win rate */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold font-heading text-gray-800">Win rate</p>
            <p className="text-2xl font-bold font-heading text-brand">{winRate}%</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full brand-gradient rounded-full transition-all"
              style={{ width: `${winRate}%` }} />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {won.length} won · {lost.length} lost · {quoted.length - won.length - lost.length} pending
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-600 mb-1">Quoted</p>
            <p className="text-xl font-bold font-heading text-gray-900">{fmt(quotedVal)}</p>
            <p className="text-xs text-gray-600 mt-0.5">{quoted.length} quotes sent</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-600 mb-1">Lost</p>
            <p className="text-xl font-bold font-heading text-gray-500">{fmt(lostVal)}</p>
            <p className="text-xs text-gray-600 mt-0.5">{lost.length} jobs lost</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-600 mb-1">New leads</p>
            <p className="text-xl font-bold font-heading text-gray-900">{filtered.length}</p>
            <p className="text-xs text-gray-600 mt-0.5">{viewLabel.toLowerCase()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-600 mb-1">Avg job value</p>
            <p className="text-xl font-bold font-heading text-gray-900">
              {won.length > 0 ? fmt(wonVal / won.length) : fmt(0)}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">per won job</p>
          </div>
        </div>

        {/* Monthly bar chart for year view */}
        {view === 'year' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm font-semibold font-heading text-gray-800 mb-4">Monthly won</p>
            <div className="flex items-end gap-1 h-24">
              {monthlyData.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full brand-gradient rounded-t-lg transition-all"
                    style={{ height: `${m.won > 0 ? Math.max(4, (m.won / maxMonthVal) * 80) : 4}px`,
                             opacity: m.won > 0 ? 1 : 0.15 }} />
                  <p className="text-xs text-gray-600">{m.month}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent won jobs */}
        {won.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-semibold font-heading text-gray-800">Won jobs</p>
            </div>
            {won.slice(0, 5).map(lead => (
              <div key={lead.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0"
                onClick={() => router.push(`/lead/${lead.id}`)}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-600">{lead.job_type || '—'}</p>
                </div>
                <p className="text-sm font-bold text-green-600">
                  {fmt(lead.quotes?.[0]?.total || 0)}
                </p>
              </div>
            ))}
          </div>
        )}

        {won.length === 0 && quoted.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-600 text-sm">No data for {viewLabel.toLowerCase()} yet.</p>
            <p className="text-gray-500 text-xs mt-1">Start sending quotes to see your revenue here.</p>
          </div>
        )}

      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
