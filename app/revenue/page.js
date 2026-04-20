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
  const [view, setView] = useState('month')
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.replace('/onboarding'); return }
    setBusiness(biz)
    const { data } = await supabase.from('leads').select('*, quotes(total, status, sent_at)').eq('business_id', biz.id).order('created_at', { ascending: false })
    setLeads(data || [])
    setDataLoading(false)
  }

  const fmt = n => formatCurrency(n, business?.currency)

  function filter(leads) {
    const now = new Date()
    return leads.filter(l => {
      const d = new Date(l.created_at)
      if (view === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (view === 'year') return d.getFullYear() === now.getFullYear()
      return true
    })
  }

  const f = filter(leads)
  const won = f.filter(l => l.status === 'won')
  const lost = f.filter(l => l.status === 'lost')
  const quoted = f.filter(l => ['quoted','won','lost'].includes(l.status))
  const wonVal = won.reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)
  const quotedVal = quoted.reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)
  const winRate = quoted.length > 0 ? Math.round(won.length / quoted.length * 100) : 0

  const monthlyData = view === 'year' ? Array.from({ length: 12 }, (_, i) => {
    const ml = leads.filter(l => { const d = new Date(l.created_at); return d.getMonth() === i && d.getFullYear() === new Date().getFullYear() && l.status === 'won' })
    return { month: new Date(2024, i).toLocaleString('default', { month: 'short' }), val: ml.reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0) }
  }) : []
  const maxVal = Math.max(...monthlyData.map(m => m.val), 1)

  if (loading || dataLoading) return <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/')} className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-lg font-bold font-heading text-gray-900 flex-1">Revenue</h1>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[['month','This month'],['year','This year'],['all','All time']].map(([k,l]) => (
            <button key={k} onClick={() => setView(k)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${view === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-20">
        {/* Hero */}
        <div className="brand-gradient rounded-2xl p-6 text-white">
          <p className="text-sm font-medium opacity-80 mb-1">{view === 'month' ? 'This month' : view === 'year' ? 'This year' : 'All time'} · Won</p>
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
            <div className="h-full brand-gradient rounded-full" style={{ width:`${winRate}%` }} />
          </div>
          <p className="text-xs text-gray-600 mt-2">{won.length} won · {lost.length} lost · {quoted.length - won.length - lost.length} pending</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:'Quoted', val:fmt(quotedVal), sub:`${quoted.length} quotes sent` },
            { label:'Lost', val:fmt(lost.reduce((s,l) => s+(l.quotes?.[0]?.total||0),0)), sub:`${lost.length} jobs lost` },
            { label:'New leads', val:f.length, sub:'total this period' },
            { label:'Avg job value', val:won.length > 0 ? fmt(wonVal/won.length) : fmt(0), sub:'per won job' },
          ].map(({ label, val, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-600 mb-1">{label}</p>
              <p className="text-xl font-bold font-heading text-gray-900">{val}</p>
              <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        {view === 'year' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm font-semibold font-heading text-gray-800 mb-4">Monthly won</p>
            <div className="flex items-end gap-1 h-24">
              {monthlyData.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full brand-gradient rounded-t-lg transition-all" style={{ height:`${m.val > 0 ? Math.max(4, m.val/maxVal*80) : 4}px`, opacity: m.val > 0 ? 1 : 0.15 }} />
                  <p className="text-xs text-gray-600">{m.month}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Won jobs */}
        {won.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50"><p className="text-sm font-semibold font-heading text-gray-800">Won jobs</p></div>
            {won.slice(0,5).map(lead => (
              <div key={lead.id} onClick={() => router.push(`/lead/${lead.id}`)} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer">
                <div><p className="text-sm font-medium text-gray-900">{lead.name}</p><p className="text-xs text-gray-600">{lead.job_type || '—'}</p></div>
                <p className="text-sm font-bold text-green-600">{fmt(lead.quotes?.[0]?.total || 0)}</p>
              </div>
            ))}
          </div>
        )}

        {won.length === 0 && quoted.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-600 text-sm">No data yet. Start sending quotes to see revenue.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
