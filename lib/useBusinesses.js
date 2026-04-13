'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function useBusinesses(user) {
  const [businesses, setBusinesses] = useState([])
  const [activeBusiness, setActiveBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    loadBusinesses()
  }, [user])

  async function loadBusinesses() {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })

    if (!data || data.length === 0) {
      router.replace('/onboarding')
      return
    }

    setBusinesses(data)

    // Pick active business from localStorage or default to first
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem('active_business_id')
      : null
    const active = stored
      ? data.find(b => b.id === stored) || data[0]
      : data[0]

    setActiveBusiness(active)
    setLoading(false)
  }

  function switchBusiness(biz) {
    setActiveBusiness(biz)
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_business_id', biz.id)
    }
  }

  return { businesses, activeBusiness, switchBusiness, loading }
}
