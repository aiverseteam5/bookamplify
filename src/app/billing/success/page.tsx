'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
        <p className="text-gray-600 mb-6">No session ID found.</p>
        <Link href="/dashboard/billing" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Return to Billing
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center max-w-md">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
        <span className="text-green-600 text-xl">✓</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
      <p className="text-gray-600 mb-8">Your subscription has been activated.</p>
      <Link href="/dashboard" className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-3">
        Go to Dashboard
      </Link>
    </div>
  )
}

export default function BillingSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
