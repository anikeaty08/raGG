'use client'

import { useState } from 'react'
import { WebSearchResult } from '@/lib/api'
import { ChevronDown, Globe } from 'lucide-react'

interface WebSearchResultsProps {
  results: WebSearchResult[]
}

export default function WebSearchResults({ results }: WebSearchResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!results || results.length === 0) return null

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 bg-pink-100/60 border border-emerald-500/20 dark:border-emerald-500/20 border-pink-300/40 text-emerald-600 dark:text-emerald-400 text-pink-700 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/20 hover:bg-pink-100 transition-all"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{results.length} web source{results.length !== 1 ? 's' : ''} used</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-emerald-500/20 dark:border-emerald-500/20 border-pink-300/30">
          {results.map((result, idx) => (
            <a
              key={idx}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2.5 rounded-lg bg-white/50 dark:bg-[rgba(255,255,255,0.03)] hover:bg-white/80 dark:hover:bg-[rgba(255,255,255,0.06)] border border-gray-200/50 dark:border-[rgba(255,255,255,0.06)] transition-colors"
            >
              <div className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-0.5 line-clamp-1">
                {result.title}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-500 line-clamp-1 truncate">
                {result.url}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
