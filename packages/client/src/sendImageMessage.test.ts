import { expect, it, vi } from 'vitest'
import { sendImageMessage } from './sendImageMessage.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('should send an image message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '+1234567890' }],
    messages: [{ id: 'wamid.123' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendImageMessage({
    accessToken: 'test-token',
    from: '1234567890',
    to: '+1234567890',
    mediaId: 'media_123',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test-token',
    '1234567890',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'image',
      image: {
        id: 'media_123',
      },
    },
    undefined,
  )
})

it('should include caption when provided', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '+1234567890' }],
    messages: [{ id: 'wamid.123' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendImageMessage({
    accessToken: 'test-token',
    from: '1234567890',
    to: '+1234567890',
    mediaId: 'media_123',
    caption: 'Test image caption',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test-token',
    '1234567890',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'image',
      image: {
        id: 'media_123',
        caption: 'Test image caption',
      },
    },
    undefined,
  )
})

it('should include biz opaque callback data when provided', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '+1234567890' }],
    messages: [{ id: 'wamid.123' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendImageMessage({
    accessToken: 'test-token',
    from: '1234567890',
    to: '+1234567890',
    mediaId: 'media_123',
    bizOpaqueCallbackData: 'tracking-123',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test-token',
    '1234567890',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'image',
      image: {
        id: 'media_123',
      },
      biz_opaque_callback_data: 'tracking-123',
    },
    undefined,
  )
})

it('should use custom base URL when provided', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '+1234567890' }],
    messages: [{ id: 'wamid.123' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendImageMessage({
    accessToken: 'test-token',
    from: '1234567890',
    to: '+1234567890',
    mediaId: 'media_123',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test-token',
    '1234567890',
    expect.anything(),
    'http://localhost:4004',
  )
})

it('should reject captions that are too long', async () => {
  // 1025 characters, over the 1024 limit
  const longCaption = 'x'.repeat(1025)

  await expect(
    sendImageMessage({
      accessToken: 'test-token',
      from: '1234567890',
      to: '+1234567890',
      mediaId: 'media_123',
      caption: longCaption,
    }),
  ).rejects.toThrow(
    'Caption too long: 1025 characters. Maximum allowed: 1024 characters',
  )
})

it('should handle sendRequest errors', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendImageMessage({
      accessToken: 'test-token',
      from: '1234567890',
      to: '+1234567890',
      mediaId: 'media_123',
    }),
  ).rejects.toThrow('API Error')
})
