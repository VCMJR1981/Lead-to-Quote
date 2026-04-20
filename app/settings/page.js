'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { TRADE_LIST } from '@/lib/trades'

const COUNTRY_CONFIG = {
  US: { label:'United States', flag:'🇺🇸', currency:'USD', taxLabel:'Sales Tax', taxRate:0, stripe:'2.9% + $0.30', bank:'ACH Bank Transfer' },
  PT: { label:'Portugal', flag:'🇵🇹', currency:'EUR', taxLabel:'IVA', taxRate:23, stripe:'1.5% + €0.25', bank:'IBAN Transfer' },
  UK: { label:'United Kingdom', flag:'🇬🇧', currency:'GBP', taxLabel:'VAT', taxRate:20, stripe:'1.5% + £0.20', bank:'Sort Code Transfer' },
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [connectLoading, setConnectLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (user) fetchBusiness() }, [user])

  async function fetchBusiness() {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (!data) { router.replace('/onboarding'); return }
    setBusiness(data)
  }

  function set(field, value) { setSaved(false); setBusiness(prev => ({ ...prev, [field]: value })) }

  async function save() {
    setSaving(true); setError('')
    let logo_url = business.logo_url
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('business-assets').upload(path, logoFile, { upsert: true })
      if (uploadError) { setError(`Logo upload failed: ${uploadError.message}`); setSaving(false); return }
      const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
      logo_url = data.publicUrl
    }
    const cfg = COUNTRY_CONFIG[business.country]
    const { error } = await supabase.from('businesses').update({
      name: business.name, phone: business.phone, email: business.email,
      address: business.address, tagline: business.tagline, logo_url,
      industry: business.industry, deposit_pct: business.deposit_pct,
      payment_methods: business.payment_methods, bank_detail: business.bank_detail,
      vat_registered: business.vat_registered, vat_number: business.vat_number,
      vat_rate: business.vat_registered ? (cfg?.taxRate || 0) : 0,
    }).eq('id', business.id)
    if (error) { setError(`Save failed: ${error.message}`); setSaving(false); return }
    setSaving(false); setSaved(true)
  }

  function startConnect() {
    setConnectLoading(true)
    if (!business?.id) { setConnectLoading(false); return }
    const p = new URLSearchParams({
      response_type: 'code', client_id: 'ca_UMkrkNLRrUy02czI9h2gAmRgOicRJ4uD',
      scope: 'read_write', redirect_uri: `${window.location.origin}/api/stripe/connect/callback`,
      state: business.id,
    })
    window.location.href = `https://connect.stripe.com/oauth/authorize?${p.toString()}`
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const cfg = business ? COUNTRY_CONFIG[business.country] : null

  if (authLoading || !business) return <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-600 p-1 -ml-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-lg font-bold font-heading text-gray-900 flex-1">Settings</h1>
          <button onClick={save} disabled={saving}
            className="brand-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50">
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto pb-20">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>}

        {/* Business details */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Business Details</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Business logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 bg-white">
                  {(logoPreview || business.logo_url) ? (
                    <img src={logoPreview || business.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <div>
                  <input type="file" accept="image/*" id="logo-upload" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); setSaved(false) }} />
                  <label htmlFor="logo-upload" className="inline-block cursor-pointer bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:border-brand hover:text-brand transition-colors">
                    {(logoPreview || business.logo_url) ? 'Change logo' : 'Upload logo'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG or JPG · Appears on all quotes</p>
                </div>
              </div>
            </div>
            {[
              { field:'name', label:'Business name', placeholder:"Mike's Plumbing", type:'text' },
              { field:'phone', label:'Phone number', placeholder:'+1 555 000 0000', type:'tel' },
              { field:'email', label:'Email address', placeholder:'you@example.com', type:'email' },
              { field:'address', label:'Address', placeholder:'Street, City', type:'text' },
              { field:'tagline', label:'Tagline', placeholder:'Available 24/7', type:'text' },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <input type={type} value={business[field] || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Trade</label>
              <select value={business.industry || ''} onChange={e => set('industry', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand bg-white">
                {TRADE_LIST.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Payment settings */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Payment Settings</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Default deposit</label>
              <div className="flex gap-2">
                {[0,25,30,50].map(pct => (
                  <button key={pct} onClick={() => set('deposit_pct', pct)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${business.deposit_pct === pct ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-600'}`}>
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Payment methods</label>
              <div className="space-y-2">
                {[
                  { key:'bank', label:'Bank Transfer', icon:'🏦' },
                  { key:'card', label:`Card (Stripe) · ${cfg?.stripe || ''}`, icon:'💳' },
                  { key:'cash', label:'Cash', icon:'💵' },
                ].map(m => (
                  <button key={m.key} onClick={() => { const methods = business.payment_methods || []; set('payment_methods', methods.includes(m.key) ? methods.filter(x => x !== m.key) : [...methods, m.key]) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${(business.payment_methods || []).includes(m.key) ? 'border-brand bg-brand-light' : 'border-gray-200'}`}>
                    <span className="text-lg">{m.icon}</span>
                    <span className={`text-sm font-semibold flex-1 ${(business.payment_methods || []).includes(m.key) ? 'text-brand' : 'text-gray-700'}`}>{m.label}</span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${(business.payment_methods || []).includes(m.key) ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                      {(business.payment_methods || []).includes(m.key) && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Bank details (shown on quotes)</label>
              <textarea value={business.bank_detail || ''} onChange={e => set('bank_detail', e.target.value)} rows={2}
                placeholder="IBAN: PT50 0000 0000 0000 0000 0000 0" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand resize-none" />
            </div>
          </div>
        </div>

        {/* Tax */}
        {cfg?.taxRate > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Tax / {cfg.taxLabel}</p>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => set('vat_registered', false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${!business.vat_registered ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-600'}`}>Not registered</button>
                <button onClick={() => set('vat_registered', true)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${business.vat_registered ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-600'}`}>Registered ({cfg.taxRate}%)</button>
              </div>
              {business.vat_registered && (
                <input type="text" value={business.vat_number || ''} onChange={e => set('vat_number', e.target.value)}
                  placeholder={business.country === 'PT' ? 'NIF: PT123456789' : 'VAT number'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
              )}
            </div>
          </div>
        )}

        {/* Stripe Connect */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Receive Card Payments</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            {business.stripe_connect_onboarded ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#635BFF' }}>
                  <span className="text-white font-black text-base">S</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Stripe connected ✓</p>
                  <p className="text-xs text-gray-600 mt-0.5">Clients can pay by card. Fee added to their total.</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#635BFF' }}>
                    <span className="text-white font-black text-base">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Connect Stripe</p>
                    <p className="text-xs text-gray-600 mt-0.5">Accept card payments from clients. Money goes directly to your bank account.</p>
                  </div>
                </div>
                <button onClick={startConnect} disabled={connectLoading}
                  className="w-full text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
                  style={{ background:'#635BFF' }}>
                  {connectLoading ? 'Redirecting...' : 'Connect with Stripe →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Account</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <Link href="/billing" className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-700">Subscription & billing</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <div className="border-t border-gray-100" />
            <button onClick={signOut} className="w-full text-left text-sm font-medium text-red-500 py-1">Sign out</button>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
