import { expect, it, vi } from 'vitest'
import { sendReactionMessage } from './sendReactionMessage.js'

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

it('sends a reaction to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendReactionMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    messageId: 'wamid.target',
    emoji: '👍',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'reaction',
      reaction: { message_id: 'wamid.target', emoji: '👍' },
    },
    undefined,
  )
})

it('sends a reaction to a recipient (BSUID)', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendReactionMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    messageId: 'wamid.target',
    emoji: '❤️',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'US.123',
      type: 'reaction',
      reaction: { message_id: 'wamid.target', emoji: '❤️' },
    },
    undefined,
  )
})

it('allows an empty emoji to remove a reaction', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendReactionMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    messageId: 'wamid.target',
    emoji: '',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'reaction',
      reaction: { message_id: 'wamid.target', emoji: '' },
    },
    'http://localhost:4004',
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendReactionMessage({
      accessToken: 'test_token',
      from: '123456789',
      messageId: 'wamid.target',
      emoji: '👍',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "to" or "recipient" is required]`,
  )
})
