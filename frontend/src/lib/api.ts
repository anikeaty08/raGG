const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Get auth state for API calls
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  // Try to get token from auth store
  const authData = localStorage.getItem('rag-auth')
  if (authData) {
    try {
      const parsed = JSON.parse(authData)
      if (parsed.state?.token) {
        return { 'Authorization': `Bearer ${parsed.state.token}` }
      }
    } catch {}
  }

  // Fall back to X-User-ID header
  let userId = localStorage.getItem('rag_user_id')
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('rag_user_id', userId)
  }
  return { 'X-User-ID': userId }
}

export interface Source {
  id: string
  name: string
  type: 'github' | 'pdf' | 'web'
  chunks: number
  created_at?: string
  expires_at?: string
}

export interface Citation {
  source: string
  content: string
  line?: number
  page?: number
}

export interface QueryResponse {
  answer: string
  citations: Citation[]
  session_id: string
}

export interface IngestResponse {
  message: string
  source_id: string
  chunks_created: number
}

export interface HealthStatus {
  status: string
  version: string
  vector_store: string
}

// Helper function for API calls with error handling
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const authHeaders = getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure the backend is running.')
    }
    throw error
  }
}

// Health check
export const healthCheck = async (): Promise<HealthStatus> => {
  return apiCall<HealthStatus>('/health')
}

// Ingest GitHub repository
export const ingestGitHub = async (url: string, branch: string = 'main'): Promise<IngestResponse> => {
  return apiCall<IngestResponse>('/ingest/github', {
    method: 'POST',
    body: JSON.stringify({ url, branch }),
  })
}

// Ingest PDF file
export const ingestPDF = async (file: File): Promise<IngestResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const authHeaders = getAuthHeaders()
  const response = await fetch(`${API_URL}/ingest/pdf`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to upload PDF')
  }

  return response.json()
}

// Ingest web URL
export const ingestURL = async (url: string): Promise<IngestResponse> => {
  return apiCall<IngestResponse>('/ingest/url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

// Query the knowledge base
export const query = async (
  question: string,
  sessionId?: string,
  topK: number = 5
): Promise<QueryResponse> => {
  return apiCall<QueryResponse>('/query', {
    method: 'POST',
    body: JSON.stringify({
      question,
      session_id: sessionId,
      top_k: topK,
    }),
  })
}

// List all sources
export const listSources = async (): Promise<Source[]> => {
  return apiCall<Source[]>('/sources')
}

// Delete a source
export const deleteSource = async (sourceId: string): Promise<void> => {
  await apiCall<{ message: string }>(`/sources/${sourceId}`, {
    method: 'DELETE',
  })
}

// Clear all sources
export const clearAllSources = async (): Promise<void> => {
  await apiCall<{ message: string }>('/sources', {
    method: 'DELETE',
  })
}

// Cleanup expired sources
export const cleanupExpiredSources = async (): Promise<{ deleted: number }> => {
  return apiCall<{ deleted: number }>('/sources/cleanup', {
    method: 'POST',
  })
}

// Get auth config from backend
export const getAuthConfig = async (): Promise<{ google_client_id: string; auth_enabled: boolean }> => {
  return apiCall<{ google_client_id: string; auth_enabled: boolean }>('/auth/config')
}

// Get current user info
export const getCurrentUser = async (): Promise<{
  user_id: string
  email: string
  name: string
  picture: string
  authenticated: boolean
}> => {
  return apiCall('/auth/me')
}

// Model settings
export interface ModelConfig {
  provider: string
  model: string
  available_providers: string[]
}

export const getModelSettings = async (): Promise<ModelConfig> => {
  return apiCall<ModelConfig>('/settings/model')
}

export const setModelSettings = async (provider: string, model?: string): Promise<ModelConfig & { message: string }> => {
  return apiCall('/settings/model', {
    method: 'POST',
    body: JSON.stringify({ provider, model }),
  })
}

export default {
  healthCheck,
  ingestGitHub,
  ingestPDF,
  ingestURL,
  query,
  listSources,
  deleteSource,
  clearAllSources,
  cleanupExpiredSources,
  getAuthConfig,
  getCurrentUser,
}
