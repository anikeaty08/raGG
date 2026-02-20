'use client'

import { useEffect, useState } from 'react'

interface AgentThinkingProps {
  isThinking: boolean
  plan?: {
    steps?: Array<{ type: string; reason: string }>
    requires_tools?: boolean
  }
}

export default function AgentThinking({ isThinking, plan }: AgentThinkingProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isThinking) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '') return '.'
        if (prev === '.') return '..'
        if (prev === '..') return '...'
        return ''
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isThinking])

  if (!isThinking && !plan) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 bg-pink-50/80 border border-blue-200 dark:border-blue-800 border-pink-200/50 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100 text-pink-800 mb-2">
            {isThinking ? `Agent is thinking${dots}` : 'Execution Plan'}
          </div>
          
          {plan && plan.steps && plan.steps.length > 0 && (
            <div className="space-y-2 mt-2">
              {plan.steps.map((step, idx) => (
                <div key={idx} className="text-xs text-blue-700 dark:text-blue-300 text-pink-700 flex items-center gap-2">
                  <span className="font-mono bg-blue-100 dark:bg-blue-800 bg-pink-100 px-2 py-0.5 rounded">
                    {step.type}
                  </span>
                  <span>{step.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
