import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Source {
  id: string
  name: string
  type: 'github' | 'pdf' | 'web'
  chunks: number
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

// Ingest GitHub repository
export const ingestGitHub = async (url: string, branch: string = 'main'): Promise<IngestResponse> => {
  const response = await api.post('/ingest/github', { url, branch })
  return response.data
}

// Ingest PDF file
export const ingestPDF = async (file: File): Promise<IngestResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/ingest/pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Ingest web URL
export const ingestURL = async (url: string): Promise<IngestResponse> => {
  const response = await api.post('/ingest/url', { url })
  return response.data
}

// Query the knowledge base
export const query = async (
  question: string,
  sessionId?: string,
  topK: number = 5
): Promise<QueryResponse> => {
  const response = await api.post('/query', {
    question,
    session_id: sessionId,
    top_k: topK,
  })
  return response.data
}

// List all sources
export const listSources = async (): Promise<Source[]> => {
  const response = await api.get('/sources')
  return response.data
}

// Delete a source
export const deleteSource = async (sourceId: string): Promise<void> => {
  await api.delete(`/sources/${sourceId}`)
}

// Clear all sources
export const clearAllSources = async (): Promise<void> => {
  await api.delete('/sources')
}

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health')
    return response.data.status === 'healthy'
  } catch {
    return false
  }
}

export default api
