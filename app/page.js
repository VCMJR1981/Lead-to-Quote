'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { useBusinesses } from '@/lib/useBusinesses'
import { formatCurrency } from '@/lib/trades'

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

const STATUS = {
  new:    { label:'New',    bg:'#EFF6FF', c:'#2563EB', dot:'#3B82F6' },
  quoted: { label:'Quoted', bg:'#FFFBEB', c:'#B45309', dot:'#F59E0B' },
  won:    { label:'Won',    bg:'#F0FDF4', c:'#15803D', dot:'#22C55E' },
  lost:   { label:'Lost',   bg:'#F4F4F5', c:'#A1A1AA', dot:'#D4D4D8' },
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const { businesses, activeBusiness, switchBusiness, loading: bizLoading } = useBusinesses(user)
  const [leads, setLeads] = useState([])
  const [tab, setTab] = useState('new')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Reload leads when active business changes
  useEffect(() => {
    if (activeBusiness) fetchLeads(activeBusiness.id)
  }, [activeBusiness])

  async function fetchLeads(bizId) {
    setDataLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('*, quotes(id,total,status)')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setDataLoading(false)
  }

  const [repeatClient, setRepeatClient] = useState(null)

  async function checkRepeat(phone, name) {
    if (!phone && !name) return
    const { data } = await supabase
      .from('leads')
      .select('*, quotes(total)')
      .eq('business_id', activeBusiness?.id)
      .neq('status', 'new')
      .or(phone ? `phone.eq.${phone}` : `name.ilike.${name}`)
      .order('created_at', { ascending: false })
      .limit(1)
    if (data?.length > 0) {
      setRepeatClient(data[0])
    } else {
      setRepeatClient(null)
    }
  }

  async function createLead(e) {
    e.preventDefault()
    if (!newName || !activeBusiness) return
    const { data } = await supabase
      .from('leads')
      .insert({ name: newName, phone: newPhone, business_id: activeBusiness.id, status: 'new', source: 'manual' })
      .select().single()
    if (data) { setAddOpen(false); setNewName(''); setNewPhone(''); setRepeatClient(null); router.push(`/lead/${data.id}`) }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading || bizLoading || dataLoading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const business = activeBusiness
  const fmt = (n) => formatCurrency(n, business?.currency)
  const tabs = [
    { k:'new',    label:'New',    n: leads.filter(l=>l.status==='new').length },
    { k:'quoted', label:'Quoted', n: leads.filter(l=>l.status==='quoted').length },
    { k:'closed', label:'Closed', n: leads.filter(l=>['won','lost'].includes(l.status)).length },
  ]
  const filtered = leads.filter(l =>
    tab==='new' ? l.status==='new' :
    tab==='quoted' ? l.status==='quoted' :
    ['won','lost'].includes(l.status)
  )
  const wonVal  = leads.filter(l=>l.status==='won').reduce((s,l)=>s+(l.quotes?.[0]?.total||0),0)
  const quotVal = leads.filter(l=>['quoted','won'].includes(l.status)).reduce((s,l)=>s+(l.quotes?.[0]?.total||0),0)

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">

        {/* Free quota banner */}
        {business?.subscription_status !== 'active' && (() => {
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          return null // quota count loaded async — shown on lead page instead
        })()}

        {/* Upgrade nudge for free users */}
        {business?.subscription_status !== 'active' && (
          <Link href="/billing" className="block mb-3">
            <div className="bg-brand-light border border-brand/20 rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-brand">Free plan · 5 quotes/month</p>
                <p className="text-xs text-brand/70 mt-0.5">Upgrade for unlimited quotes & all features</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg brand-gradient text-white flex-shrink-0">
                Upgrade →
              </span>
            </div>
          </Link>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Business switcher */}
            {businesses.length > 1 ? (
              <button onClick={() => setSwitcherOpen(true)}
                className="flex items-center gap-2 group">
                <h1 className="text-xl font-bold font-heading text-gray-900 truncate">{business?.name}</h1>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  Switch ▾
                </span>
              </button>
            ) : (
              <h1 className="text-xl font-bold font-heading text-gray-900">{business?.name}</h1>
            )}
            <p className="text-xs text-gray-600 mt-0.5">Leads & Quotes</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAddOpen(true)}
              className="brand-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl">
              + New Lead
            </button>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#FAFAF9] rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-0.5">Quoted (month)</p>
            <p className="text-lg font-bold font-heading text-gray-900">{fmt(quotVal)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-500 mb-0.5">Won (month)</p>
            <p className="text-lg font-bold font-heading text-green-700">{fmt(wonVal)}</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab===t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}>
              {t.label}
              {t.n > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                  tab===t.k ? 'bg-brand text-white' : 'bg-gray-200 text-gray-600'
                }`}>{t.n}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      <div className="px-4 py-4 space-y-3 pb-40">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">{tab==='new'?'📋':tab==='quoted'?'📨':'🏆'}</div>
            <p className="text-gray-600 text-sm">
              {tab==='new'?'No new leads':tab==='quoted'?'No quotes sent yet':'No closed deals'}
            </p>
            {tab==='new' && (
              <button onClick={() => setAddOpen(true)} className="mt-4 text-brand text-sm font-semibold">
                + Add first lead
              </button>
            )}
          </div>
        ) : filtered.map((lead, idx) => {
          const quote = lead.quotes?.[0]
          const st = STATUS[lead.status] || STATUS.new
          // Client number based on position in full leads array
          const clientNum = String(leads.length - leads.findIndex(l => l.id === lead.id)).padStart(3, '0')
          return (
            <Link key={lead.id} href={`/lead/${lead.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{clientNum}
                      </span>
                      <h3 className="font-semibold text-gray-900 font-heading">{lead.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: st.bg, color: st.c }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                      {lead.viewed_at && (
                        <span className="text-xs text-blue-500 font-medium">👁 Seen</span>
                      )}
                    </div>
                    {lead.job_type && <p className="text-sm text-gray-700 truncate">{lead.job_type}</p>}
                    {lead.phone && <p className="text-xs text-gray-500 mt-0.5">{lead.phone}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {quote?.total ? (
                      <p className="font-bold text-gray-900 font-heading">{fmt(quote.total)}</p>
                    ) : (
                      <p className="text-xs font-semibold text-brand">Quote needed</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{timeAgo(lead.created_at)}</p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8 z-10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className="flex-1 min-w-[140px] bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-600">Share to get new leads</p>
            <p className="text-xs font-medium text-gray-600 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/form/{business?.slug}
            </p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/form/${business?.slug}`); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
            className={`text-white text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0 transition-colors ${copied ? 'bg-green-500' : 'brand-gradient'}`}>
            {copied ? '✓' : 'Copy'}
          </button>
          <Link href="/revenue" className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">
            📊
          </Link>
          <Link href="/clients" className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">
            👥
          </Link>
          <Link href="/rates" className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">
            ⚡
          </Link>
          <Link href="/settings" className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">
            ⚙️
          </Link>
        </div>
      </div>

      {/* Add lead modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => { setAddOpen(false); setRepeatClient(null) }}>
          <form onSubmit={createLead} className="bg-white w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-5">New lead</h3>

            {/* Repeat client flag */}
            {repeatClient && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
                <span className="text-lg flex-shrink-0">👋</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">You've worked with this client before</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Last job: {repeatClient.job_type || 'No job type'} ·{' '}
                    {repeatClient.quotes?.[0]?.total
                      ? formatCurrency(repeatClient.quotes[0].total, activeBusiness?.currency)
                      : 'No quote'} ·{' '}
                    Status: {repeatClient.status}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <input type="text" placeholder="Customer name *" value={newName}
                onChange={e => { setNewName(e.target.value); if (e.target.value.length > 2) checkRepeat(newPhone, e.target.value) }}
                required autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
              />
              <input type="tel" placeholder="Phone number" value={newPhone}
                onChange={e => { setNewPhone(e.target.value); if (e.target.value.length > 6) checkRepeat(e.target.value, newName) }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
              />
              <button type="submit" className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm">
                Create & build quote →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Business switcher modal */}
      {switcherOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setSwitcherOpen(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Your businesses</h3>
            <div className="space-y-2 mb-4">
              {businesses.map(biz => (
                <button key={biz.id}
                  onClick={() => { switchBusiness(biz); setSwitcherOpen(false) }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    biz.id === business?.id
                      ? 'border-brand bg-brand-light'
                      : 'border-gray-200'
                  }`}>
                  <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold font-heading">{biz.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold font-heading ${biz.id === business?.id ? 'text-brand' : 'text-gray-900'}`}>
                      {biz.name}
                    </p>
                    <p className="text-xs text-gray-600">{biz.industry} · {biz.currency}</p>
                  </div>
                  {biz.id === business?.id && (
                    <span className="text-brand text-sm font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSwitcherOpen(false); router.push('/onboarding') }}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3.5 text-sm font-semibold text-gray-600 hover:border-brand hover:text-brand transition-colors">
              + Add another business
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
