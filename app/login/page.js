'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl font-heading">Q</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">Lead-to-Quote</h1>
          <p className="text-gray-600 text-sm mt-1">Quote faster. Win more jobs.</p>
        </div>
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">📬</p>
            <p className="font-semibold text-green-800 font-heading">Check your email</p>
            <p className="text-sm text-green-700 mt-1">We sent a magic link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading || !email}
              className="w-full brand-gradient text-white font-semibold py-3.5 rounded-xl disabled:opacity-50">
              {loading ? 'Sending...' : 'Continue with email →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
