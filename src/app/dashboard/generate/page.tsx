'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusPill } from '@/components/StatusPill'

const PLATFORMS = [
  { value: 'twitter',   label: 'X / Twitter',  hint: 'Max 280 chars, punchy hook' },
  { value: 'instagram', label: 'Instagram',     hint: 'Caption with hashtags' },
  { value: 'linkedin',  label: 'LinkedIn',      hint: 'Thought leadership post' },
  { value: 'youtube',   label: 'YouTube',       hint: 'Script or description' },
]

interface GeneratedItem {
  id: string
  platform: string
  content_text: string
}

export default function GenerateContent() {
  const [platform, setPlatform] = useState('twitter')
  const [topic, setTopic]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<GeneratedItem | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()

  const selected = PLATFORMS.find(p => p.value === platform)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, topic }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg = data && typeof data === 'object' && 'error' in data ? String((data as { error: unknown }).error) : 'Generation failed'
        setError(msg)
        return
      }
      setResult(data as GeneratedItem)
      setTopic('')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ba-text)', marginBottom: '0.25rem' }}>
          Generate Content
        </h1>
        <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
          AI creates platform-native posts in your voice. Review in the queue.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="ba-card">
          <div className="ba-card__header">
            <span className="ba-card__title">New Post</span>
          </div>
          <div className="ba-card__body">
            <form onSubmit={e => void handleSubmit(e)}>
              {/* Platform selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="ba-label">Platform</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {PLATFORMS.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => setPlatform(p.value)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--ba-r-md)',
                        border: `1px solid ${platform === p.value ? 'var(--ba-accent)' : 'var(--ba-border)'}`,
                        background: platform === p.value ? 'var(--ba-accent-dim)' : 'var(--ba-surface-2)',
                        color: platform === p.value ? 'var(--ba-accent)' : 'var(--ba-text-muted)',
                        fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                        textAlign: 'left', transition: 'all 120ms',
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {selected && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--ba-text-dim)', marginTop: '0.5rem' }}>
                    {selected.hint}
                  </p>
                )}
              </div>

              {/* Topic */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="ba-label" htmlFor="topic">Topic / Prompt</label>
                <textarea
                  id="topic"
                  className="ba-input"
                  rows={4}
                  placeholder="e.g. Why I wrote the chapter on grief, lessons from my protagonist's journey…"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  style={{ resize: 'vertical' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--ba-text-dim)', marginTop: '0.375rem', textAlign: 'right' }}>
                  {topic.length} / 2000
                </p>
              </div>

              {error && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--ba-r-md)', background: 'var(--ba-danger-bg)', color: 'var(--ba-danger)', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="ba-btn ba-btn--primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Generating…' : '✦ Generate'}
              </button>
            </form>
          </div>
        </div>

        {/* Preview / result */}
        <div className="ba-card">
          <div className="ba-card__header">
            <span className="ba-card__title">Preview</span>
            {result && <StatusPill status="pending" />}
          </div>
          <div className="ba-card__body">
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', gap: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--ba-border-2)', borderTopColor: 'var(--ba-accent)', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>Claude is writing in your voice…</p>
              </div>
            )}
            {!loading && !result && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--ba-text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✦</p>
                <p style={{ fontSize: '0.9375rem' }}>Your generated post will appear here.</p>
              </div>
            )}
            {result && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ba-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {PLATFORMS.find(p => p.value === result.platform)?.label ?? result.platform}
                  </span>
                </div>
                <p style={{ color: 'var(--ba-text)', fontSize: '0.9375rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.content_text}
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                  <button className="ba-btn ba-btn--ghost" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => router.push('/dashboard/queue')}>
                    Go to Queue →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
