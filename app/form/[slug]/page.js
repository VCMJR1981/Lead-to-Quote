'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getTrade } from '@/lib/trades'

export default function IntakeFormPage({ params }) {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', job_type: '', description: '', preferred_date: ''
  })
  const supabase = createClient()

  useEffect(() => {
    async function fetchBusiness() {
      const { data } = await supabase
        .from('businesses').select('*').eq('slug', params.slug).single()
      if (!data) { setError('Business not found.'); setLoading(false); return }
      setBusiness(data)
      setLoading(false)
    }
    fetchBusiness()
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.phone) return
    setSubmitting(true)

    const { error } = await supabase.from('leads').insert({
      business_id: business.id,
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      job_type: form.job_type || null,
      description: form.description || null,
      preferred_date: form.preferred_date || null,
      status: 'new',
      source: 'form',
    })

    if (error) { setError('Something went wrong. Please try again.'); setSubmitting(false); return }
    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error && !business) return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  )

  const accent = business?.accent_color || '#E85D26'
  const trade = getTrade(business?.industry)
  const jobTypes = trade?.jobTypes || []
  const isPortuguese = business?.language === 'pt'

  const T = {
    title: isPortuguese ? 'Pedir Orçamento' : 'Request a Quote',
    subtitle: isPortuguese ? 'Preencha o formulário e entraremos em contacto em breve.' : 'Fill in the form and we\'ll get back to you quickly.',
    name: isPortuguese ? 'Nome *' : 'Your name *',
    phone: isPortuguese ? 'Telemóvel *' : 'Phone number *',
    email: isPortuguese ? 'Email' : 'Email (optional)',
    jobType: isPortuguese ? 'Tipo de trabalho' : 'Type of work',
    jobTypePlaceholder: isPortuguese ? 'Selecionar...' : 'Select...',
    description: isPortuguese ? 'Descreva o trabalho' : 'Describe the job',
    descriptionPlaceholder: isPortuguese
      ? 'Dê-nos mais detalhes sobre o que precisa...'
      : 'Give us more details about what you need...',
    date: isPortuguese ? 'Data preferida' : 'Preferred date',
    submit: isPortuguese ? 'Enviar pedido' : 'Send request',
    submitting: isPortuguese ? 'A enviar...' : 'Sending...',
    successTitle: isPortuguese ? 'Pedido recebido! ✓' : 'Request received! ✓',
    successMessage: isPortuguese
      ? `A equipa da ${business?.name} irá entrar em contacto em breve.`
      : `The team at ${business?.name} will be in touch shortly.`,
  }

  if (submitted) return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${accent}20` }}>
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold font-heading mb-3" style={{ color: accent }}>
          {T.successTitle}
        </h2>
        <p className="text-gray-500">{T.successMessage}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">

      {/* Business header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business.name}
              className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accent }}>
              <span className="text-white text-xl font-bold font-heading">
                {business?.name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="font-bold text-gray-900 font-heading">{business?.name}</h1>
            {business?.tagline && <p className="text-sm text-gray-400">{business.tagline}</p>}
            {business?.phone && <p className="text-sm text-gray-500">{business.phone}</p>}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-heading text-gray-900">{T.title}</h2>
          <p className="text-gray-400 text-sm mt-1">{T.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{T.name}</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              required placeholder={isPortuguese ? 'O seu nome' : 'John Smith'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-brand transition-colors"
              style={{ '--tw-ring-color': `${accent}30` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{T.phone}</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              required placeholder={isPortuguese ? '+351 910 000 000' : '+1 555 000 0000'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{T.email}</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-brand transition-colors"
            />
          </div>

          {jobTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{T.jobType}</label>
              <select value={form.job_type} onChange={e => set('job_type', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:border-brand transition-colors">
                <option value="">{T.jobTypePlaceholder}</option>
                {jobTypes.map(jt => (
                  <option key={jt} value={jt}>{jt}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{T.description}</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder={T.descriptionPlaceholder} rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-brand transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{T.date}</label>
            <input type="date" value={form.preferred_date} onChange={e => set('preferred_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-brand transition-colors"
            />
          </div>

          <button type="submit" disabled={submitting || !form.name || !form.phone}
            className="w-full py-4 rounded-2xl text-white font-bold text-base mt-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: accent }}>
            {submitting ? T.submitting : T.submit + ' →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
