import { expect, it, vi } from 'vitest'
import { sendTypingIndicator } from './sendTypingIndicator.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('sends typing indicator successfully', async () => {
  const mockResponse = {
    success: true,
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendTypingIndicator({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    action: 'typing',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'typing_indicator',
      typing_indicator: {
        action: 'typing',
      },
    },
    undefined,
  )
})

it('sends stopped typing indicator successfully', async () => {
  const mockResponse = {
    success: true,
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendTypingIndicator({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    action: 'stopped',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'typing_indicator',
      typing_indicator: {
        action: 'stopped',
      },
    },
    undefined,
  )
})

it('sends typing indicator with custom baseUrl', async () => {
  const mockResponse = {
    success: true,
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendTypingIndicator({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    action: 'typing',
    baseUrl: 'http://localhost:4004',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'typing_indicator',
      typing_indicator: {
        action: 'typing',
      },
    },
    'http://localhost:4004',
  )
})

it('throws error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendTypingIndicator({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      action: 'typing',
    }),
  ).rejects.toThrow('API Error')
})

it('handles network errors', async () => {
  mockSendRequest.mockRejectedValueOnce(
    new Error('Network error: Failed to fetch'),
  )

  await expect(
    sendTypingIndicator({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      action: 'typing',
    }),
  ).rejects.toThrow('Network error: Failed to fetch')
})
