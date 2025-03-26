import { beforeEach, expect, it, vi } from 'vitest'
import { sendTextMessage } from './sentTextMessage.js'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Reset mocks before each test
beforeEach(() => {
  mockFetch.mockReset()
})

it('sends a text message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  const response = await sendTextMessage(
    'test_token',
    '123456789',
    '+1234567890',
    'Hello World',
  )

  expect(mockFetch).toHaveBeenCalledWith(
    'https://graph.facebook.com/v22.0/123456789/messages',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test_token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'text',
        text: {
          body: 'Hello World',
        },
      }),
    },
  )

  expect(response).toEqual(mockResponse)
})

it('sends a text message with preview URL enabled', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  await sendTextMessage(
    'test_token',
    '123456789',
    '+1234567890',
    'Check https://example.com',
    true,
  )

  const mockCall = mockFetch.mock.calls[0] as [string, { body: string }]
  const requestBody = JSON.parse(mockCall[1].body) as {
    text: { preview_url: boolean }
  }
  expect(requestBody.text.preview_url).toBe(true)
})

it('throws an error when API request fails', async () => {
  const errorResponse = {
    error: {
      message: 'Invalid auth token',
      type: 'OAuthException',
      code: 190,
    },
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(errorResponse), { status: 401 }),
  )

  await expect(
    sendTextMessage('invalid_token', '123456789', '+1234567890', 'Hello World'),
  ).rejects.toThrow(`WhatsApp API Error: ${JSON.stringify(errorResponse)}`)
})
