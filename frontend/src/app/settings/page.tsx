'use client'

import { useState, useEffect } from 'react'
import { Settings, Server, Clock, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, Info } from 'lucide-react'
import { healthCheck, clearAllSources, HealthStatus } from '@/lib/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [clearing, setClearing] = useState(false)

  const checkHealth = async () => {
    setChecking(true)
    try {
      const status = await healthCheck()
      setHealth(status)
    } catch (error) {
      setHealth(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL data? This will remove all sources and cannot be undone.')) {
      return
    }

    setClearing(true)
    try {
      await clearAllSources()
      toast.success('All data cleared successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear data')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-[#94a3b8]">Configure your RAG Study Assistant</p>
      </div>

      {/* Server Status */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Server Status</h2>
              <p className="text-sm text-[#64748b]">Backend connection status</p>
            </div>
          </div>
          <button onClick={checkHealth} disabled={checking} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            Check
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.08)]">
            <span className="text-[#94a3b8]">API Server</span>
            {checking ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#64748b]" />
            ) : health ? (
              <span className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                Disconnected
              </span>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.08)]">
            <span className="text-[#94a3b8]">Vector Store</span>
            {checking ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#64748b]" />
            ) : health?.vector_store === 'connected' ? (
              <span className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                Disconnected
              </span>
            )}
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-[#94a3b8]">API Version</span>
            <span className="text-white font-mono">{health?.version || '-'}</span>
          </div>
        </div>
      </div>

      {/* Auto-Cleanup Info */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Data Retention</h2>
            <p className="text-sm text-[#64748b]">Automatic data cleanup settings</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400 mb-1">Auto-Cleanup Enabled</h3>
              <p className="text-sm text-[#94a3b8]">
                For your privacy, all uploaded data (PDFs, GitHub repos, web pages) is automatically
                deleted <strong className="text-white">1 hour</strong> after it was added. This ensures
                your study materials don't persist on the server indefinitely.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-[#94a3b8]">Retention Period</span>
            <span className="text-white font-medium">1 Hour</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#94a3b8]">Cleanup Frequency</span>
            <span className="text-white font-medium">Every 10 Minutes</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Danger Zone</h2>
            <p className="text-sm text-[#64748b]">Irreversible actions</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-red-500/20">
          <div>
            <h3 className="font-medium mb-1">Clear All Data</h3>
            <p className="text-sm text-[#64748b]">
              Delete all sources and clear the vector store. This cannot be undone.
            </p>
          </div>
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="btn-danger"
          >
            {clearing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Clear All
              </>
            )}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">About</h2>
            <p className="text-sm text-[#64748b]">Application information</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.08)]">
            <span className="text-[#94a3b8]">Application</span>
            <span className="text-white">RAG Study Assistant</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.08)]">
            <span className="text-[#94a3b8]">Version</span>
            <span className="text-white font-mono">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.08)]">
            <span className="text-[#94a3b8]">AI Model</span>
            <span className="text-white">Gemini 2.0 Flash</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.08)]">
            <span className="text-[#94a3b8]">Embeddings</span>
            <span className="text-white">Gemini Text Embedding 004</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#94a3b8]">Vector Database</span>
            <span className="text-white">Qdrant Cloud</span>
          </div>
        </div>
      </div>
    </div>
  )
}
