'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardOverview() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    followers: 0,
    posts: 0,
    engagement: 0,
    revenue: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await fetchMetrics()
        await fetchRecentActivity()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const fetchMetrics = async () => {
    try {
      // In Phase 6, these will be real API calls
      // For now, showing placeholder data
      setMetrics({
        followers: 1247,
        posts: 48,
        engagement: 8.3,
        revenue: 342
      })
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // In Phase 6, this will fetch from agent_runs table
      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Failed to fetch activity:', error)
        return
      }

      setRecentActivity(data || [])
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your book marketing.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Followers</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.followers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Posts Generated</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.posts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.engagement}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.revenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
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
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.agent_name === 'voiceExtraction' ? 'Voice Analysis' : 'Content Generation'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.status === 'completed' 
                        ? `Completed ${activity.items_created} items`
                        : activity.status === 'running'
                        ? 'In progress...'
                        : 'Failed'
                      }
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.triggered_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/generate"
            className="block text-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            🤖 Generate Content
          </Link>
          <Link
            href="/dashboard/queue"
            className="block text-center px-4 py-3 bg-white text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            📝 Review Queue
          </Link>
          <Link
            href="/dashboard/connections"
            className="block text-center px-4 py-3 bg-white text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            🔗 Manage Connections
          </Link>
        </div>
      </div>
    </div>
  )
}
