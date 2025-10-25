import { expect, it, vi } from 'vitest'
import { markMessageRead } from './markMessageRead.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('marks a message as read successfully', async () => {
  const mockResponse = {
    success: true,
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await markMessageRead({
    accessToken: 'test_token',
    from: '123456789',
    messageId: 'wamid.test123',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: 'wamid.test123',
    },
    undefined,
  )
})

it('marks a message as read with custom baseUrl', async () => {
  const mockResponse = {
    success: true,
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await markMessageRead({
    accessToken: 'test_token',
    from: '123456789',
    messageId: 'wamid.test456',
    baseUrl: 'http://localhost:4004',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: 'wamid.test456',
    },
    'http://localhost:4004',
  )
})

it('throws error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    markMessageRead({
      accessToken: 'test_token',
      from: '123456789',
      messageId: 'wamid.test789',
    }),
  ).rejects.toThrow('API Error')
})

it('handles network errors', async () => {
  mockSendRequest.mockRejectedValueOnce(
    new Error('Network error: Failed to fetch'),
  )

  await expect(
    markMessageRead({
      accessToken: 'test_token',
      from: '123456789',
      messageId: 'wamid.network_test',
    }),
  ).rejects.toThrow('Network error: Failed to fetch')
})
