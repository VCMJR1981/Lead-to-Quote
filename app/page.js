'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/trades'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const STATUS = {
  new: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  quoted: { label: 'Quoted', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  won: { label: 'Won', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  lost: { label: 'Lost', bg: 'bg-gray-100', text: 'text-gray-400', dot: 'bg-gray-300' },
}

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('new')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', phone: '', job_type: '' })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses').select('*').eq('owner_id', user.id).single()
    if (!biz) { router.push('/onboarding'); return }
    setBusiness(biz)

    const { data } = await supabase
      .from('leads')
      .select('*, quotes(id, total, status)')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })

    setLeads(data || [])
    setLoading(false)
  }

  async function createManualLead(e) {
    e.preventDefault()
    if (!newLead.name) return
    const { data } = await supabase
      .from('leads')
      .insert({ ...newLead, business_id: business.id, status: 'new', source: 'manual' })
      .select().single()
    if (data) router.push(`/lead/${data.id}`)
  }

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const thisMonth = leads.filter(l => new Date(l.created_at) >= monthStart)
  const quotedVal = thisMonth.filter(l => ['quoted', 'won'].includes(l.status))
    .reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)
  const wonVal = thisMonth.filter(l => l.status === 'won')
    .reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)

  const tabs = [
    { key: 'new', label: 'New', count: leads.filter(l => l.status === 'new').length },
    { key: 'quoted', label: 'Quoted', count: leads.filter(l => l.status === 'quoted').length },
    { key: 'closed', label: 'Closed', count: leads.filter(l => ['won', 'lost'].includes(l.status)).length },
  ]

  const filtered = leads.filter(l =>
    tab === 'new' ? l.status === 'new' :
    tab === 'quoted' ? l.status === 'quoted' :
    ['won', 'lost'].includes(l.status)
  )

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-heading text-gray-900">{business?.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Leads & Quotes</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="brand-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            + New Lead
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#FAFAF9] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Quoted this month</p>
            <p className="text-lg font-bold font-heading text-gray-900">
              {formatCurrency(quotedVal, business?.currency)}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-500 mb-0.5">Won this month</p>
            <p className="text-lg font-bold font-heading text-green-700">
              {formatCurrency(wonVal, business?.currency)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                  tab === t.key ? 'bg-brand text-white' : 'bg-gray-200 text-gray-400'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      <div className="px-4 py-4 space-y-3 pb-32">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">
              {tab === 'new' ? '📋' : tab === 'quoted' ? '📨' : '🏆'}
            </div>
            <p className="text-gray-400 text-sm">
              {tab === 'new' ? 'No new leads yet' :
               tab === 'quoted' ? 'No quotes sent yet' : 'No closed deals yet'}
            </p>
            {tab === 'new' && (
              <button onClick={() => setShowAddModal(true)}
                className="mt-4 text-brand text-sm font-semibold">
                + Add first lead
              </button>
            )}
          </div>
        ) : filtered.map(lead => {
          const quote = lead.quotes?.[0]
          const st = STATUS[lead.status] || STATUS.new
          return (
            <Link key={lead.id} href={`/lead/${lead.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 font-heading">{lead.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{lead.job_type || 'Job type not set'}</p>
                    {lead.phone && <p className="text-xs text-gray-300 mt-0.5">{lead.phone}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {quote?.total ? (
                      <p className="font-bold text-gray-900 font-heading">
                        {formatCurrency(quote.total, business?.currency)}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-brand">Quote needed</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{timeAgo(lead.created_at)}</p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bottom bar — intake form link */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-safe z-10">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-400">Your intake form</p>
            <p className="text-xs font-medium text-gray-600 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/form/{business?.slug}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/form/${business?.slug}`)
              alert('Link copied! Share it on WhatsApp, Instagram or your website.')
            }}
            className="brand-gradient text-white text-xs font-semibold px-3 py-2.5 rounded-xl whitespace-nowrap">
            Copy link
          </button>
        </div>
      </div>

      {/* Add lead modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 pb-safe" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-5">New lead</h3>
            <form onSubmit={createManualLead} className="space-y-4">
              <input type="text" placeholder="Customer name *"
                value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))}
                required autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <input type="tel" placeholder="Phone number"
                value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <input type="text" placeholder="Job type (e.g. Boiler repair)"
                value={newLead.job_type} onChange={e => setNewLead(p => ({ ...p, job_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <button type="submit"
                className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm">
                Create lead & build quote →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
