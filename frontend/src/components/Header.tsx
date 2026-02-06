'use client'

import { motion } from 'framer-motion'
import { Sparkles, Menu, Github, BookOpen, Globe } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function Header() {
  const { toggleSidebar, sources } = useStore()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 blur-lg opacity-50" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">RAG Study Assistant</h1>
              <p className="text-xs text-white/50">AI-Powered Learning</p>
            </div>
          </motion.div>

          {/* Center - Source Stats */}
          <div className="hidden md:flex items-center gap-6">
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full glass"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/70">
                {sources.length} {sources.length === 1 ? 'Source' : 'Sources'} Loaded
              </span>
            </motion.div>

            <div className="flex items-center gap-2">
              {sources.filter(s => s.type === 'github').length > 0 && (
                <span className="source-badge github">
                  <Github className="w-3 h-3" />
                  {sources.filter(s => s.type === 'github').length}
                </span>
              )}
              {sources.filter(s => s.type === 'pdf').length > 0 && (
                <span className="source-badge pdf">
                  <BookOpen className="w-3 h-3" />
                  {sources.filter(s => s.type === 'pdf').length}
                </span>
              )}
              {sources.filter(s => s.type === 'web').length > 0 && (
                <span className="source-badge web">
                  <Globe className="w-3 h-3" />
                  {sources.filter(s => s.type === 'web').length}
                </span>
              )}
            </div>
          </div>

          {/* Right - Menu */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={toggleSidebar}
              className="p-2 rounded-lg glass-hover transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
