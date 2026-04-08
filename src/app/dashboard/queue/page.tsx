'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusPill } from '@/components/StatusPill'
import type { Database } from '@/types/supabase'

type ContentItem = Database['public']['Tables']['content_items']['Row']
type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'

const PLATFORM_LABELS: Record<string, string> = {
  twitter:   'X / Twitter',
  instagram: 'Instagram',
  linkedin:  'LinkedIn',
  youtube:   'YouTube',
}

export default function ContentQueue() {
  const [items, setItems]         = useState<ContentItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<FilterTab>('all')
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActioning(id)
    try {
      const res = await fetch(`/api/content/${id}/${action}`, { method: 'PATCH' })
      if (res.ok) await load()
    } finally {
      setActioning(null)
    }
  }

  const filtered = filter === 'all'
    ? items
    : items.filter(i => i.status === filter)

  const tabs: FilterTab[] = ['all', 'pending', 'approved', 'rejected']
  const counts: Record<FilterTab, number> = {
    all:      items.length,
    pending:  items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ba-text)', marginBottom: '0.25rem' }}>
          Content Queue
        </h1>
        <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
          Review and approve AI-generated content before it posts.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="ba-tabs" style={{ marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`ba-tab${filter === t ? ' ba-tab--active' : ''}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {counts[t] > 0 && (
              <span style={{
                marginLeft: '0.5rem', fontSize: '0.6875rem', fontWeight: 600,
                padding: '1px 6px', borderRadius: 999,
                background: filter === t ? 'var(--ba-accent-dim)' : 'var(--ba-surface-2)',
                color: filter === t ? 'var(--ba-accent)' : 'var(--ba-text-muted)',
              }}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--ba-border-2)', borderTopColor: 'var(--ba-accent)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ba-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <p style={{ fontSize: '1.125rem', color: 'var(--ba-text)', fontWeight: 600, marginBottom: '0.5rem' }}>
            {filter === 'pending' ? 'No pending items' : `No ${filter} items`}
          </p>
          <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
            {filter === 'pending' ? 'Generate content to start the review flow.' : 'Items will appear here once available.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((item) => (
            <div key={item.id} className="ba-card">
              <div style={{ padding: '1.25rem 1.5rem' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ba-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {PLATFORM_LABELS[item.platform] ?? item.platform}
                  </span>
                  <StatusPill status={item.status as 'pending' | 'approved' | 'rejected' | 'draft'} />
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--ba-text-dim)' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Content */}
                <p style={{ color: 'var(--ba-text)', fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {item.content_text}
                </p>

                {/* Actions — only for pending */}
                {item.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                      className="ba-btn ba-btn--success"
                      disabled={actioning === item.id}
                      onClick={() => void act(item.id, 'approve')}>
                      {actioning === item.id ? 'Saving…' : '✓ Approve'}
                    </button>
                    <button
                      className="ba-btn ba-btn--danger"
                      disabled={actioning === item.id}
                      onClick={() => void act(item.id, 'reject')}>
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
