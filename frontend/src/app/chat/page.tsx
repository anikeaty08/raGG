'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, Bot, User, Sparkles, ChevronDown, FileCode, Loader2, Trash2, Database } from 'lucide-react'
import { query, listSources, Source, Citation } from '@/lib/api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchSources()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSources = async () => {
    try {
      const data = await listSources()
      setSources(data)
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    } finally {
      setSourcesLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    // Allow chat even without sources (general chat mode)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      const response = await query(userInput, sessionId || undefined)
      setSessionId(response.session_id)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      toast.error(error.message || 'Failed to get response')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionId(null)
    toast.success('Chat cleared')
  }

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px'
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(255,255,255,0.08)] bg-[#0a0a0f]/80 backdrop-blur-xl p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Chat</h1>
              <p className="text-xs text-[#64748b]">
                {sourcesLoading ? 'Loading...' : `${sources.length} source${sources.length !== 1 ? 's' : ''} loaded`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <WelcomeScreen sources={sources} sourcesLoading={sourcesLoading} />
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a0f]/80 backdrop-blur-xl p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-2 focus-within:border-indigo-500/50 transition-all">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyDown}
                placeholder={sources.length === 0 ? 'Ask me anything! Add sources for cited answers...' : 'Ask anything about your sources...'}
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-white placeholder-[#64748b] px-4 py-3 max-h-40 min-h-[52px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-[#64748b] mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}

function WelcomeScreen({ sources, sourcesLoading }: { sources: Source[]; sourcesLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center animate-float">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-40" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-4">
        <span className="gradient-text">Ask Anything</span>
      </h2>

      <p className="text-[#94a3b8] max-w-md mb-8">
        {sourcesLoading
          ? 'Loading your sources...'
          : sources.length === 0
          ? 'Start chatting! Add sources like GitHub repos, PDFs, or URLs for answers with citations.'
          : `You have ${sources.length} source${sources.length > 1 ? 's' : ''} loaded. Ask me anything!`
        }
      </p>

      {!sourcesLoading && sources.length === 0 && (
        <div className="flex gap-3">
          <Link href="/sources" className="btn-secondary">
            <Database className="w-4 h-4" />
            Add Sources
          </Link>
        </div>
      )}

      {!sourcesLoading && sources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { icon: '📚', title: 'Learn Faster', desc: 'Get instant answers from your materials' },
            { icon: '🔍', title: 'Find Citations', desc: 'Every answer includes source references' },
            { icon: '💡', title: 'Ask Anything', desc: 'Code, concepts, or implementation details' },
          ].map((item, i) => (
            <div key={i} className="card text-left">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-sm text-[#94a3b8]">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const [showCitations, setShowCitations] = useState(false)

  return (
    <div className={`flex gap-4 fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
            : 'bg-gradient-to-br from-purple-500 to-pink-600'
        }`}
      >
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-5 py-3 ${
            isUser ? 'message-user text-white' : 'message-ai text-white/90'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-left">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 text-left">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <FileCode className="w-4 h-4" />
              {message.citations.length} citation{message.citations.length > 1 ? 's' : ''}
              <ChevronDown className={`w-4 h-4 transition-transform ${showCitations ? 'rotate-180' : ''}`} />
            </button>

            {showCitations && (
              <div className="mt-2 space-y-2">
                {message.citations.map((citation, i) => (
                  <div key={i} className="citation-card">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-indigo-400">
                        {citation.source}
                        {citation.line && `:${citation.line}`}
                        {citation.page && ` (Page ${citation.page})`}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8] line-clamp-2">
                      {citation.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-[#64748b] mt-2 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 fade-in">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="message-ai rounded-2xl">
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
