'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Plus, Github, FileText, Globe, Trash2, X, Upload, Loader2, Bot, User, ChevronDown, Sparkles } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Source {
  id: string
  name: string
  type: string
  chunks: number
}

interface Citation {
  source: string
  content: string
  line?: number
  page?: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSources()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSources = async () => {
    try {
      const res = await fetch(`${API_URL}/sources`)
      if (res.ok) {
        const data = await res.json()
        setSources(data)
      }
    } catch (e) {
      console.error('Failed to fetch sources')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (sources.length === 0) {
      toast.error('Add a source first')
      return
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, session_id: sessionId })
      })
      const data = await res.json()
      if (res.ok) {
        setSessionId(data.session_id)
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          citations: data.citations
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        toast.error(data.detail || 'Failed to get response')
      }
    } catch (e) {
      toast.error('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSource = async (id: string) => {
    try {
      await fetch(`${API_URL}/sources/${id}`, { method: 'DELETE' })
      fetchSources()
      toast.success('Source deleted')
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="flex h-screen">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a' } }} />

      {/* Sidebar */}
      <aside className="w-72 border-r border-[#2a2a2a] flex flex-col bg-[#0f0f0f]">
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold gradient-text">RAG Study Assistant</span>
          </div>
        </div>

        <div className="p-4">
          <button onClick={() => setShowAddModal(true)} className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Source
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Sources ({sources.length})</p>
          {sources.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-8">No sources added yet</p>
          ) : (
            sources.map(source => (
              <div key={source.id} className="card p-3 flex items-center justify-between group">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`badge ${source.type === 'github' ? 'badge-github' : source.type === 'pdf' ? 'badge-pdf' : 'badge-web'}`}>
                    {source.type === 'github' ? <Github className="w-3 h-3" /> : source.type === 'pdf' ? <FileText className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  </span>
                  <span className="text-sm truncate">{source.name}</span>
                </div>
                <button onClick={() => deleteSource(source.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#2a2a2a] text-xs text-zinc-600">
          Powered by Gemini 2.0
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to RAG Study Assistant</h1>
              <p className="text-zinc-500 max-w-md mb-8">
                Add a GitHub repo, PDF, or URL to get started. Then ask questions and get answers with citations.
              </p>
              <div className="flex gap-4">
                <div className="card text-center p-4 w-40">
                  <Github className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm">GitHub Repos</p>
                </div>
                <div className="card text-center p-4 w-40">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-red-400" />
                  <p className="text-sm">PDF Files</p>
                </div>
                <div className="card text-center p-4 w-40">
                  <Globe className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">Web Pages</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="message-ai p-4 flex gap-1">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={sources.length ? "Ask anything about your sources..." : "Add a source first..."}
              disabled={sources.length === 0 || isLoading}
              className="input flex-1"
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading || sources.length === 0} className="btn-primary px-4">
              {isLoading ? <Loader2 className="w-5 h-5 spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </main>

      {/* Add Source Modal */}
      {showAddModal && <AddSourceModal onClose={() => { setShowAddModal(false); fetchSources(); }} />}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const [showCitations, setShowCitations] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-gradient-to-br from-indigo-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'message-user' : 'message-ai'} p-4`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3">
            <button onClick={() => setShowCitations(!showCitations)} className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300">
              {message.citations.length} citation{message.citations.length > 1 ? 's' : ''}
              <ChevronDown className={`w-3 h-3 transition ${showCitations ? 'rotate-180' : ''}`} />
            </button>
            {showCitations && (
              <div className="mt-2 space-y-2">
                {message.citations.map((c, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-black/20 border border-white/5">
                    <span className="text-indigo-400">{c.source}{c.line && `:${c.line}`}{c.page && ` (p.${c.page})`}</span>
                    <p className="text-zinc-400 mt-1 line-clamp-2">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddSourceModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'github' | 'pdf' | 'url'>('github')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async () => {
    if (type === 'pdf' && !file) return
    if (type !== 'pdf' && !url.trim()) return

    setLoading(true)
    try {
      if (type === 'pdf' && file) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingest/pdf`, { method: 'POST', body: formData })
        if (!res.ok) throw new Error((await res.json()).detail)
        toast.success('PDF uploaded!')
      } else {
        const endpoint = type === 'github' ? '/ingest/github' : '/ingest/url'
        const body = type === 'github' ? { url, branch: 'main' } : { url }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error((await res.json()).detail)
        toast.success('Source added!')
      }
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to add source')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Add Source</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['github', 'pdf', 'url'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${type === t ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {t === 'github' ? 'GitHub' : t === 'pdf' ? 'PDF' : 'URL'}
            </button>
          ))}
        </div>

        {type === 'pdf' ? (
          <div className="dropzone" onClick={() => document.getElementById('file-input')?.click()}>
            <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500" />
            <p className="text-sm text-zinc-400">{file ? file.name : 'Click or drag PDF here'}</p>
          </div>
        ) : (
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={type === 'github' ? 'https://github.com/user/repo' : 'https://example.com'}
            className="input"
          />
        )}

        <button onClick={handleSubmit} disabled={loading || (type === 'pdf' ? !file : !url.trim())} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 spin" /> Processing...</> : <><Plus className="w-4 h-4" /> Add Source</>}
        </button>
      </div>
    </div>
  )
}
