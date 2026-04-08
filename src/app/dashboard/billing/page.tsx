'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

export default function Billing() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: author } = await supabase.from('authors').select('id').eq('user_id', user.id).single()
        if (author) {
          const { data: sub } = await supabase.from('subscriptions').select('*').eq('author_id', author.id).single()
          setSubscription(sub)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleUpgrade = async () => {
    setUpgrading(true)
    setMessage('')
    try {
      const res = await fetch('/api/razorpay/checkout', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Failed to create checkout session')
      }
      const data = await res.json() as { subscription_id?: string }
      if (data.subscription_id) {
        setMessage(`Razorpay subscription created: ${data.subscription_id}. Complete payment in the Razorpay dashboard.`)
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to process upgrade')
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const planName = subscription?.plan ?? 'trial'
  const isActive = subscription?.status === 'active'
  const isTrial = planName === 'trial'
  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString()
    : null

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600">Manage your subscription.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 capitalize">{planName}</h3>
            {isTrial && trialEnd && (
              <p className="text-sm text-gray-500">Trial ends {trialEnd}</p>
            )}
            {!isTrial && subscription?.current_period_end && (
              <p className="text-sm text-gray-500">
                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {subscription?.status ?? 'unknown'}
          </span>
        </div>
      </div>

      {isTrial && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Upgrade to Solo — ₹2,499/month</h2>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>✓ Unlimited content generation</li>
            <li>✓ Advanced voice analysis</li>
            <li>✓ 3 social media connections</li>
            <li>✓ Content scheduling</li>
          </ul>

          {message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded text-sm">{message}</div>
          )}

          <button onClick={handleUpgrade} disabled={upgrading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {upgrading ? 'Processing...' : 'Upgrade to Solo'}
          </button>
        </div>
      )}
    </div>
  )
}
