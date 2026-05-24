import { expect, it, vi } from 'vitest'
import { downloadMedia } from './downloadMedia.js'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

it('downloads media bytes with the Bearer header', async () => {
  const fixture = new Blob(['binary-data'], { type: 'image/jpeg' })
  mockFetch.mockResolvedValueOnce({
    ok: true,
    blob: () => Promise.resolve(fixture),
  })

  const result = await downloadMedia({
    accessToken: 'test_token',
    url: 'https://lookaside.example/abc',
  })

  expect(result).toBe(fixture)
  expect(mockFetch).toHaveBeenCalledWith(
    'https://lookaside.example/abc',
    expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: 'Bearer test_token',
      }) as Record<string, string>,
    }),
  )
})

it('throws on a non-ok response', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: () => Promise.resolve('Not Found'),
  })

  await expect(
    downloadMedia({
      accessToken: 'test_token',
      url: 'https://lookaside.example/abc',
    }),
  ).rejects.toThrow('WhatsApp Media Download Error')
})
