import { expect, it, vi } from 'vitest'
import {
  WhatsAppCloudAPIBaseUrl,
  WhatsAppCloudAPIVersion,
} from '../constants.js'
import { apiRequest } from './apiRequest.js'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

it('should GET with the correct URL and Authorization header', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 'media_123', url: 'https://example/x' }),
  })

  const result = await apiRequest<{ id: string; url: string }>({
    accessToken: 'test-token',
    method: 'GET',
    path: 'media_123',
  })

  expect(result).toEqual({ id: 'media_123', url: 'https://example/x' })
  expect(mockFetch).toHaveBeenCalledWith(
    `${WhatsAppCloudAPIBaseUrl}/${WhatsAppCloudAPIVersion}/media_123`,
    expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }) as Record<string, string>,
    }),
  )
  const init = mockFetch.mock.calls[0]?.[1] as RequestInit
  expect(init.body).toBeUndefined()
})

it('should POST a JSON body with Content-Type header', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ messaging_product: 'whatsapp' }),
  })

  await apiRequest({
    accessToken: 'test-token',
    method: 'POST',
    path: '123/block_users',
    body: { messaging_product: 'whatsapp', block_users: [{ user: '+1' }] },
  })

  expect(mockFetch).toHaveBeenCalledWith(
    `${WhatsAppCloudAPIBaseUrl}/${WhatsAppCloudAPIVersion}/123/block_users`,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      }) as Record<string, string>,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        block_users: [{ user: '+1' }],
      }),
    }),
  )
})

it('should DELETE with a JSON body', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })

  const result = await apiRequest<{ success: boolean }>({
    accessToken: 'test-token',
    method: 'DELETE',
    path: '123/block_users',
    body: { messaging_product: 'whatsapp', block_users: [{ user: '+1' }] },
  })

  expect(result).toEqual({ success: true })
  expect(mockFetch).toHaveBeenCalledWith(
    `${WhatsAppCloudAPIBaseUrl}/${WhatsAppCloudAPIVersion}/123/block_users`,
    expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        block_users: [{ user: '+1' }],
      }),
    }),
  )
})

it('should DELETE without a body', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })

  await apiRequest({
    accessToken: 'test-token',
    method: 'DELETE',
    path: 'media_123',
  })

  expect(mockFetch).toHaveBeenCalledWith(
    `${WhatsAppCloudAPIBaseUrl}/${WhatsAppCloudAPIVersion}/media_123`,
    expect.objectContaining({
      method: 'DELETE',
    }),
  )
  const init = mockFetch.mock.calls[0]?.[1] as RequestInit
  expect(init.body).toBeUndefined()
})

it('should honor a custom base URL', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 'media_123' }),
  })

  await apiRequest({
    accessToken: 'test-token',
    method: 'GET',
    path: 'media_123',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockFetch).toHaveBeenCalledWith(
    `http://localhost:4004/${WhatsAppCloudAPIVersion}/media_123`,
    expect.anything(),
  )
})

it('should throw on a non-ok response', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () =>
      Promise.resolve({
        error: { message: 'Invalid access token', code: 190 },
      }),
  })

  await expect(
    apiRequest({
      accessToken: 'invalid-token',
      method: 'GET',
      path: 'media_123',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: WhatsApp API Error: {"error":{"message":"Invalid access token","code":190}}]`,
  )
})
