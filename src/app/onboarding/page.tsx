'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      }
    }
    checkAuth()
  }, [router])

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      router.push('/dashboard')
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 1: Book Profile</h3>
            <p className="text-gray-600">Tell us about your book</p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Book Title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Genre"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <textarea
                placeholder="Book Description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 2: Upload Manuscript</h3>
            <p className="text-gray-600">Upload your book manuscript (PDF)</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-gray-600">Drop your PDF here or click to browse</p>
              <p className="text-xs text-gray-500">PDF files only, up to 10MB</p>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 3: Connect Social Accounts</h3>
            <p className="text-gray-600">Connect your social media accounts</p>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-left hover:bg-gray-50">
                🔗 Connect Instagram
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-left hover:bg-gray-50">
                🔗 Connect Twitter/X
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-left hover:bg-gray-50">
                🔗 Connect LinkedIn
              </button>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 4: Voice Review</h3>
            <p className="text-gray-600">Review your AI-generated voice profile</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-4">
                "Transform your writing journey with AI-powered insights that capture your unique voice..."
              </p>
              <p className="text-sm font-medium text-gray-900">Does this sound like you?</p>
            </div>
            <div className="flex space-x-4">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Yes, sounds good!
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Refine
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to BookAmplify!</h1>
          <p className="mt-2 text-gray-600">Let's set up your AI-powered marketing platform</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : step === 4 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
