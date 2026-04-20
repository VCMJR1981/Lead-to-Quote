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
  if (s < 86400 * 30) return `${Math.floor(s/86400)}d ago`
  return new Date(d).toLocaleDateString()
}

export default function ClientsPage() {
  const { user, loading } = useAuth()
  const [leads, setLeads] = useState([])
  const [business, setBusiness] = useState(null)
  const [search, setSearch] = useState('')
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
      .select('*, quotes(id, total, status)')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })

    setLeads(data || [])
    setDataLoading(false)
  }

  async function deleteLead(id, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this client and their quote? This cannot be undone.')) return
    await supabase.from('leads').delete().eq('id', id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const fmt = n => formatCurrency(n, business?.currency)

  const STATUS_COLOR = {
    new:    { bg: '#EFF6FF', c: '#2563EB', dot: '#3B82F6' },
    quoted: { bg: '#FFFBEB', c: '#B45309', dot: '#F59E0B' },
    won:    { bg: '#F0FDF4', c: '#15803D', dot: '#22C55E' },
    lost:   { bg: '#F4F4F5', c: '#A1A1AA', dot: '#D4D4D8' },
  }

  // Group leads by phone or email to detect repeat clients
  // Show most recent lead per client, with previous jobs count
  const clientMap = {}
  leads.forEach(lead => {
    const key = lead.phone || lead.email || lead.id
    if (!clientMap[key]) {
      clientMap[key] = { latest: lead, allJobs: [lead] }
    } else {
      clientMap[key].allJobs.push(lead)
      // Keep most recent as the "latest"
      if (new Date(lead.created_at) > new Date(clientMap[key].latest.created_at)) {
        clientMap[key].latest = lead
      }
    }
  })
  const clients = Object.values(clientMap)
    .sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at))

  const filtered = clients.filter(({ latest: l }) =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.job_type?.toLowerCase().includes(search.toLowerCase())
  )

  const totalWon = leads
    .filter(l => l.status === 'won')
    .reduce((s, l) => s + (l.quotes?.[0]?.total || 0), 0)

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

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
            <h1 className="text-lg font-bold font-heading text-gray-900">Clients</h1>
            <p className="text-xs text-gray-600">{clients.length} clients · {fmt(totalWon)} won</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path d="M7 12A5 5 0 107 2a5 5 0 000 10zM14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-600 text-sm">
              {search ? 'No clients match your search' : 'No clients yet'}
            </p>
          </div>
        ) : filtered.map(({ latest: lead, allJobs }, idx) => {
          const quote = lead.quotes?.[0]
          const st = STATUS_COLOR[lead.status] || STATUS_COLOR.new
          const clientNum = String(clients.length - idx).padStart(3, '0')
          const wonJobs = allJobs.filter(j => j.status === 'won')
          const totalSpent = wonJobs.reduce((s, j) => s + (j.quotes?.[0]?.total || 0), 0)
          const previousJobs = allJobs.length - 1

          return (
            <Link key={lead.id} href={`/lead/${lead.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm font-heading">
                      {lead.name?.[0]?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{clientNum}
                      </span>
                      <h3 className="font-semibold text-gray-900 font-heading">{lead.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: st.bg, color: st.c }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {lead.status === 'new' ? 'New' : lead.status === 'quoted' ? 'Quoted' : lead.status === 'won' ? 'Won' : 'Lost'}
                      </span>
                      {previousJobs > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                          🔁 {previousJobs} previous job{previousJobs > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {lead.phone && (
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          📞 {lead.phone}
                        </span>
                      )}
                      {lead.email && (
                        <span className="text-xs text-gray-600 flex items-center gap-1 truncate max-w-[180px]">
                          ✉️ {lead.email}
                        </span>
                      )}
                    </div>

                    {lead.job_type && (
                      <p className="text-xs text-gray-600 mt-1">{lead.job_type}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{timeAgo(lead.created_at)}</span>
                      <div className="text-right">
                        {totalSpent > 0 && (
                          <p className="text-sm font-bold font-heading text-green-600">
                            {fmt(totalSpent)} total
                          </p>
                        )}
                        {quote?.total > 0 && lead.status !== 'won' && (
                          <p className="text-sm font-bold font-heading text-gray-900">
                            {fmt(quote.total)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => deleteLead(lead.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                      <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
