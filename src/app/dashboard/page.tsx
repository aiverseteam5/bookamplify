'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MetricCard } from '@/components/MetricCard'
import { StatusPill } from '@/components/StatusPill'
import type { Database } from '@/types/supabase'

type AgentRun     = Database['public']['Tables']['agent_runs']['Row']
type ContentItem  = Database['public']['Tables']['content_items']['Row']

// Simple SVG sparkline
function Sparkline({ values, color = 'var(--ba-accent)' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 120
  const h = 40
  const step = w / (values.length - 1)
  const pts = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 6) - 3}`)
    .join(' ')
  return (
    <svg width={w} height={h} className="ba-sparkline" style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  )
}

export default function DashboardOverview() {
  const [loading, setLoading]       = useState(true)
  const [agentRuns, setAgentRuns]   = useState<AgentRun[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      try {
        const [{ data: runs }, { data: items }] = await Promise.all([
          supabase.from('agent_runs').select('*').order('triggered_at', { ascending: false }).limit(10),
          supabase.from('content_items').select('*').order('created_at', { ascending: false }).limit(50),
        ])
        setAgentRuns(runs ?? [])
        setContentItems(items ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--ba-border-2)', borderTopColor: 'var(--ba-accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const approvedCount = contentItems.filter(c => c.status === 'approved').length
  const pendingCount  = contentItems.filter(c => c.status === 'pending').length
  const draftsCount   = contentItems.filter(c => c.status === 'draft').length
  const runsCount     = agentRuns.length

  // Weekly content volume for sparkline (last 7 days)
  const weeklyVolume = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const ds = d.toISOString().slice(0, 10)
    return contentItems.filter(c => c.created_at?.startsWith(ds)).length
  })

  const recentActivity = agentRuns.slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ba-text)', marginBottom: '0.25rem' }}>
          Overview
        </h1>
        <p style={{ color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
          Your AI-powered author marketing at a glance.
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard label="Approved Posts"  value={approvedCount} trend="up"   delta="ready to post" />
        <MetricCard label="Pending Review"  value={pendingCount}  trend={pendingCount > 0 ? 'up' : 'flat'} delta={pendingCount > 0 ? 'needs action' : 'all clear'} />
        <MetricCard label="Drafts"          value={draftsCount}   trend="flat"  delta="in queue" />
        <MetricCard label="Agent Runs"      value={runsCount}     trend="flat"  delta="total" />
      </div>

      {/* Bottom grid: Activity + Sparkline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 340px)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Activity log */}
        <div className="ba-card">
          <div className="ba-card__header">
            <span className="ba-card__title">Recent Activity</span>
            <Link href="/dashboard/queue" style={{ fontSize: '0.8125rem', color: 'var(--ba-accent)', textDecoration: 'none' }}>
              View queue →
            </Link>
          </div>
          <div style={{ padding: '0 1.5rem' }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--ba-text-muted)', fontSize: '0.9375rem' }}>
                No activity yet — upload a manuscript to get started.
              </div>
            ) : (
              recentActivity.map((run) => (
                <div key={run.id} className="ba-activity-row">
                  <div className="ba-activity-dot" style={{ background: run.status === 'completed' ? 'var(--ba-success)' : run.status === 'running' ? 'var(--ba-accent)' : 'var(--ba-danger)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ba-text)', marginBottom: '0.125rem' }}>
                      {run.agent_name === 'voiceExtraction' ? 'Voice Extraction' : 'Content Generation'}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--ba-text-muted)' }}>
                      {run.status === 'completed'
                        ? `Completed · ${run.items_created ?? 0} item(s) created`
                        : run.status === 'running'
                        ? 'In progress…'
                        : 'Failed'}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ba-text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(run.triggered_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sparkline card */}
        <div className="ba-card">
          <div className="ba-card__header">
            <span className="ba-card__title">Content This Week</span>
          </div>
          <div className="ba-card__body">
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ba-text)' }}>
                {weeklyVolume.reduce((a, b) => a + b, 0)}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--ba-text-muted)', marginLeft: '0.5rem' }}>items</span>
            </div>
            <Sparkline values={weeklyVolume} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} style={{ fontSize: '0.6875rem', color: 'var(--ba-text-dim)' }}>{d}</span>
              ))}
            </div>
          </div>
          {/* Quick actions */}
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/dashboard/generate" className="ba-btn ba-btn--primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              Generate Content
            </Link>
            <Link href="/dashboard/queue" className="ba-btn ba-btn--ghost" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              Review Queue {pendingCount > 0 && <StatusPill status="pending" label={String(pendingCount)} />}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
