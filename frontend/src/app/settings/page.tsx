'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Settings, Server, Clock, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, Info, Cpu, Sparkles } from 'lucide-react'
import { healthCheck, clearAllSources, getModelSettings, setModelSettings, getWorkingProviders, HealthStatus, ModelConfig } from '@/lib/api'
import toast from 'react-hot-toast'

const MODEL_INFO = {
  gemini: {
    name: 'Gemini 2.5',
    description: 'Google\'s latest AI model - fast and accurate',
    icon: '✨',
    color: 'from-blue-500 to-cyan-500',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Best balance of speed and quality' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', desc: 'Faster, higher rate limits' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Previous generation fallback' },
    ]
  },
  groq: {
    name: 'LLaMA 3.3 (Groq)',
    description: 'Meta\'s open-source model - runs ultra fast on Groq',
    icon: '🦙',
    color: 'from-orange-500 to-red-500',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B', desc: 'Most capable, best quality' },
      { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', desc: 'Fastest response times' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', desc: 'Great for longer contexts' },
    ]
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Anthropic\'s Claude models - excellent reasoning',
    icon: '🧠',
    color: 'from-purple-500 to-indigo-500',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', desc: 'Best balance of intelligence and speed' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', desc: 'Most capable, complex tasks' },
      { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4', desc: 'Fastest, great for simple tasks' },
    ]
  }
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null)
  const [loadingModel, setLoadingModel] = useState(true)
  const [switchingModel, setSwitchingModel] = useState(false)
  const [workingProviders, setWorkingProviders] = useState<Record<string, string[]> | null>(null)

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

  const loadModelConfig = async () => {
    setLoadingModel(true)
    try {
      const config = await getModelSettings()
      setModelConfig(config)
    } catch (error) {
      console.error('Failed to load model config:', error)
    } finally {
      setLoadingModel(false)
    }
  }

  useEffect(() => {
    checkHealth()
    loadModelConfig()
    getWorkingProviders()
      .then((data) => setWorkingProviders(data.working_providers))
      .catch(() => setWorkingProviders(null))
  }, [])

  const handleSwitchModel = async (provider: string, model?: string) => {
    setSwitchingModel(true)
    try {
      const result = await setModelSettings(provider, model)
      setModelConfig(result)
      toast.success(`Switched to ${MODEL_INFO[provider as keyof typeof MODEL_INFO]?.name || provider}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch model')
    } finally {
      setSwitchingModel(false)
    }
  }

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
        <p className="text-[#94a3b8]">Configure your Neuron assistant</p>
      </div>

      {/* AI Model Selection */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">AI Model</h2>
              <p className="text-sm text-[#64748b]">Choose your LLM provider</p>
            </div>
          </div>
          {loadingModel && <Loader2 className="w-5 h-5 animate-spin text-[#64748b]" />}
        </div>

        {!loadingModel && modelConfig && (
          <div className="space-y-4">
            {/* Provider Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(MODEL_INFO).map(([key, info]) => {
                const isActive = modelConfig.provider === key
                const inWorking = workingProviders === null || workingProviders[key]
                const isAvailable = modelConfig.available_providers.includes(key) && inWorking

                return (
                  <button
                    key={key}
                    onClick={() => !isActive && isAvailable && handleSwitchModel(key)}
                    disabled={!isAvailable || switchingModel}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${isActive
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : isAvailable
                        ? 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)]'
                        : 'border-[rgba(255,255,255,0.05)] opacity-50 cursor-not-allowed'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {info.name}
                          {isActive && (
                            <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">Active</span>
                          )}
                        </h3>
                        <p className="text-xs text-[#64748b]">{info.description}</p>
                      </div>
                    </div>
                    {!modelConfig.available_providers.includes(key) && (
                      <p className="text-xs text-amber-400 mt-2">API key not configured</p>
                    )}
                    {modelConfig.available_providers.includes(key) && !inWorking && workingProviders !== null && (
                      <p className="text-xs text-amber-400 mt-2">API unreachable or model failed</p>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Current Model */}
            <div className="bg-[rgba(255,255,255,0.02)] rounded-xl p-4">
              <p className="text-sm text-[#64748b] mb-2">Current Model</p>
              <p className="text-white font-medium">{modelConfig.model}</p>
            </div>

            {/* Model Variants */}
            {modelConfig.provider && MODEL_INFO[modelConfig.provider as keyof typeof MODEL_INFO] && (
              <div>
                <p className="text-sm text-[#64748b] mb-3">Available Models (working only)</p>
                <div className="space-y-2">
                  {(workingProviders?.[modelConfig.provider]
                    ? MODEL_INFO[modelConfig.provider as keyof typeof MODEL_INFO].models.filter((m) =>
                      workingProviders[modelConfig.provider].includes(m.id)
                    )
                    : MODEL_INFO[modelConfig.provider as keyof typeof MODEL_INFO].models
                  ).map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSwitchModel(modelConfig.provider, model.id)}
                      disabled={switchingModel || modelConfig.model === model.id}
                      className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-all ${modelConfig.model === model.id
                        ? 'bg-indigo-500/20 border border-indigo-500/50'
                        : 'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]'
                        }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{model.name}</p>
                        <p className="text-xs text-[#64748b]">{model.desc}</p>
                      </div>
                      {modelConfig.model === model.id && (
                        <CheckCircle className="w-5 h-5 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
                deleted <strong className="text-white">1 hour</strong> after it was added.
              </p>
            </div>
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
              Delete all sources and clear the vector store.
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
    </div>
  )
}
