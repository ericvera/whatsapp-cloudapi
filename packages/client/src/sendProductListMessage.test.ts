import { expect, it, vi } from 'vitest'
import { sendProductListMessage } from './sendProductListMessage.js'

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

it('sends a multi-product message with sections to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendProductListMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    catalogId: 'CATALOG-1',
    headerText: 'Our picks',
    bodyText: 'Browse these products',
    footerText: 'Tap to view',
    sections: [
      { title: 'Shoes', productRetailerIds: ['SKU-1', 'SKU-2'] },
      { title: 'Hats', productRetailerIds: ['SKU-3'] },
    ],
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
        type: 'product_list',
        header: { type: 'text', text: 'Our picks' },
        body: { text: 'Browse these products' },
        footer: { text: 'Tap to view' },
        action: {
          catalog_id: 'CATALOG-1',
          sections: [
            {
              title: 'Shoes',
              product_items: [
                { product_retailer_id: 'SKU-1' },
                { product_retailer_id: 'SKU-2' },
              ],
            },
            {
              title: 'Hats',
              product_items: [{ product_retailer_id: 'SKU-3' }],
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a multi-product message to a recipient (BSUID)', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendProductListMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    catalogId: 'CATALOG-1',
    headerText: 'Our picks',
    bodyText: 'Browse',
    sections: [{ title: 'Shoes', productRetailerIds: ['SKU-1'] }],
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'US.123',
      type: 'interactive',
      interactive: {
        type: 'product_list',
        header: { type: 'text', text: 'Our picks' },
        body: { text: 'Browse' },
        action: {
          catalog_id: 'CATALOG-1',
          sections: [
            {
              title: 'Shoes',
              product_items: [{ product_retailer_id: 'SKU-1' }],
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendProductListMessage({
      accessToken: 'test_token',
      from: '123456789',
      catalogId: 'CATALOG-1',
      headerText: 'Our picks',
      bodyText: 'Browse',
      sections: [{ title: 'Shoes', productRetailerIds: ['SKU-1'] }],
    }),
  ).rejects.toThrow('Either "to" or "recipient" is required')
})

it('throws when there are no sections', async () => {
  await expect(
    sendProductListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      catalogId: 'CATALOG-1',
      headerText: 'Our picks',
      bodyText: 'Browse',
      sections: [],
    }),
  ).rejects.toThrow('At least one product section is required')
})

it('throws when a section has no products', async () => {
  await expect(
    sendProductListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      catalogId: 'CATALOG-1',
      headerText: 'Our picks',
      bodyText: 'Browse',
      sections: [{ title: 'Shoes', productRetailerIds: [] }],
    }),
  ).rejects.toThrow('Each product section requires at least one product')
})
