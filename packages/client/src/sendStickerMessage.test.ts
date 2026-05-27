import { expect, it, vi } from 'vitest'
import { sendStickerMessage } from './sendStickerMessage.js'

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

it('sends a sticker message by media ID to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendStickerMessage({
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
      type: 'sticker',
      sticker: { id: 'media_1' },
    },
    undefined,
  )
})

it('sends a sticker message by link to a recipient (BSUID)', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendStickerMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    link: 'https://example.com/s.webp',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'US.123',
      type: 'sticker',
      sticker: { link: 'https://example.com/s.webp' },
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendStickerMessage({
      accessToken: 'test_token',
      from: '123456789',
      mediaId: 'media_1',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "to" or "recipient" is required]`,
  )
})

it('throws when neither mediaId nor link is provided', async () => {
  await expect(
    sendStickerMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "mediaId" or "link" is required]`,
  )
})
