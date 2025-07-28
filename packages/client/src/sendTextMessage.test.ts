import { expect, it, vi } from 'vitest'
import { sendTextMessage } from './sentTextMessage.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('sends a text message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendTextMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    text: 'Hello World',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'text',
      text: {
        body: 'Hello World',
      },
    },
    undefined,
  )
})

it('sends a text message with custom baseUrl', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTextMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    text: 'Hello World',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.anything(),
    'http://localhost:4004',
  )
})

it('uses default baseUrl when not provided', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTextMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    text: 'Hello World',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.anything(),
    undefined,
  )
})

it('sends a text message with preview URL enabled', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTextMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    text: 'Check https://example.com',
    previewUrl: true,
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'text',
      text: {
        body: 'Check https://example.com',
        preview_url: true,
      },
    },
    undefined,
  )
})

it('sends a text message with bizOpaqueCallbackData', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTextMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    text: 'Hello World',
    bizOpaqueCallbackData: 'tracking-123',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'text',
      text: {
        body: 'Hello World',
      },
      biz_opaque_callback_data: 'tracking-123',
    },
    undefined,
  )
})

it('throws an error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendTextMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      text: 'Hello World',
    }),
  ).rejects.toThrow('API Error')
})
