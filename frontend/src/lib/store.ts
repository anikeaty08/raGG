import { create } from 'zustand'
import { Source, Citation } from './api'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: Date
}

interface AppState {
  // Sources
  sources: Source[]
  setSources: (sources: Source[]) => void
  addSource: (source: Source) => void
  removeSource: (sourceId: string) => void

  // Messages
  messages: Message[]
  addMessage: (message: Message) => void
  clearMessages: () => void

  // Session
  sessionId: string | null
  setSessionId: (id: string) => void

  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  isSidebarOpen: boolean
  toggleSidebar: () => void

  activeTab: 'chat' | 'sources'
  setActiveTab: (tab: 'chat' | 'sources') => void
}

export const useStore = create<AppState>((set) => ({
  // Sources
  sources: [],
  setSources: (sources) => set({ sources }),
  addSource: (source) => set((state) => ({ sources: [...state.sources, source] })),
  removeSource: (sourceId) => set((state) => ({
    sources: state.sources.filter((s) => s.id !== sourceId)
  })),

  // Messages
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  clearMessages: () => set({ messages: [] }),

  // Session
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
