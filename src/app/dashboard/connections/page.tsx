'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusPill } from '@/components/StatusPill'
import type { Database } from '@/types/supabase'

type SocialConnection = Database['public']['Tables']['social_connections']['Row']

const PLATFORMS = [
  { value: 'twitter',   label: 'X / Twitter',  icon: '𝕏', color: '#1DA1F2', desc: 'Share threads, polls, and author updates.' },
  { value: 'instagram', label: 'Instagram',     icon: '📷', color: '#E1306C', desc: 'Post visuals, reels, and story snippets.' },
  { value: 'linkedin',  label: 'LinkedIn',      icon: 'in', color: '#0A66C2', desc: 'Publish thought-leadership articles.' },
  { value: 'youtube',   label: 'YouTube',       icon: '▶', color: '#FF0000', desc: 'Drop video scripts and chapter teasers.' },
]

export default function Connections() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase
        .from('social_connections')
        .select('*')
      setConnections(data ?? [])
      setLoading(false)
    })()
  }, [])

  const connect = async (platform: string) => {
    setConnecting(platform)
    try {
      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, access_token: 'oauth-placeholder', refresh_token: null, expires_at: null }),
      })
      if (res.ok) {
        const supabase = createClient()
        const { data } = await supabase.from('social_connections').select('*')
        setConnections(data ?? [])
      }
    } finally {
      setConnecting(null)
    }
  }

  const getConnection = (platform: string) =>
    connections.find(c => c.platform === platform)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--ba-border-2)', borderTopColor: 'var(--ba-accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ba-text)', marginBottom: '0.25rem' }}>
          Connections
        </h1>
        <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
          Connect your social accounts so BookAmplify can post on your behalf.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {PLATFORMS.map(({ value, label, icon, color, desc }) => {
          const conn = getConnection(value)
          const isConnected = Boolean(conn)
          const isLoading = connecting === value

          return (
            <div key={value} className="ba-card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Accent stripe */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, opacity: isConnected ? 1 : 0.3 }} />

              <div style={{ padding: '1.5rem' }}>
                {/* Icon + status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--ba-r-md)',
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', fontWeight: 700, color,
                  }}>
                    {icon}
                  </div>
                  <StatusPill status={isConnected ? 'active' : 'draft'} label={isConnected ? 'Connected' : 'Not connected'} />
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ba-text)', marginBottom: '0.375rem' }}>
                  {label}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ba-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {desc}
                </p>

                {isConnected ? (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ba-text-dim)', marginBottom: '0.75rem' }}>
                      Connected {conn?.connected_at ? new Date(conn.connected_at as string).toLocaleDateString() : ''}
                    </p>
                    <button className="ba-btn ba-btn--ghost" style={{ width: '100%', justifyContent: 'center' }}>
                      Reconnect
                    </button>
                  </div>
                ) : (
                  <button
                    className="ba-btn ba-btn--primary"
                    style={{ width: '100%', justifyContent: 'center', background: color, opacity: isLoading ? 0.6 : 1 }}
                    disabled={isLoading}
                    onClick={() => void connect(value)}>
                    {isLoading ? 'Connecting…' : `Connect ${label}`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', borderRadius: 'var(--ba-r-md)', background: 'var(--ba-surface-2)', border: '1px solid var(--ba-border)' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ba-text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ba-text)' }}>How it works:</strong>{' '}
          OAuth tokens are stored securely in Supabase Vault and never exposed in your browser.
          BookAmplify only posts content you explicitly approve in the Content Queue.
        </p>
      </div>
    </div>
  )
}
