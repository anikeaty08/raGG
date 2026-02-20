'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Github, FileText, Globe, Trash2, X, Upload, Loader2, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import { listSources, deleteSource, clearAllSources, ingestGitHub, ingestPDF, ingestURL, Source } from '@/lib/api'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchSources = async () => {
    try {
      const data = await listSources()
      setSources(data)
    } catch (error) {
      toast.error('Failed to fetch sources')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    setDeleting(id)
    try {
      await deleteSource(id)
      setSources(prev => prev.filter(s => s.id !== id))
      toast.success('Source deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete source')
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL sources? This cannot be undone.')) return

    try {
      await clearAllSources()
      setSources([])
      toast.success('All sources cleared')
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear sources')
    }
  }

  const stats = {
    total: sources.length,
    github: sources.filter(s => s.type === 'github').length,
    pdf: sources.filter(s => s.type === 'pdf').length,
    web: sources.filter(s => s.type === 'web').length,
    chunks: sources.reduce((acc, s) => acc + s.chunks, 0),
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sources</h1>
          <p className="text-[#94a3b8] dark:text-[#94a3b8] text-pink-700/80">Manage your knowledge base sources</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchSources} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-card-value">{loading ? '-' : stats.total}</div>
          <div className="stat-card-label">Total Sources</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{loading ? '-' : stats.chunks}</div>
          <div className="stat-card-label">Total Chunks</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-purple-400" />
            <span className="stat-card-value text-2xl">{loading ? '-' : stats.github}</span>
          </div>
          <div className="stat-card-label">GitHub</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" />
            <span className="stat-card-value text-2xl">{loading ? '-' : stats.pdf}</span>
          </div>
          <div className="stat-card-label">PDFs</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span className="stat-card-value text-2xl">{loading ? '-' : stats.web}</span>
          </div>
          <div className="stat-card-label">Web</div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-400 mb-1">Auto-Cleanup Enabled</h3>
            <p className="text-sm text-[#94a3b8]">
              For privacy, all uploaded data is automatically deleted 1 hour after creation.
              Make sure to finish your study session within this time.
            </p>
          </div>
        </div>
      </div>

      {/* Sources List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card flex items-center gap-4">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-5 w-48 mb-2" />
                <div className="skeleton h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertCircle className="w-10 h-10 text-[#64748b]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No sources yet</h3>
          <p className="text-[#94a3b8] mb-6 max-w-md mx-auto">
            Add your first source to start building your knowledge base. You can add GitHub repositories, PDF files, or web URLs.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Your First Source
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {sources.map((source) => (
              <div key={source.id} className="card py-4 px-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    source.type === 'github' ? 'bg-purple-500/20' :
                    source.type === 'pdf' ? 'bg-rose-500/20' : 'bg-emerald-500/20'
                  }`}>
                    {source.type === 'github' ? <Github className="w-6 h-6 text-purple-400" /> :
                     source.type === 'pdf' ? <FileText className="w-6 h-6 text-rose-400" /> :
                     <Globe className="w-6 h-6 text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="font-medium truncate max-w-[300px] md:max-w-[500px]">{source.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`badge ${
                        source.type === 'github' ? 'badge-github' :
                        source.type === 'pdf' ? 'badge-pdf' : 'badge-web'
                      }`}>
                        {source.type}
                      </span>
                      <span className="text-xs text-[#64748b]">{source.chunks} chunks</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(source.id, source.name)}
                  disabled={deleting === source.id}
                  className="p-2 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  {deleting === source.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {sources.length > 0 && (
            <div className="flex justify-end">
              <button onClick={handleClearAll} className="btn-danger">
                <Trash2 className="w-4 h-4" />
                Clear All Sources
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchSources()
          }}
        />
      )}
    </div>
  )
}

function AddSourceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState<'github' | 'pdf' | 'url'>('github')
  const [url, setUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (type === 'pdf' && !file) return
    if (type !== 'pdf' && !url.trim()) return

    setLoading(true)
    try {
      if (type === 'github') {
        await ingestGitHub(url, branch)
        toast.success('GitHub repository added!')
      } else if (type === 'pdf' && file) {
        await ingestPDF(file)
        toast.success('PDF uploaded!')
      } else if (type === 'url') {
        await ingestURL(url)
        toast.success('URL added!')
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add source')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Source</h2>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Source Type Tabs */}
        <div className="tab-list mb-6">
          {(['github', 'pdf', 'url'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`tab ${type === t ? 'active' : ''}`}
            >
              {t === 'github' ? (
                <span className="flex items-center justify-center gap-2">
                  <Github className="w-4 h-4" /> GitHub
                </span>
              ) : t === 'pdf' ? (
                <span className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> PDF
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Globe className="w-4 h-4" /> URL
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {type === 'github' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Repository URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  placeholder="main"
                  className="input"
                />
              </div>
              <p className="text-xs text-[#64748b]">
                Only public repositories are supported. The repository will be cloned and indexed.
              </p>
            </div>
          )}

          {type === 'pdf' && (
            <div>
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'dragging' : ''} ${file ? 'active' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-[#64748b]" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : isDragActive ? (
                  <p className="text-sm text-indigo-400">Drop your PDF here...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">Drag & drop your PDF here</p>
                    <p className="text-xs text-[#64748b]">or click to browse</p>
                  </>
                )}
              </div>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-400 hover:text-red-300 mt-2"
                >
                  Remove file
                </button>
              )}
            </div>
          )}

          {type === 'url' && (
            <div>
              <label className="block text-sm font-medium mb-2">Web URL</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/documentation"
                className="input"
                required
              />
              <p className="text-xs text-[#64748b] mt-2">
                The page content will be scraped and indexed. Works best with documentation pages.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (type === 'pdf' ? !file : !url.trim())}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Source
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
