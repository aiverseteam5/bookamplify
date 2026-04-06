'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Subscription {
  id: string
  plan: string
  status: string
  current_period_end: string
  created_at: string
}

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  priceId: string
}

export default function Billing() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Trial',
      price: 0,
      features: [
        '5 content generations per month',
        'Basic voice analysis',
        '1 social media connection',
        'Email support'
      ],
      priceId: ''
    },
    {
      id: 'solo',
      name: 'Solo',
      price: 29,
      features: [
        'Unlimited content generation',
        'Advanced voice analysis',
        '3 social media connections',
        'Content scheduling',
        'Priority email support'
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_SOLO_PRICE_ID || ''
    },
    {
      id: 'team',
      name: 'Team',
      price: 99,
      features: [
        'Everything in Solo',
        '10 social media connections',
        'Team collaboration',
        'Advanced analytics',
        'Phone support'
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID || ''
    }
  ]

  useEffect(() => {
    const getUserAndSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Get subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('author_id', user.id)
          .single()
        
        if (data && !error) {
          setSubscription(data)
        }
      }
      setLoading(false)
    }
    getUserAndSubscription()
  }, [])

  const handleUpgrade = async (plan: Plan) => {
    if (!plan.priceId) {
      alert('This plan is not available yet')
      return
    }

    setUpgrading(true)
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          plan: plan.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      
      // Redirect to Stripe Checkout
      const stripe = (window as any).Stripe
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          throw error.message
        }
      } else {
        throw new Error('Stripe not loaded')
      }
    } catch (error: any) {
      console.error('Upgrade error:', error)
      alert(error.message || 'Failed to process upgrade')
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentPlan = subscription ? plans.find(p => p.id === subscription.plan) || plans[0] : plans[0]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600">Manage your subscription and payment methods.</p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{currentPlan.name}</h3>
              <p className="text-gray-600">
                ${currentPlan.price}/month • Status: {subscription.status}
              </p>
              {subscription.current_period_end && (
                <p className="text-sm text-gray-500">
                  Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : subscription.status === 'past_due'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id
          const isUpgrade = subscription && plan.price > currentPlan.price
          
          return (
            <div
              key={plan.id}
              className={`bg-white shadow rounded-lg p-6 ${
                isCurrentPlan ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  ${plan.price}
                  <span className="text-sm font-medium text-gray-500">/month</span>
                </p>
              </div>
              
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {upgrading ? 'Processing...' : 'Upgrade'}
                  </button>
                ) : plan.price > 0 ? (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {upgrading ? 'Processing...' : 'Get Started'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                  >
                    Free Plan
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Billing History */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Billing History</h2>
        <p className="text-gray-600 text-center py-8">
          Billing history will be available once you have an active subscription.
        </p>
      </div>
    </div>
  )
}
