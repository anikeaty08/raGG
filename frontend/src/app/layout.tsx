'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Database, Settings, Sparkles, Menu, X, Home } from 'lucide-react'
import { useState, useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

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
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#15151f] border border-[rgba(255,255,255,0.08)]"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Sidebar */}
          <aside
            className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0a0a0f] border-r border-[rgba(255,255,255,0.08)] flex flex-col z-40 transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
          >
            {/* Logo */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg gradient-text">RAG Assistant</h1>
                  <p className="text-xs text-[#64748b]">AI-Powered Learning</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
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

            {/* Footer */}
            <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <div className="status-indicator" />
                <span>Powered by Gemini 2.0</span>
              </div>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-h-screen">
            {children}
          </main>
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
