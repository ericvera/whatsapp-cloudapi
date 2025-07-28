import { expect, it, vi } from 'vitest'
import { WhatsAppCloudAPIBaseUrl } from './constants.js'
import { uploadMedia } from './uploadMedia.js'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

it('should upload a Blob successfully', async () => {
  // Mock successful response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 'mock_media_123' }),
  })

  const result = await uploadMedia({
    accessToken: 'test-token',
    from: '1234567890',
    file: new Blob(['test'], { type: 'image/jpeg' }),
  })

  expect(result).toEqual({ id: 'mock_media_123' })
  expect(mockFetch).toHaveBeenCalledWith(
    `${WhatsAppCloudAPIBaseUrl}/v22.0/1234567890/media`,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }) as Record<string, string>,
      body: expect.any(FormData) as FormData,
    }),
  )
})

it('should use custom base URL when provided', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 'mock_media_123' }),
  })

  await uploadMedia({
    accessToken: 'test-token',
    from: '1234567890',
    file: new Blob(['test'], { type: 'image/jpeg' }),
    baseUrl: 'http://localhost:4004',
  })

  expect(mockFetch).toHaveBeenCalledWith(
    'http://localhost:4004/v22.0/1234567890/media',
    expect.anything(),
  )
})

it('should reject files that are too large', async () => {
  // 6MB
  const largeBlob = new Blob(['x'.repeat(6 * 1024 * 1024)], {
    type: 'image/jpeg',
  })

  await expect(
    uploadMedia({
      accessToken: 'test-token',
      from: '1234567890',
      file: largeBlob,
    }),
  ).rejects.toThrow('File size too large')
})

it('should reject unsupported MIME types', async () => {
  const unsupportedBlob = new Blob(['test'], { type: 'image/gif' })

  await expect(
    uploadMedia({
      accessToken: 'test-token',
      from: '1234567890',
      file: unsupportedBlob,
    }),
  ).rejects.toThrow('Unsupported MIME type: image/gif')
})

it('should handle API errors', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () =>
      Promise.resolve({
        error: {
          message: 'Invalid access token',
          type: 'OAuthException',
          code: 190,
        },
      }),
  })

  await expect(
    uploadMedia({
      accessToken: 'invalid-token',
      from: '1234567890',
      file: new Blob(['test'], { type: 'image/jpeg' }),
    }),
  ).rejects.toThrow('WhatsApp Media Upload Error')
})

it('should accept PNG images', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 'mock_media_png' }),
  })

  const pngBlob = new Blob(['test png data'], { type: 'image/png' })
  const result = await uploadMedia({
    accessToken: 'test-token',
    from: '1234567890',
    file: pngBlob,
  })

  expect(result).toEqual({ id: 'mock_media_png' })
})
