'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
    launch_date: ''
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [voiceProfile, setVoiceProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      }
    }
    checkAuth()
  }, [router])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setUploadedFile(file)
      setError('')
    }
  }

  const handleProfileSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/authors/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }

      handleNext()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManuscriptUpload = async () => {
    if (!uploadedFile) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/upload/manuscript', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload manuscript')
      }

      const result = await response.json()
      console.log('Upload result:', result)
      handleNext()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSocialConnect = (platform: string) => {
    // Placeholder for OAuth integration
    console.log(`Connect to ${platform}`)
    // In Phase 6, this will trigger OAuth flows
  }

  const handleVoiceApproval = async (approved: boolean) => {
    if (approved) {
      router.push('/dashboard')
    } else {
      // In Phase 6, this would allow refining the voice profile
      console.log('Refine voice profile')
      router.push('/dashboard')
    }
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 1: Author & Book Profile</h3>
            <p className="text-gray-600">Tell us about yourself and your book</p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                required
              />
              
              <input
                type="text"
                placeholder="Book Title"
                value={formData.book_title}
                onChange={(e) => handleInputChange('book_title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                required
              />

              <textarea
                placeholder="Book Description"
                rows={3}
                value={formData.book_description}
                onChange={(e) => handleInputChange('book_description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Genre (e.g., fiction, business)"
                  value={formData.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
                
                <input
                  type="text"
                  placeholder="Sub-genre"
                  value={formData.sub_genre}
                  onChange={(e) => handleInputChange('sub_genre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              <input
                type="text"
                placeholder="Target Reader (e.g., young adults, business professionals)"
                value={formData.target_reader}
                onChange={(e) => handleInputChange('target_reader', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />

              <input
                type="url"
                placeholder="Purchase URL (optional)"
                value={formData.purchase_url}
                onChange={(e) => handleInputChange('purchase_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />

              <textarea
                placeholder="Author Bio"
                rows={3}
                value={formData.author_bio}
                onChange={(e) => handleInputChange('author_bio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />

              <input
                type="date"
                placeholder="Launch Date (optional)"
                value={formData.launch_date}
                onChange={(e) => handleInputChange('launch_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />

              <button
                onClick={handleProfileSubmit}
                disabled={loading || !formData.name || !formData.book_title}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 2: Upload Manuscript</h3>
            <p className="text-gray-600">Upload your book manuscript for AI analysis</p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              
              <label
                htmlFor="file-upload"
                className="cursor-pointer mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Choose PDF File
              </label>
              
              <p className="text-xs text-gray-500 mt-2">
                PDF files only, up to 10MB
              </p>
              
              {uploadedFile && (
                <div className="mt-4 text-sm text-gray-600">
                  Selected: {uploadedFile.name}
                </div>
              )}
            </div>

            <button
              onClick={handleManuscriptUpload}
              disabled={uploading || !uploadedFile}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading & Analyzing...' : 'Upload & Continue'}
            </button>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 3: Connect Social Accounts</h3>
            <p className="text-gray-600">Connect your social media accounts for content posting (Phase 6)</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSocialConnect('instagram')}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>🔗 Connect Instagram</span>
                <span className="text-sm text-gray-500">Coming in Phase 6</span>
              </button>
              
              <button
                onClick={() => handleSocialConnect('twitter')}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>🔗 Connect Twitter/X</span>
                <span className="text-sm text-gray-500">Coming in Phase 6</span>
              </button>
              
              <button
                onClick={() => handleSocialConnect('linkedin')}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>🔗 Connect LinkedIn</span>
                <span className="text-sm text-gray-500">Coming in Phase 6</span>
              </button>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Skip for Now
            </button>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 4: Voice Profile Review</h3>
            <p className="text-gray-600">Review your AI-generated writing voice</p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Sample Content Generated in Your Voice:</h4>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-gray-700 italic">
                    "Transform your writing journey with AI-powered insights that capture your unique voice and resonate with your target readers..."
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-gray-700 italic">
                    "Discover how strategic content marketing can amplify your book's reach while maintaining authentic connection with your audience..."
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-gray-700 italic">
                    "Join thousands of authors who are revolutionizing their marketing approach with intelligent, personalized content creation..."
                  </p>
                </div>
              </div>
              
              <p className="text-sm font-medium text-gray-900 mt-6">Does this sound like you?</p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleVoiceApproval(true)}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Yes, sounds perfect!
              </button>
              <button
                onClick={() => handleVoiceApproval(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Refine (Coming in Phase 6)
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
        {step > 1 && step < 4 && (
          <div className="flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
