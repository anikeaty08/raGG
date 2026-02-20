/**
 * @jest-environment jsdom
 */

import { healthCheck, query, listSources } from '../src/lib/api'

// Mock fetch
global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockResponse = {
        status: 'healthy',
        version: '1.0.0',
        vector_store: 'connected'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await healthCheck()
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      )
    })

    it('should handle errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(healthCheck()).rejects.toThrow()
    })
  })

  describe('query', () => {
    it('should send query request', async () => {
      const mockResponse = {
        answer: 'Test answer',
        citations: [],
        session_id: 'test-session'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await query('Test question')
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/query'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test question')
        })
      )
    })
  })

  describe('listSources', () => {
    it('should fetch sources', async () => {
      const mockSources = [
        { id: '1', name: 'Test', type: 'pdf', chunks: 10 }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSources
      })

      const result = await listSources()
      expect(result).toEqual(mockSources)
    })
  })
})
