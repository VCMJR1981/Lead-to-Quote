'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { TRADE_LIST } from '@/lib/trades'

const COUNTRY_CONFIG = {
  US: { label: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', stripe: '2.9% + $0.30', taxLabel: 'Sales Tax' },
  PT: { label: 'Portugal', flag: '🇵🇹', currency: 'EUR', symbol: '€', stripe: '1.5% + €0.25', taxLabel: 'IVA', taxRate: 23 },
  UK: { label: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', stripe: '1.5% + £0.20', taxLabel: 'VAT', taxRate: 20 },
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (user) fetchBusiness() }, [user])

  async function fetchBusiness() {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
    if (!data) { router.replace('/onboarding'); return }
    setBusiness(data)
  }

  function set(field, value) {
    setSaved(false)
    setBusiness(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    setSaving(true)
    setError('')

    let logo_url = business.logo_url
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(path, logoFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
        logo_url = data.publicUrl
      }
    }

    const { error } = await supabase.from('businesses').update({
      name: business.name,
      phone: business.phone,
      email: business.email,
      address: business.address,
      tagline: business.tagline,
      logo_url,
      industry: business.industry,
      deposit_pct: business.deposit_pct,
      payment_methods: business.payment_methods,
      bank_detail: business.bank_detail,
      vat_registered: business.vat_registered,
      vat_number: business.vat_number,
      vat_rate: business.vat_registered ? (COUNTRY_CONFIG[business.country]?.taxRate || 0) : 0,
    }).eq('id', business.id)

    if (error) { setError(error.message); setSaving(false); return }
    setSaving(false)
    setSaved(true)
  }

  async function signOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const cfg = business ? COUNTRY_CONFIG[business.country] : null

  if (authLoading || !business) return (
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
          <div>
            <h1 className="text-lg font-bold font-heading text-gray-900">Settings</h1>
            <p className="text-xs text-gray-600">Business profile & preferences</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto pb-36">

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>}

        {/* Business details */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Business Details</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">

            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Business logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50">
                  {(logoPreview || business.logo_url) ? (
                    <img src={logoPreview || business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <div>
                  <input type="file" accept="image/*" id="logo-upload" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setLogoFile(file)
                      setLogoPreview(URL.createObjectURL(file))
                      setSaved(false)
                    }}
                  />
                  <label htmlFor="logo-upload"
                    className="inline-block cursor-pointer bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:border-brand hover:text-brand transition-colors">
                    {(logoPreview || business.logo_url) ? 'Change logo' : 'Upload logo'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG or JPG · Appears on all quotes</p>
                </div>
              </div>
            </div>
            {[
              { field: 'name',    label: 'Business name',  placeholder: "Mike's Plumbing",  type: 'text' },
              { field: 'phone',   label: 'Phone number',   placeholder: '+1 555 000 0000',  type: 'tel' },
              { field: 'email',   label: 'Email address',  placeholder: 'you@example.com',  type: 'email' },
              { field: 'address', label: 'Address',        placeholder: 'Street, City',     type: 'text' },
              { field: 'tagline', label: 'Tagline',        placeholder: 'Available 24/7',   type: 'text' },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <input type={type} value={business[field] || ''}
                  onChange={e => set(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Trade / Industry</label>
              <select value={business.industry || ''} onChange={e => set('industry', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand bg-white">
                {TRADE_LIST.map(t => (
                  <option key={t.key} value={t.key}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payment policy */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Payment Policy</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">

            {/* Deposit % */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Default deposit upfront</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 25, 30, 50].map(pct => (
                  <button key={pct} onClick={() => set('deposit_pct', pct)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      business.deposit_pct === pct
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-gray-200 text-gray-600'
                    }`}>
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment methods */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Accepted payment methods</label>
              <div className="space-y-2">
                {[
                  { key: 'bank', icon: '🏦', label: 'Bank Transfer' },
                  { key: 'card', icon: '💳', label: `Card (Stripe) · ${cfg?.stripe} fee to client` },
                  { key: 'cash', icon: '💵', label: 'Cash on the day' },
                ].map(m => (
                  <button key={m.key}
                    onClick={() => set('payment_methods',
                      (business.payment_methods || []).includes(m.key)
                        ? (business.payment_methods || []).filter(x => x !== m.key)
                        : [...(business.payment_methods || []), m.key]
                    )}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      (business.payment_methods || []).includes(m.key)
                        ? 'border-brand bg-brand-light'
                        : 'border-gray-200'
                    }`}>
                    <span className="text-lg">{m.icon}</span>
                    <p className={`text-sm font-semibold flex-1 ${
                      (business.payment_methods || []).includes(m.key) ? 'text-brand' : 'text-gray-700'
                    }`}>{m.label}</p>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      (business.payment_methods || []).includes(m.key) ? 'bg-brand border-brand' : 'border-gray-300'
                    }`}>
                      {(business.payment_methods || []).includes(m.key) && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank details */}
            {(business.payment_methods || []).includes('bank') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Bank account details</label>
                <input type="text" value={business.bank_detail || ''}
                  onChange={e => set('bank_detail', e.target.value)}
                  placeholder={
                    business.country === 'PT' ? 'PT50 0010 0000 0000 1234 5' :
                    business.country === 'UK' ? '20-00-00 / 12345678' :
                    'Routing: 021000021 / Acct: 1234567890'
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                />
                <p className="text-xs text-gray-600 mt-1">Shown on quotes so clients can transfer directly.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tax */}
        {cfg?.taxRate && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Tax</p>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Registered for {cfg.taxLabel}?
                </label>
                <div className="flex gap-2">
                  <button onClick={() => set('vat_registered', false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      !business.vat_registered ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-600'
                    }`}>No</button>
                  <button onClick={() => set('vat_registered', true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      business.vat_registered ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-600'
                    }`}>Yes ({cfg.taxRate}%)</button>
                </div>
              </div>
              {business.vat_registered && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {business.country === 'PT' ? 'NIF' : 'Tax number'}
                  </label>
                  <input type="text" value={business.vat_number || ''}
                    onChange={e => set('vat_number', e.target.value)}
                    placeholder={business.country === 'PT' ? 'PT123456789' : 'VAT number'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Account</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Signed in as</p>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <button onClick={() => router.push('/onboarding')}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl">
                + Add business
              </button>
              <button onClick={() => router.push('/billing')}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl">
                💳 Subscription
              </button>
              <button onClick={signOut} disabled={signingOut}
                className="flex-1 border border-red-100 text-red-500 text-sm font-semibold py-2.5 rounded-xl">
                {signingOut ? '...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8">
        <button onClick={save} disabled={saving}
          className="w-full brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-60">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
