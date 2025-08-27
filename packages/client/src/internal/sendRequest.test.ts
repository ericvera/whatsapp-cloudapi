import { expect, it, vi } from 'vitest'
import {
  WhatsAppCloudAPIBaseUrl,
  WhatsAppCloudAPIVersion,
} from '../constants.js'
import { createHeaders, sendRequest } from './sendRequest.js'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

it('creates correct headers with access token', () => {
  const headers = createHeaders('test-token')

  expect(headers).toEqual({
    Authorization: 'Bearer test-token',
    'Content-Type': 'application/json',
  })
})

it('sends request with correct URL, method, headers, and body', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockResponse),
  })

  const message = {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    to: '+1234567890',
    type: 'text' as const,
    text: { body: 'Hello World' },
  }

  const result = await sendRequest('test-token', '123456789', message)

  expect(mockFetch).toHaveBeenCalledWith(
    `${WhatsAppCloudAPIBaseUrl}/${WhatsAppCloudAPIVersion}/123456789/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    },
  )

  expect(result).toEqual(mockResponse)
})

it('uses custom base URL when provided', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockResponse),
  })

  const message = {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    to: '+1234567890',
    type: 'text' as const,
    text: { body: 'Hello World' },
  }

  await sendRequest('test-token', '123456789', message, 'http://localhost:5555')

  expect(mockFetch).toHaveBeenCalledWith(
    `http://localhost:5555/${WhatsAppCloudAPIVersion}/123456789/messages`,
    expect.objectContaining({
      method: 'POST',
    }),
  )
})

it('uses default base URL when not provided', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockResponse),
  })

  const message = {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    to: '+1234567890',
    type: 'text' as const,
    text: { body: 'Hello World' },
  }

  await sendRequest('test-token', '123456789', message)

  expect(mockFetch).toHaveBeenCalledWith(
    `${WhatsAppCloudAPIBaseUrl}/${WhatsAppCloudAPIVersion}/123456789/messages`,
    expect.any(Object),
  )
})

it('throws error when response is not ok', async () => {
  const errorResponse = {
    error: {
      message: 'Invalid access token',
      type: 'OAuthException',
      code: 190,
    },
  }

  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve(errorResponse),
  })

  const message = {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    to: '+1234567890',
    type: 'text' as const,
    text: { body: 'Hello World' },
  }

  await expect(
    sendRequest('invalid-token', '123456789', message),
  ).rejects.toThrow(`WhatsApp API Error: ${JSON.stringify(errorResponse)}`)
})

it('properly serializes different message types', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockResponse),
  })

  const templateMessage = {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    to: '+1234567890',
    type: 'template' as const,
    template: {
      name: 'hello_world',
      language: { code: 'en_US' },
    },
  }

  await sendRequest('test-token', '123456789', templateMessage)

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      body: JSON.stringify(templateMessage),
    }),
  )
})

it('handles network errors', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'))

  const message = {
    messaging_product: 'whatsapp' as const,
    recipient_type: 'individual' as const,
    to: '+1234567890',
    type: 'text' as const,
    text: { body: 'Hello World' },
  }

  await expect(sendRequest('test-token', '123456789', message)).rejects.toThrow(
    'Network error',
  )
})
