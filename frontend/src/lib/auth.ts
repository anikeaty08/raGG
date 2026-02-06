import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  user_id: string
  email: string
  name: string
  picture: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  googleClientId: string | null
  authEnabled: boolean
  setUser: (user: User | null, token: string | null) => void
  setAuthConfig: (clientId: string | null, enabled: boolean) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      googleClientId: null,
      authEnabled: false,
      setUser: (user, token) => set({
        user,
        token,
        isAuthenticated: !!user && !!token
      }),
      setAuthConfig: (clientId, enabled) => set({
        googleClientId: clientId,
        authEnabled: enabled
      }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),
    }),
    {
      name: 'rag-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

// Get auth token for API calls
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const state = useAuth.getState()
  return state.token
}

// Get user ID for API calls (falls back to localStorage ID if not authenticated)
export function getEffectiveUserId(): string {
  if (typeof window === 'undefined') return 'anonymous'

  const state = useAuth.getState()
  if (state.isAuthenticated && state.user) {
    return state.user.user_id
  }

  // Fall back to localStorage user ID
  let userId = localStorage.getItem('rag_user_id')
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('rag_user_id', userId)
  }
  return userId
}
