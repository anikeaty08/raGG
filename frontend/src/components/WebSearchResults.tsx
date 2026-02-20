'use client'

import { WebSearchResult } from '@/lib/api'

interface WebSearchResultsProps {
  results: WebSearchResult[]
}

export default function WebSearchResults({ results }: WebSearchResultsProps) {
  if (!results || results.length === 0) return null

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">
          Web Search Results ({results.length})
        </h3>
      </div>
      
      <div className="space-y-3">
        {results.map((result, idx) => (
          <a
            key={idx}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 transition-colors"
          >
            <div className="text-xs text-green-600 dark:text-green-400 mb-1 truncate">
              {result.url}
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {result.title}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {result.snippet}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
