'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Database, Settings, Sparkles, Menu, X, Home, Github, Heart, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { healthCheck } from '@/lib/api'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check backend connection on load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const health = await healthCheck()
        setIsConnected(health.status === 'healthy')
      } catch {
        setIsConnected(false)
      }
    }
    checkConnection()
    // Re-check every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/sources', label: 'Sources', icon: Database },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <html lang="en">
      <head>
        <title>RAG Study Assistant</title>
        <meta name="description" content="AI-powered study assistant with RAG" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl bg-[#15151f]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Sidebar */}
          <aside
            className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-[rgba(255,255,255,0.08)] flex flex-col z-40 transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
          >
            {/* Logo */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg gradient-text">RAG Assistant</h1>
                  <p className="text-xs text-[#64748b]">AI-Powered Learning</p>
                </div>
              </Link>
            </div>

            {/* Connection Status */}
            <div className="px-6 py-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className={`flex items-center gap-2 text-xs font-medium ${
                isConnected === null ? 'text-yellow-400' :
                isConnected ? 'text-emerald-400' : 'text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected === null ? 'bg-yellow-400 animate-pulse' :
                  isConnected ? 'bg-emerald-400' : 'bg-red-400'
                }`} />
                {isConnected === null ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider px-3 mb-3">Menu</p>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
              <div className="card p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <p className="text-sm font-medium text-white mb-1">Pro Tip</p>
                <p className="text-xs text-[#94a3b8]">
                  Upload PDFs, GitHub repos, or web URLs to get AI answers with citations!
                </p>
              </div>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen">
            <main className="flex-1">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a0f]/50 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Left - Branding */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">RAG Study Assistant</p>
                      <p className="text-xs text-[#64748b]">Powered by Gemini 2.5</p>
                    </div>
                  </div>

                  {/* Center - Links */}
                  <div className="flex items-center gap-6">
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                    <a
                      href="https://ai.google.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Gemini API
                    </a>
                  </div>

                  {/* Right - Made with */}
                  <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                    Made with <Heart className="w-4 h-4 text-red-400 fill-red-400" /> using AI
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[#64748b]">
                  <p>&copy; {new Date().getFullYear()} RAG Study Assistant. All rights reserved.</p>
                  <p>Data auto-deletes after 1 hour for privacy</p>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(21, 21, 31, 0.95)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#f8fafc',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
