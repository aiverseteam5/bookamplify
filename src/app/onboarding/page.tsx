'use client'

import { useState, useEffect, useRef } from 'react'
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

const STEPS = [
  { n: 1, label: 'Profile' },
  { n: 2, label: 'Manuscript' },
  { n: 3, label: 'Accounts' },
  { n: 4, label: 'Voice Review' },
]

const GENRES = ['Fiction', 'Non-Fiction', 'Self-Help', 'Business', 'Memoir', 'Fantasy', 'Thriller', 'Romance', 'Science', 'Other']

export default function Onboarding() {
  const [step, setStep]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [polling, setPolling]     = useState(false)
  const [error, setError]         = useState('')
  const [voiceReady, setVoiceReady] = useState(false)
  const [formData, setFormData]   = useState<FormData>({
    name: '', book_title: '', book_description: '', genre: '', sub_genre: '',
    target_reader: '', purchase_url: '', author_bio: '',
    tone_preference: 'scholarly but accessible', launch_date: '',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const router  = useRouter()

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [router])

  const set = (field: keyof FormData, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Only PDF files are accepted'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10 MB'); return }
    setUploadedFile(file)
    setError('')
  }

  const saveProfile = async () => {
    setLoading(true); setError('')
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

  const uploadManuscript = async () => {
    if (!uploadedFile) { setError('Please select a PDF file'); return }
    setUploading(true); setError('')
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

  // Poll agent_runs for voiceExtraction completion
  const startPolling = () => {
    setPolling(true)
    pollRef.current = setInterval(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('agent_runs')
        .select('status')
        .eq('agent_name', 'voiceExtraction')
        .order('triggered_at', { ascending: false })
        .limit(1)
        .single()
      if (data?.status === 'completed') {
        setVoiceReady(true)
        setPolling(false)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 3000)
  }

  const goToStep4 = () => {
    setStep(4)
    startPolling()
  }

  // ── Live preview of profile card ───────────────────────────────────────
  const ProfilePreview = () => (
    <div className="ba-card" style={{ height: '100%' }}>
      <div className="ba-card__header">
        <span className="ba-card__title">Live Preview</span>
      </div>
      <div className="ba-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--ba-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {formData.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--ba-text)', fontSize: '0.9375rem' }}>{formData.name || 'Your Name'}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ba-text-muted)' }}>{formData.genre || 'Genre'} Author</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--ba-border)', paddingTop: '0.75rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--ba-text)', marginBottom: '0.25rem' }}>{formData.book_title || 'Book Title'}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ba-text-muted)', lineHeight: 1.5 }}>
            {formData.book_description || 'Your book description will appear here…'}
          </p>
        </div>

        {formData.author_bio && (
          <div style={{ borderTop: '1px solid var(--ba-border)', paddingTop: '0.75rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ba-text-muted)', lineHeight: 1.5 }}>{formData.author_bio}</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Form */}
            <div className="ba-card">
              <div className="ba-card__header">
                <span className="ba-card__title">Author &amp; Book Profile</span>
              </div>
              <div className="ba-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--ba-r-md)', background: 'var(--ba-danger-bg)', color: 'var(--ba-danger)', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <div>
                  <label className="ba-label">Full Name *</label>
                  <input className="ba-input" value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
                </div>

                <div>
                  <label className="ba-label">Book Title *</label>
                  <input className="ba-input" value={formData.book_title} onChange={e => set('book_title', e.target.value)} placeholder="The Midnight Garden" />
                </div>

                <div>
                  <label className="ba-label">Book Description</label>
                  <textarea className="ba-input" rows={3} value={formData.book_description}
                    onChange={e => set('book_description', e.target.value)}
                    placeholder="A brief synopsis of your book…" style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="ba-label">Genre</label>
                    <select className="ba-input" value={formData.genre} onChange={e => set('genre', e.target.value)}>
                      <option value="">Select…</option>
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ba-label">Sub-genre</label>
                    <input className="ba-input" value={formData.sub_genre} onChange={e => set('sub_genre', e.target.value)} placeholder="e.g. Cozy mystery" />
                  </div>
                </div>

                <div>
                  <label className="ba-label">Target Reader</label>
                  <input className="ba-input" value={formData.target_reader} onChange={e => set('target_reader', e.target.value)} placeholder="e.g. Women 30-50 who love literary fiction" />
                </div>

                <div>
                  <label className="ba-label">Author Bio</label>
                  <textarea className="ba-input" rows={2} value={formData.author_bio}
                    onChange={e => set('author_bio', e.target.value)}
                    placeholder="A short bio readers will see…" style={{ resize: 'vertical' }} />
                </div>

                <button className="ba-btn ba-btn--primary" style={{ justifyContent: 'center' }}
                  disabled={loading || !formData.name || !formData.book_title}
                  onClick={() => void saveProfile()}>
                  {loading ? 'Saving…' : 'Save & Continue →'}
                </button>
              </div>
            </div>

            {/* Preview */}
            <ProfilePreview />
          </div>
        )

      case 2:
        return (
          <div className="ba-card" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="ba-card__header">
              <span className="ba-card__title">Upload Manuscript</span>
            </div>
            <div className="ba-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--ba-r-md)', background: 'var(--ba-danger-bg)', color: 'var(--ba-danger)', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <input type="file" accept=".pdf" id="file-upload" style={{ display: 'none' }} onChange={handleFileSelect} />
              <label htmlFor="file-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.75rem', padding: '2.5rem 1.5rem',
                border: `2px dashed ${uploadedFile ? 'var(--ba-accent)' : 'var(--ba-border-2)'}`,
                borderRadius: 'var(--ba-r-lg)', cursor: 'pointer', transition: 'border-color 150ms',
                background: uploadedFile ? 'var(--ba-accent-dim)' : 'var(--ba-surface-2)',
              }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                {uploadedFile ? (
                  <span style={{ color: 'var(--ba-accent)', fontWeight: 500, fontSize: '0.9375rem' }}>{uploadedFile.name}</span>
                ) : (
                  <>
                    <span style={{ color: 'var(--ba-text)', fontWeight: 500 }}>Drop your PDF here or click to browse</span>
                    <span style={{ color: 'var(--ba-text-muted)', fontSize: '0.8125rem' }}>PDF only · max 10 MB</span>
                  </>
                )}
              </label>

              <button className="ba-btn ba-btn--primary" style={{ justifyContent: 'center' }}
                disabled={uploading || !uploadedFile} onClick={() => void uploadManuscript()}>
                {uploading ? 'Uploading…' : 'Upload & Analyse →'}
              </button>
              <button className="ba-btn ba-btn--ghost" style={{ justifyContent: 'center' }} onClick={() => setStep(3)}>
                Skip for now
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="ba-card" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="ba-card__header">
              <span className="ba-card__title">Connect Social Accounts</span>
            </div>
            <div className="ba-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.9375rem', color: 'var(--ba-text-muted)', marginBottom: '0.25rem' }}>
                You can connect accounts now or from the Connections tab later.
              </p>
              {(['Instagram', 'X / Twitter', 'LinkedIn', 'YouTube'] as const).map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 'var(--ba-r-md)', background: 'var(--ba-surface-2)', border: '1px solid var(--ba-border)' }}>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--ba-text)' }}>{p}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ba-text-dim)' }}>Connect in dashboard</span>
                </div>
              ))}
              <button className="ba-btn ba-btn--primary" style={{ justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={() => void goToStep4()}>
                Continue →
              </button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="ba-card" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="ba-card__header">
              <span className="ba-card__title">Voice Review</span>
            </div>
            <div className="ba-card__body" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              {polling && !voiceReady ? (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--ba-border-2)', borderTopColor: 'var(--ba-accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ color: 'var(--ba-text)', fontWeight: 600, marginBottom: '0.5rem' }}>Analysing your manuscript…</p>
                  <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
                    Claude is reading your book and extracting your unique voice. This takes a minute.
                  </p>
                </>
              ) : voiceReady ? (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✓</div>
                  <p style={{ color: 'var(--ba-success)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Voice Profile Ready!</p>
                  <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                    BookAmplify has learned your writing voice. Head to the dashboard to generate your first posts.
                  </p>
                  <button className="ba-btn ba-btn--primary" style={{ justifyContent: 'center', width: '100%' }}
                    onClick={() => router.push('/dashboard')}>
                    Go to Dashboard →
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--ba-text)', fontWeight: 600, marginBottom: '0.5rem' }}>No manuscript uploaded yet</p>
                  <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                    Upload your manuscript to let Claude learn your voice. Or head to the dashboard and do it later.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button className="ba-btn ba-btn--ghost" style={{ justifyContent: 'center' }} onClick={() => setStep(2)}>
                      ← Upload Manuscript
                    </button>
                    <button className="ba-btn ba-btn--primary" style={{ justifyContent: 'center' }}
                      onClick={() => router.push('/dashboard')}>
                      Go to Dashboard →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ba-bg)', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--ba-text)', marginBottom: '0.5rem' }}>
            Welcome to Book<span style={{ color: 'var(--ba-accent)' }}>Amplify</span>
          </h1>
          <p style={{ color: 'var(--ba-text-muted)', fontSize: '1rem' }}>
            Set up your AI-powered author marketing platform in 4 steps.
          </p>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2.5rem' }}>
          {STEPS.map(({ n, label }, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: step >= n ? 'var(--ba-accent)' : 'var(--ba-surface-2)',
                  border: `2px solid ${step >= n ? 'var(--ba-accent)' : 'var(--ba-border-2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: 700,
                  color: step >= n ? '#fff' : 'var(--ba-text-dim)',
                  transition: 'all 200ms',
                }}>
                  {step > n ? '✓' : n}
                </div>
                <span style={{ fontSize: '0.6875rem', color: step === n ? 'var(--ba-accent)' : 'var(--ba-text-dim)', fontWeight: step === n ? 600 : 400 }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 64, height: 2, background: step > n ? 'var(--ba-accent)' : 'var(--ba-border-2)', margin: '0 0.25rem', marginBottom: '1.25rem', transition: 'background 200ms' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {renderStep()}

        {/* Back button */}
        {step > 1 && step < 4 && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button className="ba-btn ba-btn--ghost" onClick={() => setStep(s => Math.max(1, s - 1))}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
