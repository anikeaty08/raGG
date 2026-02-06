'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, User, Bot, FileCode, ChevronDown } from 'lucide-react'
import { useStore, Message } from '@/lib/store'
import { query } from '@/lib/api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ChatInterface() {
  const [input, setInput] = useState('')
  const { messages, addMessage, isLoading, setIsLoading, sessionId, setSessionId, sources } = useStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (sources.length === 0) {
      toast.error('Please add a source first')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    addMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      const response = await query(input.trim(), sessionId || undefined)
      setSessionId(response.session_id)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        timestamp: new Date(),
      }

      addMessage(assistantMessage)
    } catch (error) {
      toast.error('Failed to get response')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pt-16">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} index={index} />
              ))}
            </AnimatePresence>
          )}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 bg-dark-400/50 backdrop-blur-xl p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="glass rounded-2xl p-2 focus-within:glow-border transition-all">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={sources.length === 0 ? "Add a source first..." : "Ask anything about your sources..."}
                  disabled={sources.length === 0 || isLoading}
                  rows={1}
                  className="flex-1 bg-transparent resize-none outline-none text-white placeholder-white/30 px-4 py-3 max-h-40 min-h-[52px]"
                  style={{ height: 'auto' }}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading || sources.length === 0}
                  className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>
            <p className="text-xs text-white/30 mt-2 text-center">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function WelcomeScreen() {
  const { sources } = useStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <motion.div
        className="relative mb-8"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 blur-2xl opacity-40" />
      </motion.div>

      <h2 className="text-3xl font-bold mb-4">
        <span className="gradient-text">Welcome to RAG Study Assistant</span>
      </h2>

      <p className="text-white/50 max-w-md mb-8">
        {sources.length === 0
          ? 'Add a GitHub repository, PDF, or documentation URL to get started. Then ask any questions about your sources!'
          : `You have ${sources.length} source${sources.length > 1 ? 's' : ''} loaded. Start asking questions!`
        }
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        {[
          { icon: '📚', title: 'Learn Faster', desc: 'Get instant answers from your materials' },
          { icon: '🔍', title: 'Find Citations', desc: 'Every answer includes source references' },
          { icon: '💡', title: 'Ask Anything', desc: 'Code, concepts, or implementation details' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 card-3d"
          >
            <div className="text-4xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-white mb-1">{item.title}</h3>
            <p className="text-sm text-white/40">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user'
  const [showCitations, setShowCitations] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <motion.div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
            : 'bg-gradient-to-br from-purple-500 to-pink-600'
        }`}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </motion.div>

      {/* Message */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-5 py-3 ${
            isUser
              ? 'message-user text-white'
              : 'message-ai text-white/90'
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const inline = !match
                    return !inline ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match ? match[1] : 'text'}
                        PreTag="div"
                        className="rounded-lg !bg-black/30 !mt-2 !mb-2"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300" {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <motion.div className="mt-3">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <FileCode className="w-4 h-4" />
              {message.citations.length} citation{message.citations.length > 1 ? 's' : ''}
              <motion.div animate={{ rotate: showCitations ? 180 : 0 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showCitations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-2 overflow-hidden"
                >
                  {message.citations.map((citation, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="citation-card"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-cyan-400">
                          {citation.source}
                          {citation.line && `:${citation.line}`}
                          {citation.page && ` (Page ${citation.page})`}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-2">
                        {citation.content}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-white/30 mt-2 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4"
    >
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
    </motion.div>
  )
}
