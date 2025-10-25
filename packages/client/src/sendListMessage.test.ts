import { expect, it, vi } from 'vitest'
import { sendListMessage } from './sendListMessage.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('sends a list message with header and footer successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendListMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Please select a product category.',
    buttonText: 'View Options',
    sections: [
      {
        title: 'Electronics',
        rows: [
          { id: 'phone', title: 'Phones', description: 'Latest smartphones' },
          {
            id: 'laptop',
            title: 'Laptops',
            description: 'High-performance laptops',
          },
        ],
      },
      {
        title: 'Accessories',
        rows: [{ id: 'case', title: 'Cases' }],
      },
    ],
    headerText: 'Product Catalog',
    footerText: 'Free shipping on all items',
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
        type: 'list',
        header: {
          type: 'text',
          text: 'Product Catalog',
        },
        body: {
          text: 'Please select a product category.',
        },
        footer: {
          text: 'Free shipping on all items',
        },
        action: {
          button: 'View Options',
          sections: [
            {
              title: 'Electronics',
              rows: [
                {
                  id: 'phone',
                  title: 'Phones',
                  description: 'Latest smartphones',
                },
                {
                  id: 'laptop',
                  title: 'Laptops',
                  description: 'High-performance laptops',
                },
              ],
            },
            {
              title: 'Accessories',
              rows: [{ id: 'case', title: 'Cases' }],
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a minimal list message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendListMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Choose one:',
    buttonText: 'Select',
    sections: [
      {
        rows: [
          { id: 'opt1', title: 'Option 1' },
          { id: 'opt2', title: 'Option 2' },
        ],
      },
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
        type: 'list',
        body: {
          text: 'Choose one:',
        },
        action: {
          button: 'Select',
          sections: [
            {
              rows: [
                { id: 'opt1', title: 'Option 1' },
                { id: 'opt2', title: 'Option 2' },
              ],
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a list message with maximum 10 rows successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendListMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Select a number:',
    buttonText: 'Choose',
    sections: [
      {
        rows: Array.from({ length: 10 }, (_, i) => ({
          id: `item_${String(i)}`,
          title: `Item ${String(i + 1)}`,
        })),
      },
    ],
  })

  expect(mockSendRequest).toHaveBeenCalled()
})

it('sends a list message with custom baseUrl', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendListMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Select:',
    buttonText: 'Choose',
    sections: [{ rows: [{ id: 'a', title: 'A' }] }],
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.any(Object),
    'http://localhost:4004',
  )
})

it('sends a list message with bizOpaqueCallbackData', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendListMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Select:',
    buttonText: 'Choose',
    sections: [{ rows: [{ id: 'a', title: 'A' }] }],
    bizOpaqueCallbackData: 'tracking-789',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.objectContaining({
      biz_opaque_callback_data: 'tracking-789',
    }),
    undefined,
  )
})

// Validation Error Tests

it('throws error when no sections are provided', async () => {
  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [],
    }),
  ).rejects.toThrow('Must provide at least 1 section')
})

it('throws error when section has no rows', async () => {
  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [{ rows: [] }],
    }),
  ).rejects.toThrow('Each section must have at least 1 row')
})

it('throws error when total rows exceed 10', async () => {
  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [
        {
          rows: Array.from({ length: 11 }, (_, i) => ({
            id: `item_${String(i)}`,
            title: `Item ${String(i)}`,
          })),
        },
      ],
    }),
  ).rejects.toThrow('Total number of rows across all sections cannot exceed 10')
})

it('throws error when bodyText exceeds 1024 characters', async () => {
  const longBodyText = 'x'.repeat(1025)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: longBodyText,
      buttonText: 'Select',
      sections: [{ rows: [{ id: 'a', title: 'A' }] }],
    }),
  ).rejects.toThrow('Body text cannot exceed 1024 characters')
})

it('throws error when buttonText exceeds 20 characters', async () => {
  const longButtonText = 'x'.repeat(21)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: longButtonText,
      sections: [{ rows: [{ id: 'a', title: 'A' }] }],
    }),
  ).rejects.toThrow('Button text cannot exceed 20 characters')
})

it('throws error when headerText exceeds 60 characters', async () => {
  const longHeaderText = 'x'.repeat(61)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [{ rows: [{ id: 'a', title: 'A' }] }],
      headerText: longHeaderText,
    }),
  ).rejects.toThrow('Header text cannot exceed 60 characters')
})

it('throws error when footerText exceeds 60 characters', async () => {
  const longFooterText = 'x'.repeat(61)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [{ rows: [{ id: 'a', title: 'A' }] }],
      footerText: longFooterText,
    }),
  ).rejects.toThrow('Footer text cannot exceed 60 characters')
})

it('throws error when section title exceeds 24 characters', async () => {
  const longTitle = 'x'.repeat(25)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [
        {
          title: longTitle,
          rows: [{ id: 'a', title: 'A' }],
        },
      ],
    }),
  ).rejects.toThrow('Section title cannot exceed 24 characters')
})

it('throws error when row ID exceeds 200 characters', async () => {
  const longId = 'x'.repeat(201)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [{ rows: [{ id: longId, title: 'A' }] }],
    }),
  ).rejects.toThrow('Row ID cannot exceed 200 characters')
})

it('throws error when row title exceeds 24 characters', async () => {
  const longTitle = 'x'.repeat(25)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [{ rows: [{ id: 'a', title: longTitle }] }],
    }),
  ).rejects.toThrow('Row title cannot exceed 24 characters')
})

it('throws error when row description exceeds 72 characters', async () => {
  const longDescription = 'x'.repeat(73)

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [
        { rows: [{ id: 'a', title: 'A', description: longDescription }] },
      ],
    }),
  ).rejects.toThrow('Row description cannot exceed 72 characters')
})

it('throws error when duplicate row IDs are found', async () => {
  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [
        {
          rows: [
            { id: 'same_id', title: 'First' },
            { id: 'same_id', title: 'Second' },
          ],
        },
      ],
    }),
  ).rejects.toThrow('Duplicate row ID found: same_id')
})

it('throws error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendListMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test',
      buttonText: 'Select',
      sections: [{ rows: [{ id: 'a', title: 'A' }] }],
    }),
  ).rejects.toThrow('API Error')
})

// Edge Cases

it('accepts exact character limits for all text fields', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const bodyText = 'x'.repeat(1024)
  const buttonText = 'x'.repeat(20)
  const headerText = 'x'.repeat(60)
  const footerText = 'x'.repeat(60)
  const sectionTitle = 'x'.repeat(24)
  const rowId = 'x'.repeat(200)
  const rowTitle = 'x'.repeat(24)
  const rowDescription = 'x'.repeat(72)

  await sendListMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText,
    buttonText,
    headerText,
    footerText,
    sections: [
      {
        title: sectionTitle,
        rows: [
          {
            id: rowId,
            title: rowTitle,
            description: rowDescription,
          },
        ],
      },
    ],
  })

  expect(mockSendRequest).toHaveBeenCalled()
})
