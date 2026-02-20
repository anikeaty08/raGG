export interface ChatSession {
  id: string
  name: string
  messages: any[]
  sessionId: string | null
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'rag_chat_sessions'

export const sessionManager = {
  getAllSessions(): ChatSession[] {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  getSession(id: string): ChatSession | null {
    const sessions = this.getAllSessions()
    return sessions.find(s => s.id === id) || null
  },

  createSession(name?: string): ChatSession {
    const session: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: name || `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      sessionId: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const sessions = this.getAllSessions()
    sessions.unshift(session) // Add to beginning
    this.saveSessions(sessions)
    return session
  },

  updateSession(id: string, updates: Partial<ChatSession>): void {
    const sessions = this.getAllSessions()
    const index = sessions.findIndex(s => s.id === id)
    if (index !== -1) {
      sessions[index] = {
        ...sessions[index],
        ...updates,
        updatedAt: Date.now()
      }
      this.saveSessions(sessions)
    }
  },

  deleteSession(id: string): void {
    const sessions = this.getAllSessions()
    const filtered = sessions.filter(s => s.id !== id)
    this.saveSessions(filtered)
  },

  renameSession(id: string, name: string): void {
    this.updateSession(id, { name })
  },

  saveSessions(sessions: ChatSession[]): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('Failed to save sessions:', error)
    }
  }
}
