'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Github, FileText, Globe, Trash2, Plus,
  MessageSquare, Database, ChevronRight, Loader2
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useState } from 'react'
import { deleteSource, listSources } from '@/lib/api'
import toast from 'react-hot-toast'

interface SidebarProps {
  onAddSource: () => void
}

export default function Sidebar({ onAddSource }: SidebarProps) {
  const {
    isSidebarOpen, toggleSidebar, sources, setSources,
    activeTab, setActiveTab, clearMessages
  } = useStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteSource = async (sourceId: string) => {
    setDeletingId(sourceId)
    try {
      await deleteSource(sourceId)
      const updatedSources = await listSources()
      setSources(updatedSources)
      toast.success('Source deleted')
    } catch (error) {
      toast.error('Failed to delete source')
    } finally {
      setDeletingId(null)
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Github className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'web':
        return <Globe className="w-4 h-4" />
      default:
        return <Database className="w-4 h-4" />
    }
  }

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'github':
        return 'from-purple-500 to-violet-600'
      case 'pdf':
        return 'from-red-500 to-rose-600'
      case 'web':
        return 'from-green-500 to-emerald-600'
      default:
        return 'from-cyan-500 to-blue-600'
    }
  }

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 sidebar z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-lg font-semibold gradient-text">Dashboard</h2>
              <motion.button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-white/70" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-2 border-b border-white/5">
              <motion.button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('sources')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                  activeTab === 'sources'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Database className="w-4 h-4" />
                Sources
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'sources' ? (
                <div className="space-y-3">
                  {/* Add Source Button */}
                  <motion.button
                    onClick={onAddSource}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/50 transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center gap-2 text-white/50 group-hover:text-cyan-400">
                      <Plus className="w-5 h-5" />
                      <span>Add New Source</span>
                    </div>
                  </motion.button>

                  {/* Sources List */}
                  {sources.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="w-12 h-12 mx-auto text-white/20 mb-3" />
                      <p className="text-white/40 text-sm">No sources added yet</p>
                      <p className="text-white/30 text-xs mt-1">
                        Add a GitHub repo, PDF, or URL to get started
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {sources.map((source, index) => (
                        <motion.div
                          key={source.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.05 }}
                          className="group relative"
                        >
                          <div className="glass rounded-xl p-4 hover:bg-white/5 transition-all">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${getSourceColor(source.type)}`}>
                                {getSourceIcon(source.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-white truncate">
                                  {source.name}
                                </h3>
                                <p className="text-xs text-white/40 mt-1">
                                  {source.chunks} chunks indexed
                                </p>
                              </div>
                              <motion.button
                                onClick={() => handleDeleteSource(source.id)}
                                disabled={deletingId === source.id}
                                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {deletingId === source.id ? (
                                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* New Chat Button */}
                  <motion.button
                    onClick={clearMessages}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center gap-2 text-cyan-400">
                      <Plus className="w-5 h-5" />
                      <span>New Chat</span>
                    </div>
                  </motion.button>

                  {/* Tips */}
                  <div className="mt-6 space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-white/30 font-medium">
                      Quick Tips
                    </h3>
                    {[
                      'Ask about specific functions or classes',
                      'Request code explanations',
                      'Ask for implementation details',
                      'Compare different approaches',
                    ].map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2 text-sm text-white/40"
                      >
                        <ChevronRight className="w-4 h-4 text-cyan-500" />
                        {tip}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center justify-between text-xs text-white/30">
                <span>Powered by Gemini AI</span>
                <span>v1.0.0</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
