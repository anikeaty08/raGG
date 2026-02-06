'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Github, FileText, Globe, Upload, Loader2, CheckCircle, Link } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { ingestGitHub, ingestPDF, ingestURL, listSources } from '@/lib/api'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
}

type SourceType = 'github' | 'pdf' | 'url'

export default function AddSourceModal({ isOpen, onClose }: AddSourceModalProps) {
  const [sourceType, setSourceType] = useState<SourceType>('github')
  const [url, setUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { setSources, addSource } = useStore()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
      return
    }

    setIsLoading(true)
    try {
      const response = await ingestPDF(file)
      const sources = await listSources()
      setSources(sources)
      setSuccess(true)
      toast.success(`Successfully ingested ${file.name}`)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to ingest PDF')
    } finally {
      setIsLoading(false)
    }
  }, [setSources, onClose])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isLoading,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return

    setIsLoading(true)
    try {
      if (sourceType === 'github') {
        await ingestGitHub(url.trim(), branch)
        toast.success('Repository ingested successfully!')
      } else {
        await ingestURL(url.trim())
        toast.success('URL ingested successfully!')
      }

      const sources = await listSources()
      setSources(sources)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setUrl('')
        onClose()
      }, 1500)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to ingest source')
    } finally {
      setIsLoading(false)
    }
  }

  const sourceTypes = [
    { id: 'github', icon: Github, label: 'GitHub', color: 'from-purple-500 to-violet-600' },
    { id: 'pdf', icon: FileText, label: 'PDF', color: 'from-red-500 to-rose-600' },
    { id: 'url', icon: Globe, label: 'Web URL', color: 'from-green-500 to-emerald-600' },
  ] as const

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="glass rounded-3xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold gradient-text">Add New Source</h2>
                  <p className="text-sm text-white/40 mt-1">
                    Import content to study from
                  </p>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-white/50" />
                </motion.button>
              </div>

              {/* Source Type Selector */}
              <div className="p-6 border-b border-white/5">
                <div className="flex gap-3">
                  {sourceTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => setSourceType(type.id)}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        sourceType === type.id
                          ? 'border-transparent'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background:
                          sourceType === type.id
                            ? `linear-gradient(135deg, var(--tw-gradient-stops))`
                            : 'transparent',
                      }}
                    >
                      <div
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                          sourceType === type.id
                            ? 'bg-white/20'
                            : `bg-gradient-to-br ${type.color}`
                        }`}
                      >
                        <type.icon className="w-5 h-5 text-white" />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          sourceType === type.id ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        {type.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                      >
                        <CheckCircle className="w-16 h-16 text-green-400" />
                      </motion.div>
                      <p className="text-lg font-medium text-white mt-4">Source Added!</p>
                      <p className="text-sm text-white/50">Ready to start learning</p>
                    </motion.div>
                  ) : sourceType === 'pdf' ? (
                    <motion.div
                      key="pdf"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div
                        {...getRootProps()}
                        className={`dropzone ${isDragActive ? 'active' : ''} ${
                          isLoading ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload className="w-12 h-12 mx-auto text-white/30 mb-4" />
                        {isDragActive ? (
                          <p className="text-cyan-400">Drop your PDF here...</p>
                        ) : (
                          <>
                            <p className="text-white/70 mb-2">
                              Drag & drop a PDF file here
                            </p>
                            <p className="text-white/40 text-sm">
                              or click to browse
                            </p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="url-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          {sourceType === 'github' ? 'Repository URL' : 'Web URL'}
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                            <Link className="w-5 h-5" />
                          </div>
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={
                              sourceType === 'github'
                                ? 'https://github.com/user/repo'
                                : 'https://docs.example.com'
                            }
                            className="input-modern w-full pl-12"
                            required
                          />
                        </div>
                      </div>

                      {sourceType === 'github' && (
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">
                            Branch (optional)
                          </label>
                          <input
                            type="text"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="main"
                            className="input-modern w-full"
                          />
                        </div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Ingest Source
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Hint */}
              {!success && (
                <div className="px-6 pb-6">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs text-cyan-300/80">
                      {sourceType === 'github'
                        ? '💡 Only public repositories are supported. The repo will be cloned and all code/docs will be indexed.'
                        : sourceType === 'pdf'
                        ? '💡 PDF text will be extracted and split into searchable chunks.'
                        : '💡 Web page content will be scraped and indexed. Works best with documentation sites.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
