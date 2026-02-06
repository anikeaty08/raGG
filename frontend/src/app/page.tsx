'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Database, Github, FileText, Globe, ArrowRight, Sparkles, Zap, Shield, Clock } from 'lucide-react'
import { listSources, healthCheck, Source } from '@/lib/api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([])
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const health = await healthCheck()
        setIsHealthy(health.status === 'healthy')
        const data = await listSources()
        setSources(data)
      } catch (error) {
        setIsHealthy(false)
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const stats = {
    totalSources: sources.length,
    github: sources.filter(s => s.type === 'github').length,
    pdf: sources.filter(s => s.type === 'pdf').length,
    web: sources.filter(s => s.type === 'web').length,
    totalChunks: sources.reduce((acc, s) => acc + s.chunks, 0),
  }

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get instant answers powered by semantic search and AI',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Accurate Citations',
      description: 'Every answer comes with source references',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Clock,
      title: 'Auto Cleanup',
      description: 'Data automatically expires after 1 hour for privacy',
      color: 'from-blue-500 to-cyan-500',
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            isHealthy === null ? 'bg-yellow-500/20 text-yellow-400' :
            isHealthy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isHealthy === null ? 'bg-yellow-400' :
              isHealthy ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {isHealthy === null ? 'Checking...' : isHealthy ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <p className="text-[#94a3b8]">Welcome to your AI-powered study assistant</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/chat" className="card card-interactive group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Start Chatting</h3>
                <p className="text-sm text-[#94a3b8]">Ask questions about your sources</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#64748b] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href="/sources" className="card card-interactive group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Manage Sources</h3>
                <p className="text-sm text-[#94a3b8]">Add GitHub repos, PDFs, or URLs</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#64748b] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-card-value">{loading ? '-' : stats.totalSources}</div>
          <div className="stat-card-label">Total Sources</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{loading ? '-' : stats.totalChunks}</div>
          <div className="stat-card-label">Total Chunks</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-purple-400" />
            <span className="stat-card-value text-2xl">{loading ? '-' : stats.github}</span>
          </div>
          <div className="stat-card-label">GitHub Repos</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" />
            <span className="stat-card-value text-2xl">{loading ? '-' : stats.pdf}</span>
          </div>
          <div className="stat-card-label">PDF Files</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span className="stat-card-value text-2xl">{loading ? '-' : stats.web}</span>
          </div>
          <div className="stat-card-label">Web Pages</div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="card">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-[#94a3b8]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sources */}
      {sources.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Sources</h2>
            <Link href="/sources" className="text-sm text-indigo-400 hover:text-indigo-300 transition">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {sources.slice(0, 5).map((source) => (
              <div key={source.id} className="card py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    source.type === 'github' ? 'badge-github' :
                    source.type === 'pdf' ? 'badge-pdf' : 'badge-web'
                  }`}>
                    {source.type === 'github' ? <Github className="w-3 h-3" /> :
                     source.type === 'pdf' ? <FileText className="w-3 h-3" /> :
                     <Globe className="w-3 h-3" />}
                    {source.type}
                  </span>
                  <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">
                    {source.name}
                  </span>
                </div>
                <span className="text-xs text-[#64748b]">{source.chunks} chunks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && sources.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No sources yet</h3>
          <p className="text-[#94a3b8] mb-6 max-w-md mx-auto">
            Add your first source to get started. You can add GitHub repositories, PDF files, or web URLs.
          </p>
          <Link href="/sources" className="btn-primary">
            <Database className="w-4 h-4" />
            Add Your First Source
          </Link>
        </div>
      )}
    </div>
  )
}
