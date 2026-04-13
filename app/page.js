'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
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
  const [leads, setLeads] = useState([])
  const [business, setBusiness] = useState(null)
  const [tab, setTab] = useState('new')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [copied, setCopied] = useState(false)
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
      .select('*, quotes(id,total,status)')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setDataLoading(false)
  }

  async function createLead(e) {
    e.preventDefault()
    if (!newName) return
    const { data } = await supabase
      .from('leads')
      .insert({ name: newName, phone: newPhone, business_id: business.id, status: 'new', source: 'manual' })
      .select().single()
    if (data) { setAddOpen(false); setNewName(''); setNewPhone(''); router.push(`/lead/${data.id}`) }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

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

        {/* Trial countdown */}
        {business?.subscription_status === 'trialing' && business?.trial_ends_at && (() => {
          const daysLeft = Math.max(0, Math.ceil((new Date(business.trial_ends_at) - new Date()) / 86400000))
          const pct = Math.round((daysLeft / 14) * 100)
          return (
            <Link href="/billing" className="block mb-3">
              <div className={`rounded-xl px-3 py-2.5 flex items-center justify-between ${
                daysLeft <= 3 ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'
              }`}>
                <div>
                  <p className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-red-700' : 'text-blue-700'}`}>
                    {daysLeft === 0 ? '⚠️ Trial expires today' :
                     daysLeft === 1 ? '⚠️ 1 day left in trial' :
                     `⏱ ${daysLeft} days left in free trial`}
                  </p>
                  <div className="mt-1 h-1 rounded-full bg-gray-200 w-32">
                    <div className={`h-1 rounded-full transition-all ${daysLeft <= 3 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  daysLeft <= 3 ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  Upgrade →
                </span>
              </div>
            </Link>
          )
        })()}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-heading text-gray-900">{business?.name}</h1>
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
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-600">Share to get new leads</p>
            <p className="text-xs font-medium text-gray-600 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/form/{business?.slug}
            </p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/form/${business?.slug}`); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
            className={`text-white text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0 transition-colors ${copied ? 'bg-green-500' : 'brand-gradient'}`}>
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
          <Link href="/clients"
            className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">
            👥 Clients
          </Link>
          <Link href="/rates"
            className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">
            ⚡ Rates
          </Link>
          <Link href="/settings"
            className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">
            👤 Profile
          </Link>
        </div>
      </div>

      {/* Add lead modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAddOpen(false)}>
          <form onSubmit={createLead} className="bg-white w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-5">New lead</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Customer name *" value={newName}
                onChange={e => setNewName(e.target.value)} required autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
              />
              <input type="tel" placeholder="Phone number" value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
              />
              <button type="submit" className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm">
                Create & build quote →
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
