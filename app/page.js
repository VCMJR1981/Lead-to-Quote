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
  lost:   { label:'Lost',   bg:'#FEF2F2', c:'#DC2626', dot:'#EF4444' },
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [leads, setLeads] = useState([])
  const [tab, setTab] = useState('new')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newJobType, setNewJobType] = useState('')
  const [copied, setCopied] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.replace('/onboarding'); return }
    setBusiness(biz)
    const { data } = await supabase.from('leads').select('*, quotes(id,total,status)').eq('business_id', biz.id).order('created_at', { ascending: false })
    setLeads(data || [])
    setDataLoading(false)
  }

  async function createLead(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const { data } = await supabase.from('leads').insert({
      business_id: business.id, name: newName.trim(),
      phone: newPhone.trim() || null, job_type: newJobType.trim() || null, status: 'new'
    }).select().single()
    if (data) { router.push(`/lead/${data.id}`) }
  }

  const fmt = n => formatCurrency(n, business?.currency)
  const filtered = leads.filter(l => l.status === tab)
  const tabs = ['new','quoted','won','lost']
  const isPremium = business?.subscription_status === 'active'

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-3 sticky top-0 z-10">
        {/* Upgrade nudge */}
        {!isPremium && (
          <Link href="/billing" className="block mb-3">
            <div className="bg-brand-light border border-brand/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-brand">Free plan · 5 quotes/month</p>
              <span className="text-xs font-bold text-white brand-gradient px-2 py-1 rounded-lg flex-shrink-0">Upgrade →</span>
            </div>
          </Link>
        )}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold font-heading text-gray-900">{business?.name}</h1>
            <p className="text-xs text-gray-600">{leads.length} leads total</p>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="brand-gradient text-white font-semibold text-sm px-4 py-2.5 rounded-xl">
            + New lead
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(t => {
            const count = leads.filter(l => l.status === t).length
            const st = STATUS[t]
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'text-white' : 'text-gray-600 bg-gray-100'}`}
                style={tab === t ? { backgroundColor: st.dot } : {}}>
                {st.label} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lead list */}
      <div className="px-4 py-4 space-y-3 pb-32">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">{tab === 'new' ? '📋' : tab === 'quoted' ? '📤' : tab === 'won' ? '🏆' : '😞'}</p>
            <p className="text-gray-600 text-sm">No {STATUS[tab].label.toLowerCase()} leads yet</p>
            {tab === 'new' && <button onClick={() => setAddOpen(true)} className="mt-3 text-brand text-sm font-semibold">+ Add your first lead</button>}
          </div>
        ) : filtered.map((lead, idx) => {
          const quote = lead.quotes?.[0]
          const st = STATUS[lead.status]
          const num = String(leads.findIndex(l => l.id === lead.id) + 1).padStart(3,'0')
          return (
            <div key={lead.id} onClick={() => router.push(`/lead/${lead.id}`)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm font-heading">{lead.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">#{num}</span>
                      <p className="font-semibold text-gray-900 font-heading truncate">{lead.name}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{lead.job_type || lead.phone || '—'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.c }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                    {st.label}
                  </span>
                  {quote?.total > 0 && (
                    <p className={`text-sm font-bold font-heading mt-1 ${lead.status === 'won' ? 'text-green-600' : 'text-gray-900'}`}>
                      {fmt(quote.total)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{timeAgo(lead.created_at)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8 z-10">
        <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex-1 min-w-[130px] bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-600 truncate">/{business?.slug}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/form/${business?.slug}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className={`text-white text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0 ${copied ? 'bg-green-500' : 'brand-gradient'}`}>
            {copied ? '✓' : 'Copy'}
          </button>
          <Link href="/revenue" className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">📊</Link>
          <Link href="/clients" className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">👥</Link>
          <Link href="/rates" className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">⚡</Link>
          <Link href="/settings" className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2.5 rounded-xl flex-shrink-0">⚙️</Link>
        </div>
      </div>

      {/* Add lead modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAddOpen(false)}>
          <form onSubmit={createLead} className="bg-white w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-5">New lead</h3>
            <div className="space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Client name *" autoFocus required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                placeholder="Phone number" type="tel"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
              <input value={newJobType} onChange={e => setNewJobType(e.target.value)}
                placeholder="Job type (e.g. Boiler repair)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setAddOpen(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">Cancel</button>
              <button type="submit" disabled={!newName.trim()}
                className="flex-1 brand-gradient text-white font-semibold py-3 rounded-xl disabled:opacity-50">
                Create & build quote →
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
