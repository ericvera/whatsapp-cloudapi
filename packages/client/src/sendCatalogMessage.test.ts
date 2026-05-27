import { expect, it, vi } from 'vitest'
import { sendCatalogMessage } from './sendCatalogMessage.js'

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

it('sends a catalog message with footer to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendCatalogMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Browse our catalog',
    thumbnailProductRetailerId: 'SKU-1',
    footerText: 'Tap to view',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'interactive',
      interactive: {
        type: 'catalog_message',
        body: { text: 'Browse our catalog' },
        footer: { text: 'Tap to view' },
        action: {
          name: 'catalog_message',
          parameters: { thumbnail_product_retailer_id: 'SKU-1' },
        },
      },
    },
    undefined,
  )
})

it('sends a catalog message to a recipient (BSUID) with reply context', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendCatalogMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    bodyText: 'Browse',
    thumbnailProductRetailerId: 'SKU-1',
    context: { messageId: 'wamid.reply' },
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'US.123',
      context: { message_id: 'wamid.reply' },
      type: 'interactive',
      interactive: {
        type: 'catalog_message',
        body: { text: 'Browse' },
        action: {
          name: 'catalog_message',
          parameters: { thumbnail_product_retailer_id: 'SKU-1' },
        },
      },
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendCatalogMessage({
      accessToken: 'test_token',
      from: '123456789',
      bodyText: 'Browse',
      thumbnailProductRetailerId: 'SKU-1',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "to" or "recipient" is required]`,
  )
})

it('throws when the body text is too long', async () => {
  await expect(
    sendCatalogMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'x'.repeat(1025),
      thumbnailProductRetailerId: 'SKU-1',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Body text too long: 1025 characters. Maximum allowed: 1024 characters]`,
  )
})

it('throws when the footer text is too long', async () => {
  await expect(
    sendCatalogMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Browse',
      thumbnailProductRetailerId: 'SKU-1',
      footerText: 'x'.repeat(61),
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Footer text too long: 61 characters. Maximum allowed: 60 characters]`,
  )
})
