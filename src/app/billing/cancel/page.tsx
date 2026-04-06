'use client'

import Link from 'next/link'

export default function BillingCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <span className="text-yellow-600">⚠️</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your payment was cancelled. You can try again anytime or continue with your current plan.
        </p>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Still Interested?</h3>
          <p className="text-gray-600 mb-4">
            Upgrade to unlock unlimited content generation, advanced voice analysis, and more features to help you market your book effectively.
          </p>
          
          <div className="text-left text-gray-600 space-y-2">
            <div className="flex items-center justify-between">
              <span>Trial Plan</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Solo Plan</span>
              <span className="font-medium">$29/month</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Team Plan</span>
              <span className="font-medium">$99/month</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard/billing"
            className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="block w-full px-4 py-3 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Continue with Free Plan
          </Link>
        </div>
      </div>
    </div>
  )
}
