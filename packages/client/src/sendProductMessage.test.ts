import { expect, it, vi } from 'vitest'
import { sendProductMessage } from './sendProductMessage.js'

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

it('sends a product message with body and footer to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendProductMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    catalogId: 'CATALOG-1',
    productRetailerId: 'SKU-1',
    bodyText: 'Check this out',
    footerText: 'Limited stock',
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
        type: 'product',
        body: { text: 'Check this out' },
        footer: { text: 'Limited stock' },
        action: {
          catalog_id: 'CATALOG-1',
          product_retailer_id: 'SKU-1',
        },
      },
    },
    undefined,
  )
})

it('sends a product message to a recipient (BSUID) with reply context', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendProductMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    catalogId: 'CATALOG-1',
    productRetailerId: 'SKU-1',
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
        type: 'product',
        action: {
          catalog_id: 'CATALOG-1',
          product_retailer_id: 'SKU-1',
        },
      },
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendProductMessage({
      accessToken: 'test_token',
      from: '123456789',
      catalogId: 'CATALOG-1',
      productRetailerId: 'SKU-1',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "to" or "recipient" is required]`,
  )
})

it('throws when the body text is too long', async () => {
  await expect(
    sendProductMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      catalogId: 'CATALOG-1',
      productRetailerId: 'SKU-1',
      bodyText: 'x'.repeat(1025),
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Body text too long: 1025 characters. Maximum allowed: 1024 characters]`,
  )
})
