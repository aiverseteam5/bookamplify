'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type AgentRun = Database['public']['Tables']['agent_runs']['Row']

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<AgentRun[]>([])

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      try {
        const { data } = await supabase
          .from('agent_runs')
          .select('*')
          .order('triggered_at', { ascending: false })
          .limit(5)
        setRecentActivity(data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your book marketing.</p>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No recent activity yet.</p>
              <p className="text-sm mt-2">Start by generating some content!</p>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.agent_name === 'voiceExtraction' ? 'Voice Analysis' : 'Content Generation'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.status === 'completed'
                      ? `Completed — ${activity.items_created} item(s)`
                      : activity.status === 'running'
                      ? 'In progress...'
                      : 'Failed'}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.triggered_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/generate"
            className="block text-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Generate Content
          </Link>
          <Link href="/dashboard/queue"
            className="block text-center px-4 py-3 bg-white text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">
            Review Queue
          </Link>
          <Link href="/dashboard/connections"
            className="block text-center px-4 py-3 bg-white text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">
            Manage Connections
          </Link>
        </div>
      </div>
    </div>
  )
}
