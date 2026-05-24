import { expect, it, vi } from 'vitest'
import { sendDocumentMessage } from './sendDocumentMessage.js'

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

it('sends a document message by media ID with caption and filename', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendDocumentMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    mediaId: 'media_1',
    caption: 'Invoice',
    filename: 'invoice.pdf',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'document',
      document: {
        id: 'media_1',
        caption: 'Invoice',
        filename: 'invoice.pdf',
      },
    },
    undefined,
  )
})

it('sends a document message by link to a recipient (BSUID)', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendDocumentMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    link: 'https://example.com/d.pdf',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'US.123',
      type: 'document',
      document: { link: 'https://example.com/d.pdf' },
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendDocumentMessage({
      accessToken: 'test_token',
      from: '123456789',
      mediaId: 'media_1',
    }),
  ).rejects.toThrow('Either "to" or "recipient" is required')
})

it('throws when neither mediaId nor link is provided', async () => {
  await expect(
    sendDocumentMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
    }),
  ).rejects.toThrow('Either "mediaId" or "link" is required')
})

it('throws when the caption is too long', async () => {
  await expect(
    sendDocumentMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      mediaId: 'media_1',
      caption: 'x'.repeat(1025),
    }),
  ).rejects.toThrow('Caption too long')
})
