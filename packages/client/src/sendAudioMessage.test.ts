import { expect, it, vi } from 'vitest'
import { sendAudioMessage } from './sendAudioMessage.js'

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

it('sends an audio message by media ID to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendAudioMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    mediaId: 'media_1',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'audio',
      audio: { id: 'media_1' },
    },
    undefined,
  )
})

it('sends an audio message by link to a recipient (BSUID)', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendAudioMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    link: 'https://example.com/a.mp3',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient: 'US.123',
      type: 'audio',
      audio: { link: 'https://example.com/a.mp3' },
    },
    undefined,
  )
})

it('maps context and bizOpaqueCallbackData and forwards baseUrl', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendAudioMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    mediaId: 'media_1',
    context: { messageId: 'wamid.reply' },
    bizOpaqueCallbackData: 'tracking-123',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      context: { message_id: 'wamid.reply' },
      type: 'audio',
      audio: { id: 'media_1' },
      biz_opaque_callback_data: 'tracking-123',
    },
    'http://localhost:4004',
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendAudioMessage({
      accessToken: 'test_token',
      from: '123456789',
      mediaId: 'media_1',
    }),
  ).rejects.toThrow('Either "to" or "recipient" is required')
})

it('throws when neither mediaId nor link is provided', async () => {
  await expect(
    sendAudioMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
    }),
  ).rejects.toThrow('Either "mediaId" or "link" is required')
})
