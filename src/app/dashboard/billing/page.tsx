'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusPill } from '@/components/StatusPill'
import type { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void }
  }
}

interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description: string
  image?: string
  handler: (response: RazorpayResponse) => void
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

const PLAN_FEATURES = [
  '7 AI-generated posts per week',
  'Voice profile extracted from your manuscript',
  'Instagram, X, LinkedIn & YouTube',
  'Approve in 7 minutes / week',
  'Genre-aware content strategies',
  'RAG-powered voice consistency',
]

const TRIAL_FEATURES = [
  '3 AI-generated posts (one-time)',
  'Full voice extraction',
  'Dashboard access',
  'No credit card required',
]

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-script')) { resolve(); return }
    const script = document.createElement('script')
    script.id  = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
    document.body.appendChild(script)
  })
}

export default function Billing() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [authorName, setAuthorName]     = useState<string>('')
  const [userEmail, setUserEmail]       = useState<string>('')
  const [loading, setLoading]           = useState(true)
  const [upgrading, setUpgrading]       = useState(false)
  const [message, setMessage]           = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserEmail(user.email ?? '')
    const { data: author } = await supabase.from('authors').select('id, name').eq('user_id', user.id).single()
    if (author) {
      setAuthorName(author.name)
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('author_id', author.id).single()
      setSubscription(sub)
    }
    setLoading(false)
  }

  useEffect(() => { void loadData() }, [])

  const handleUpgrade = async () => {
    setUpgrading(true)
    setMessage(null)
    try {
      // 1. Create subscription on server
      const res = await fetch('/api/razorpay/checkout', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Failed to create subscription')
      }
      const { subscription_id } = await res.json() as { subscription_id: string }

      // 2. Load Razorpay script
      await loadRazorpayScript()

      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay key not configured')
      }

      // 3. Open checkout modal
      const rzp = new window.Razorpay({
        key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscription_id,
        name:            'BookAmplify',
        description:     'Solo Plan — ₹2,499/month',
        prefill:         { name: authorName, email: userEmail },
        theme:           { color: '#4F6EF7' },
        handler: async (response: RazorpayResponse) => {
          // Payment captured — webhook will update DB; refresh UI
          setMessage({
            type: 'success',
            text: `Payment successful! ID: ${response.razorpay_payment_id}. Your plan is being activated.`,
          })
          // Poll for subscription update
          let attempts = 0
          const poll = setInterval(async () => {
            attempts++
            await loadData()
            if (attempts > 10) clearInterval(poll)
          }, 2000)
        },
      })
      rzp.open()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to initiate payment' })
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--ba-border-2)', borderTopColor: 'var(--ba-accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const planName    = subscription?.plan ?? 'trial'
  const isActive    = subscription?.status === 'active'
  const isPaid      = isActive && planName !== 'trial'
  const trialEndStr = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString()
    : null
  const renewStr = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ba-text)', marginBottom: '0.25rem' }}>Billing</h1>
        <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>Manage your BookAmplify subscription.</p>
      </div>

      {message && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: 'var(--ba-r-md)', marginBottom: '1.5rem',
          background: message.type === 'success' ? 'var(--ba-success-bg)' : 'var(--ba-danger-bg)',
          color: message.type === 'success' ? 'var(--ba-success)' : 'var(--ba-danger)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontSize: '0.9375rem',
        }}>
          {message.text}
        </div>
      )}

      {/* Current plan card */}
      <div className="ba-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ba-card__header">
          <span className="ba-card__title">Current Plan</span>
          <StatusPill status={isActive ? 'active' : 'pending'} label={isActive ? 'Active' : 'Inactive'} />
        </div>
        <div className="ba-card__body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ba-text)', textTransform: 'capitalize' }}>
                {planName === 'trial' ? 'Free Trial' : `Solo — ₹2,499/mo`}
              </p>
              {planName === 'trial' && trialEndStr && (
                <p style={{ fontSize: '0.875rem', color: 'var(--ba-warning)', marginTop: '0.25rem' }}>
                  ⚠ Trial ends {trialEndStr}
                </p>
              )}
              {isPaid && renewStr && (
                <p style={{ fontSize: '0.875rem', color: 'var(--ba-text-muted)', marginTop: '0.25rem' }}>
                  Renews {renewStr}
                </p>
              )}
            </div>
            {subscription?.razorpay_subscription_id && (
              <p style={{ fontSize: '0.75rem', color: 'var(--ba-text-dim)', fontFamily: 'monospace' }}>
                {subscription.razorpay_subscription_id}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      {!isPaid && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Free Trial */}
          <div className="ba-card">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--ba-border)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ba-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Current
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ba-text)' }}>Free Trial</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ba-text)', marginTop: '0.5rem' }}>₹0</p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {TRIAL_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--ba-text-muted)' }}>
                    <span style={{ color: 'var(--ba-success)', flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Solo plan */}
          <div className="ba-card" style={{ border: '1px solid var(--ba-accent)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--ba-accent)' }} />
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--ba-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ba-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recommended
                </p>
              </div>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ba-text)' }}>Solo</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ba-text)' }}>₹2,499</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--ba-text-muted)' }}>/month</p>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {PLAN_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--ba-text)' }}>
                    <span style={{ color: 'var(--ba-accent)', flexShrink: 0 }}>✦</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="ba-btn ba-btn--primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem' }}
                disabled={upgrading} onClick={() => void handleUpgrade()}>
                {upgrading ? 'Opening Razorpay…' : 'Upgrade to Solo'}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--ba-text-dim)', textAlign: 'center', marginTop: '0.75rem' }}>
                Secure payment via Razorpay · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      )}

      {isPaid && (
        <div style={{ padding: '1.5rem', borderRadius: 'var(--ba-r-lg)', background: 'var(--ba-surface)', border: '1px solid var(--ba-border)', textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ba-text)', marginBottom: '0.5rem' }}>
            You&apos;re on the Solo plan
          </p>
          <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
            Thank you for being a BookAmplify member. To manage your subscription, visit the Razorpay dashboard or contact support.
          </p>
        </div>
      )}
    </div>
  )
}
