'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { TRADE_LIST } from '@/lib/trades'

const STEPS = ['Account', 'Country', 'Trade', 'Payments', 'Details']

const COUNTRY_CONFIG = {
  US: { label: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', language: 'en',
    stripe: '2.9% + $0.30', tax: false, bank: 'ACH Bank Transfer', phone: '+1 555 000 0000' },
  PT: { label: 'Portugal', flag: '🇵🇹', currency: 'EUR', symbol: '€', language: 'pt',
    stripe: '1.5% + €0.25', tax: true, taxRate: 23, taxLabel: 'IVA', bank: 'IBAN Transfer', phone: '+351 910 000 000' },
  UK: { label: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', language: 'en',
    stripe: '1.5% + £0.20', tax: true, taxRate: 20, taxLabel: 'VAT', bank: 'Sort Code Transfer', phone: '+44 7700 000000' },
}

function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', tagline: '',
    country: null,
    industry: '',
    deposit_pct: 30,
    payment_methods: ['bank', 'card'],
    bank_detail: '',
    vat_registered: false,
    vat_number: '',
  })

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const cfg = form.country ? COUNTRY_CONFIG[form.country] : null

  const canProceed = [
    true,                         // Step 0: account (already logged in)
    form.country !== null,        // Step 1: country
    form.industry !== '',         // Step 2: trade
    true,                         // Step 3: payments
    form.name.length > 1,         // Step 4: details
  ][step]

  async function finish() {
    setSaving(true)
    setError('')
    const slug = slugify(form.name) + '-' + Math.random().toString(36).slice(2, 6)
    const { error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name: form.name,
      slug,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      tagline: form.tagline || null,
      country: form.country,
      language: cfg?.language || 'en',
      currency: cfg?.currency || 'USD',
      industry: form.industry,
      deposit_pct: form.deposit_pct,
      payment_methods: form.payment_methods,
      bank_detail: form.bank_detail || null,
      vat_registered: form.vat_registered,
      vat_number: form.vat_number || null,
      vat_rate: form.vat_registered ? (cfg?.taxRate || 0) : 0,
    })
    if (error) { setError(error.message); setSaving(false); return }
    router.push('/')
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">

      {/* Header / progress */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="w-8 h-8 brand-gradient rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold font-heading">L2Q</span>
          </div>
          <div className="flex-1">
            <div className="flex gap-1 mb-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full overflow-y-auto">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}

        {/* ── Step 0: Account info ── */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-400 text-sm mb-8">
              You're signed in as <strong>{user?.email}</strong>. Let's set up your business in a few steps.
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              {[
                { icon: '🌍', text: 'Choose your country — sets currency, tax & bank format' },
                { icon: '🔨', text: 'Pick your trade — loads the right quote templates' },
                { icon: '💳', text: 'Set your payment policy — deposit %, bank details' },
                { icon: '📋', text: 'Add your business details — appears on every quote' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-sm text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Country ── */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">Where do you work?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Sets your currency, tax rules, bank format, and Stripe card fees automatically.
            </p>
            <div className="space-y-3">
              {Object.entries(COUNTRY_CONFIG).map(([key, c]) => (
                <button key={key} onClick={() => set('country', key)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    form.country === key ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white'
                  }`}>
                  <span className="text-2xl flex-shrink-0">{c.flag}</span>
                  <div className="flex-1">
                    <p className={`font-semibold font-heading ${form.country === key ? 'text-brand' : 'text-gray-900'}`}>
                      {c.label}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      {[`${c.symbol} ${c.currency}`, `Stripe ${c.stripe}`,
                        c.tax ? `${c.taxLabel} ${c.taxRate}%` : 'No VAT', c.bank
                      ].map(tag => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          form.country === key ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'
                        }`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  {form.country === key && (
                    <div className="w-6 h-6 brand-gradient rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Trade ── */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">What type of work do you do?</h2>
            <p className="text-gray-400 text-sm mb-6">Loads the right quote templates for you.</p>
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {TRADE_LIST.map(t => (
                <button key={t.key} onClick={() => set('industry', t.key)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    form.industry === t.key ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white'
                  }`}>
                  <span className={`text-sm font-medium block leading-tight ${
                    form.industry === t.key ? 'text-brand' : 'text-gray-900'
                  }`}>{t.name}</span>
                  {form.industry === t.key && (
                    <span className="text-xs text-brand font-semibold mt-0.5 block">✓ Selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Payments ── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">Payment policy</h2>
            <p className="text-gray-400 text-sm mb-6">
              These defaults apply to every quote. You can override them per quote anytime.
            </p>

            {/* Deposit % */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <p className="text-sm font-semibold font-heading text-gray-700 mb-1">Default deposit upfront</p>
              <p className="text-xs text-gray-400 mb-3">How much do you typically ask upfront before starting?</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 25, 30, 50].map(pct => (
                  <button key={pct} onClick={() => set('deposit_pct', pct)}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.deposit_pct === pct
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-gray-200 text-gray-400'
                    }`}>
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
              {form.deposit_pct > 0 && (
                <p className="text-xs text-brand mt-2 font-medium">
                  Example: on a {cfg?.symbol}1,000 job → {cfg?.symbol}{(1000 * form.deposit_pct / 100).toFixed(0)} deposit upfront
                </p>
              )}
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <p className="text-sm font-semibold font-heading text-gray-700 mb-3">Accepted payment methods</p>
              <div className="space-y-2">
                {[
                  { key: 'bank', icon: '🏦', label: 'Bank Transfer', sub: `${cfg?.bank || 'Bank'} · No fee for client` },
                  { key: 'card', icon: '💳', label: 'Card (Stripe)', sub: `${cfg?.stripe || '2.9% + $0.30'} · Fee paid by client` },
                  { key: 'cash', icon: '💵', label: 'Cash on the day', sub: '' },
                ].map(m => (
                  <button key={m.key}
                    onClick={() => set('payment_methods',
                      form.payment_methods.includes(m.key)
                        ? form.payment_methods.filter(x => x !== m.key)
                        : [...form.payment_methods, m.key]
                    )}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      form.payment_methods.includes(m.key)
                        ? 'border-brand bg-brand-light'
                        : 'border-gray-200 bg-white'
                    }`}>
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${form.payment_methods.includes(m.key) ? 'text-brand' : 'text-gray-700'}`}>
                        {m.label}
                      </p>
                      {m.sub && <p className="text-xs text-gray-400">{m.sub}</p>}
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      form.payment_methods.includes(m.key) ? 'bg-brand border-brand' : 'border-gray-300'
                    }`}>
                      {form.payment_methods.includes(m.key) && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank detail if bank selected */}
            {form.payment_methods.includes('bank') && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-semibold font-heading text-gray-700 mb-1">
                  {form.country === 'PT' ? 'Your IBAN' : form.country === 'UK' ? 'Sort code & account number' : 'Routing & account number'}
                </p>
                <p className="text-xs text-gray-400 mb-3">Shown on quotes so clients can transfer directly.</p>
                <input
                  type="text"
                  value={form.bank_detail}
                  onChange={e => set('bank_detail', e.target.value)}
                  placeholder={
                    form.country === 'PT' ? 'PT50 0010 0000 0000 1234 5' :
                    form.country === 'UK' ? '20-00-00 / 12345678' :
                    'Routing: 021000021 / Acct: 1234567890'
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Business details ── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">Your business details</h2>
            <p className="text-gray-400 text-sm mb-6">Shown on every quote. Only name is required.</p>
            <div className="space-y-4">
              {[
                { field: 'name',    label: 'Business name *',   placeholder: "Mike's Plumbing",    type: 'text' },
                { field: 'phone',   label: 'Phone number',      placeholder: cfg?.phone || '+1 555 000 0000', type: 'tel' },
                { field: 'email',   label: 'Business email',    placeholder: 'you@example.com',    type: 'email' },
                { field: 'address', label: 'Business address',  placeholder: 'Street, City',       type: 'text' },
                { field: 'tagline', label: 'Tagline (optional)', placeholder: 'Available 24/7',    type: 'text' },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type={type} value={form[field]} onChange={e => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              ))}

              {/* Tax */}
              {cfg?.tax && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm font-semibold font-heading text-gray-700 mb-3">
                    Are you registered for {cfg.taxLabel}?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => set('vat_registered', false)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        !form.vat_registered ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-400'
                      }`}>
                      No
                    </button>
                    <button onClick={() => set('vat_registered', true)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.vat_registered ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-400'
                      }`}>
                      Yes ({cfg.taxRate}%)
                    </button>
                  </div>
                  {form.vat_registered && (
                    <input type="text" value={form.vat_number}
                      onChange={e => set('vat_number', e.target.value)}
                      placeholder={form.country === 'PT' ? 'NIF: PT123456789' : 'VAT number'}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand mt-3"
                    />
                  )}
                </div>
              )}

              {/* Summary */}
              {form.country && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-green-700 mb-2">
                    {COUNTRY_CONFIG[form.country].flag} Configured for {COUNTRY_CONFIG[form.country].label}
                  </p>
                  {[
                    `Currency: ${COUNTRY_CONFIG[form.country].symbol} ${COUNTRY_CONFIG[form.country].currency}`,
                    `Default deposit: ${form.deposit_pct === 0 ? 'None' : `${form.deposit_pct}%`}`,
                    `Payment: ${form.payment_methods.join(', ')}`,
                    `Card fee: ${COUNTRY_CONFIG[form.country].stripe} — paid by client`,
                  ].map(item => (
                    <p key={item} className="text-xs text-green-600 flex items-center gap-1.5">
                      <span>✓</span> {item}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-4 pb-8 pt-4 bg-white border-t border-gray-100 max-w-lg mx-auto w-full">
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step === STEPS.length - 1) finish()
              else setStep(s => s + 1)
            }}
            disabled={!canProceed || saving}
            className="flex-1 brand-gradient text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50">
            {saving ? 'Setting up...' :
             step === STEPS.length - 1 ? 'Start using Lead-to-Quote →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
