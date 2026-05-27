import { expect, it, vi } from 'vitest'
import { sendLocationMessage } from './sendLocationMessage.js'

vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

const mockResponse = {
  messaging_product: 'whatsapp' as const,
  contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
  messages: [{ id: 'message_id' }],
}

it('sends a location message with name and address to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendLocationMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    latitude: 37.44,
    longitude: -122.16,
    name: 'Menlo Park',
    address: '1 Hacker Way',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'location',
      location: {
        latitude: 37.44,
        longitude: -122.16,
        name: 'Menlo Park',
        address: '1 Hacker Way',
      },
    },
    undefined,
  )
})

it('sends a minimal location message to a recipient (BSUID)', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendLocationMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    latitude: 1,
    longitude: 2,
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'US.123',
      type: 'location',
      location: { latitude: 1, longitude: 2 },
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendLocationMessage({
      accessToken: 'test_token',
      from: '123456789',
      latitude: 1,
      longitude: 2,
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "to" or "recipient" is required]`,
  )
})
