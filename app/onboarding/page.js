'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TRADE_LIST } from '@/lib/trades'

const STEPS = ['Business', 'Location', 'Trade', 'Tax', 'Details']

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    country: 'PT',
    language: 'pt',
    currency: 'EUR',
    industry: '',
    vat_registered: false,
    vat_number: '',
    vat_rate: 23,
    phone: '',
    email: '',
    website: '',
    address: '',
    tagline: '',
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  async function finish() {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = slugify(form.name) + '-' + Math.random().toString(36).slice(2, 6)

    const { error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name: form.name,
      slug,
      country: form.country,
      language: form.language,
      currency: form.currency,
      industry: form.industry,
      vat_registered: form.vat_registered,
      vat_number: form.vat_number || null,
      vat_rate: form.vat_registered ? form.vat_rate : 0,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      address: form.address || null,
      tagline: form.tagline || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
  }

  const canProceed = [
    form.name.length > 1,
    true,
    form.industry !== '',
    true,
    true,
  ][step]

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="w-8 h-8 brand-gradient rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold font-heading">Q</span>
          </div>
          <div className="flex-1">
            <div className="flex gap-1">
              {STEPS.map((s, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-brand' : 'bg-gray-200'
                }`} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        {/* Step 0: Business name */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">
              What's your business called?
            </h2>
            <p className="text-gray-400 text-sm mb-8">This appears on all your quotes.</p>
            <input
              type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Mike's Plumbing"
              autoFocus
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        )}

        {/* Step 1: Country */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">
              Where are you based?
            </h2>
            <p className="text-gray-400 text-sm mb-8">Sets your currency and tax rules.</p>
            <div className="space-y-3">
              {[
                { value: 'PT', label: '🇵🇹 Portugal', currency: 'EUR', language: 'pt' },
                { value: 'US', label: '🇺🇸 United States', currency: 'USD', language: 'en' },
              ].map(opt => (
                <button key={opt.value}
                  onClick={() => { set('country', opt.value); set('currency', opt.currency); set('language', opt.language); if (opt.value === 'US') set('vat_rate', 0) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    form.country === opt.value
                      ? 'border-brand bg-brand-light'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="text-2xl">{opt.label.split(' ')[0]}</span>
                  <span className="font-semibold text-gray-900">{opt.label.split(' ').slice(1).join(' ')}</span>
                  {form.country === opt.value && (
                    <span className="ml-auto text-brand">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Trade/Industry */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">
              What type of work do you do?
            </h2>
            <p className="text-gray-400 text-sm mb-6">Loads the right quote templates for you.</p>
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {TRADE_LIST.map(t => (
                <button key={t.key}
                  onClick={() => set('industry', t.key)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    form.industry === t.key
                      ? 'border-brand bg-brand-light'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900 leading-tight block">
                    {t.name}
                  </span>
                  {form.industry === t.key && (
                    <span className="text-xs text-brand font-semibold mt-0.5 block">✓ Selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: VAT */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">
              {form.country === 'PT' ? 'Are you registered for IVA?' : 'Do you charge sales tax?'}
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              {form.country === 'PT'
                ? 'Affects how your quotes show totals.'
                : "We'll add a tax field to your quotes if needed."}
            </p>
            <div className="space-y-3">
              <button onClick={() => set('vat_registered', false)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  !form.vat_registered ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white'
                }`}>
                <p className="font-semibold text-gray-900">
                  {form.country === 'PT' ? 'No — not IVA registered' : 'No tax'}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">Quote shows clean total only</p>
              </button>
              <button onClick={() => set('vat_registered', true)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  form.vat_registered ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white'
                }`}>
                <p className="font-semibold text-gray-900">
                  {form.country === 'PT' ? 'Yes — IVA registered (23%)' : 'Yes — I charge sales tax'}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">Quote shows subtotal + tax + total</p>
              </button>
            </div>

            {form.vat_registered && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {form.country === 'PT' ? 'NIF / VAT Number' : 'Tax ID (optional)'}
                  </label>
                  <input type="text" value={form.vat_number}
                    onChange={e => set('vat_number', e.target.value)}
                    placeholder={form.country === 'PT' ? 'PT123456789' : 'EIN or tax ID'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                {form.country !== 'PT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax rate (%)</label>
                    <input type="number" value={form.vat_rate}
                      onChange={e => set('vat_rate', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 8.5"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Contact details */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">
              Your contact details
            </h2>
            <p className="text-gray-400 text-sm mb-6">Shown on every quote. All optional.</p>
            <div className="space-y-4">
              {[
                { field: 'phone', label: 'Phone number', placeholder: '+351 910 000 000', type: 'tel' },
                { field: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email' },
                { field: 'website', label: 'Website', placeholder: 'www.yourbusiness.com', type: 'url' },
                { field: 'address', label: 'Business address', placeholder: 'Street, City', type: 'text' },
                { field: 'tagline', label: 'Tagline (optional)', placeholder: 'e.g. Available 24/7', type: 'text' },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type={type} value={form[field]}
                    onChange={e => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-4 pb-8 pt-4 bg-white border-t border-gray-100 max-w-lg mx-auto w-full">
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={back}
              className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">
              Back
            </button>
          )}
          <button
            onClick={step === STEPS.length - 1 ? finish : next}
            disabled={!canProceed || loading}
            className="flex-1 brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Setting up...' : step === STEPS.length - 1 ? 'Start using Quotify →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
