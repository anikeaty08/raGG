import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RAG Study Assistant | AI-Powered Learning',
  description: 'Ingest any GitHub repo, PDF, or documentation and get AI-powered answers with citations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Animated Background Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Main Content */}
        <main className="relative z-10">
          {children}
        </main>

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
            },
            success: {
              iconTheme: {
                primary: '#0ea5e9',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f8fafc',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
