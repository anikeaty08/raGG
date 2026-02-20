'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { BarChart3, MessageSquare, Database, Clock, TrendingUp, FileText, Github, Globe } from 'lucide-react'
import { listSources, getModelSettings } from '@/lib/api'
import { sessionManager } from '@/lib/sessionManager'
import { Source } from '@/lib/api'

export default function AnalyticsPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const [sourcesData, modelConfig] = await Promise.all([
        listSources(),
        getModelSettings().catch(() => null)
      ])
      setSources(sourcesData)
      const allSessions = sessionManager.getAllSessions()
      setSessions(allSessions)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalMessages = sessions.reduce((acc, session) => acc + (session.messages?.length || 0), 0)
  const totalSessions = sessions.length
  const totalSources = sources.length
  const githubSources = sources.filter(s => s.type === 'github').length
  const pdfSources = sources.filter(s => s.type === 'pdf').length
  const webSources = sources.filter(s => s.type === 'web').length
  const totalChunks = sources.reduce((acc, s) => acc + s.chunks, 0)

  const sourceTypeStats = [
    { type: 'GitHub', count: githubSources, icon: Github, color: 'from-purple-500 to-pink-500' },
    { type: 'PDF', count: pdfSources, icon: FileText, color: 'from-rose-500 to-red-500' },
    { type: 'Web', count: webSources, icon: Globe, color: 'from-emerald-500 to-teal-500' },
  ]

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-indigo-400 animate-pulse mx-auto mb-4" />
            <p className="text-[#94a3b8] dark:text-[#94a3b8] text-pink-700/80">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-[#94a3b8] dark:text-[#94a3b8] text-pink-700/80">Usage statistics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#64748b]">Total Messages</p>
              <p className="text-2xl font-bold">{totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#64748b]">Chat Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#64748b]">Sources</p>
              <p className="text-2xl font-bold">{totalSources}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#64748b]">Total Chunks</p>
              <p className="text-2xl font-bold">{totalChunks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Source Type Breakdown */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Source Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourceTypeStats.map((stat) => {
            const Icon = stat.icon
            const percentage = totalSources > 0 ? (stat.count / totalSources) * 100 : 0
            return (
              <div key={stat.type} className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{stat.type}</p>
                    <p className="text-sm text-[#64748b]">{stat.count} source{stat.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${stat.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-[#64748b] mt-2">{percentage.toFixed(1)}% of total</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <h2 className="font-semibold mb-4">Recent Chat Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-[#94a3b8] text-center py-8">No chat sessions yet</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#64748b]">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {session.messages?.length || 0} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
