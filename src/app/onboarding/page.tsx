'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FormData {
  name: string
  book_title: string
  book_description: string
  genre: string
  sub_genre: string
  target_reader: string
  purchase_url: string
  author_bio: string
  tone_preference: string
  launch_date: string
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    book_title: '',
    book_description: '',
    genre: '',
    sub_genre: '',
    target_reader: '',
    purchase_url: '',
    author_bio: '',
    tone_preference: 'scholarly but accessible',
    launch_date: '',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    }).catch(() => router.push('/auth/login'))
  }, [router])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Only PDF files are allowed'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be less than 10MB'); return }
    setUploadedFile(file)
    setError('')
  }

  const handleProfileSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/authors/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Failed to save profile')
      }
      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleManuscriptUpload = async () => {
    if (!uploadedFile) { setError('Please select a file'); return }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', uploadedFile)
      const res = await fetch('/api/upload/manuscript', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Upload failed')
      }
      setStep(3)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUploading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 1: Author & Book Profile</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
            <input type="text" placeholder="Your Name *" value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Book Title *" value={formData.book_title}
              onChange={(e) => handleInputChange('book_title', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <textarea placeholder="Book Description" rows={3} value={formData.book_description}
              onChange={(e) => handleInputChange('book_description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Genre" value={formData.genre}
                onChange={(e) => handleInputChange('genre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <input type="text" placeholder="Sub-genre" value={formData.sub_genre}
                onChange={(e) => handleInputChange('sub_genre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <input type="url" placeholder="Purchase URL (optional)" value={formData.purchase_url}
              onChange={(e) => handleInputChange('purchase_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <textarea placeholder="Author Bio" rows={3} value={formData.author_bio}
              onChange={(e) => handleInputChange('author_bio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <button onClick={handleProfileSubmit} disabled={loading || !formData.name || !formData.book_title}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 2: Upload Manuscript</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Choose PDF File
              </label>
              <p className="text-xs text-gray-500 mt-2">PDF only, max 10MB</p>
              {uploadedFile && <p className="mt-2 text-sm text-gray-600">Selected: {uploadedFile.name}</p>}
            </div>
            <button onClick={handleManuscriptUpload} disabled={uploading || !uploadedFile}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload & Continue'}
            </button>
            <button onClick={() => setStep(3)} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Skip for now
            </button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 3: Connect Social Accounts</h3>
            <p className="text-gray-500 text-sm">OAuth integrations coming in Phase 6.</p>
            {(['instagram', 'twitter', 'linkedin'] as const).map(platform => (
              <div key={platform} className="px-4 py-3 border border-gray-300 rounded-md flex items-center justify-between">
                <span className="capitalize">{platform}</span>
                <span className="text-xs text-gray-400">Coming soon</span>
              </div>
            ))}
            <button onClick={() => setStep(4)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Continue
            </button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 4: Voice Review</h3>
            <p className="text-gray-600">Sample posts will appear here once your manuscript is analyzed.</p>
            <div className="flex space-x-4">
              <button onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
                Go to Dashboard
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to BookAmplify!</h1>
          <p className="mt-2 text-gray-600">Set up your AI-powered marketing platform</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>{n}</div>
          ))}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {renderStep()}
        </div>

        {step > 1 && step < 4 && (
          <div className="mt-4">
            <button onClick={() => setStep(s => Math.max(1, s - 1))}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Previous
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
