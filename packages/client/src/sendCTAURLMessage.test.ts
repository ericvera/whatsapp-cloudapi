import { expect, it, vi } from 'vitest'
import { sendCTAURLMessage } from './sendCTAURLMessage.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('sends a CTA URL message with text header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendCTAURLMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText:
      'Check out our latest deals and save up to 50% on selected items.',
    buttonText: 'Shop Now',
    url: 'https://shop.example.com/deals',
    headerText: 'Special Offer!',
    footerText: 'Limited time only',
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
        type: 'cta_url',
        header: {
          type: 'text',
          text: 'Special Offer!',
        },
        body: {
          text: 'Check out our latest deals and save up to 50% on selected items.',
        },
        footer: {
          text: 'Limited time only',
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: 'Shop Now',
            url: 'https://shop.example.com/deals',
          },
        },
      },
    },
    undefined,
  )
})

it('sends a CTA URL message with image header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendCTAURLMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText:
      'Browse our complete product catalog with detailed specifications.',
    buttonText: 'View Catalog',
    url: 'https://catalog.example.com',
    headerImage: { id: 'MEDIA_ID_123' },
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
        type: 'cta_url',
        header: {
          type: 'image',
          image: {
            id: 'MEDIA_ID_123',
          },
        },
        body: {
          text: 'Browse our complete product catalog with detailed specifications.',
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: 'View Catalog',
            url: 'https://catalog.example.com',
          },
        },
      },
    },
    undefined,
  )
})

it('sends a minimal CTA URL message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendCTAURLMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Visit our website for more information.',
    buttonText: 'Visit',
    url: 'https://example.com',
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
        type: 'cta_url',
        body: {
          text: 'Visit our website for more information.',
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: 'Visit',
            url: 'https://example.com',
          },
        },
      },
    },
    undefined,
  )
})

it('sends a CTA URL message with custom baseUrl', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendCTAURLMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Visit our website for more information.',
    buttonText: 'Visit',
    url: 'https://example.com',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.any(Object),
    'http://localhost:4004',
  )
})

it('sends a CTA URL message with bizOpaqueCallbackData', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendCTAURLMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Visit our website for more information.',
    buttonText: 'Visit',
    url: 'https://example.com',
    bizOpaqueCallbackData: 'tracking-123',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: {
          text: 'Visit our website for more information.',
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: 'Visit',
            url: 'https://example.com',
          },
        },
      },
      biz_opaque_callback_data: 'tracking-123',
    },
    undefined,
  )
})

// Validation Error Tests

it('throws error when both headerText and headerImage are provided', async () => {
  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'https://example.com',
      headerText: 'Header',
      headerImage: { id: 'MEDIA_ID' },
    }),
  ).rejects.toThrow(
    'Only one header type can be specified (headerText or headerImage)',
  )
})

it('throws error when bodyText exceeds 1024 characters', async () => {
  const longBodyText = 'x'.repeat(1025)

  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: longBodyText,
      buttonText: 'Click',
      url: 'https://example.com',
    }),
  ).rejects.toThrow('Body text cannot exceed 1024 characters')
})

it('throws error when buttonText exceeds 20 characters', async () => {
  const longButtonText = 'x'.repeat(21)

  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: longButtonText,
      url: 'https://example.com',
    }),
  ).rejects.toThrow('Button text cannot exceed 20 characters')
})

it('throws error when headerText exceeds 60 characters', async () => {
  const longHeaderText = 'x'.repeat(61)

  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'https://example.com',
      headerText: longHeaderText,
    }),
  ).rejects.toThrow('Header text cannot exceed 60 characters')
})

it('throws error when footerText exceeds 60 characters', async () => {
  const longFooterText = 'x'.repeat(61)

  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'https://example.com',
      footerText: longFooterText,
    }),
  ).rejects.toThrow('Footer text cannot exceed 60 characters')
})

it('throws error for invalid URL format', async () => {
  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'invalid-url',
    }),
  ).rejects.toThrow('Invalid URL format')
})

it('throws error for FTP protocol', async () => {
  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'ftp://example.com',
    }),
  ).rejects.toThrow('URL must use http:// or https:// protocol')
})

it('throws error for IPv4 address as hostname', async () => {
  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'https://192.168.1.1',
    }),
  ).rejects.toThrow('URL hostname cannot be an IP address')
})

it('throws error for IPv6 address as hostname', async () => {
  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'https://[2001:db8::1]/',
    }),
  ).rejects.toThrow('URL hostname cannot be an IP address')
})

it('throws error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendCTAURLMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttonText: 'Click',
      url: 'https://example.com',
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

  await sendCTAURLMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText,
    buttonText,
    url: 'https://example.com',
    headerText,
    footerText,
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        header: {
          type: 'text',
          text: headerText,
        },
        body: {
          text: bodyText,
        },
        footer: {
          text: footerText,
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: buttonText,
            url: 'https://example.com',
          },
        },
      },
    },
    undefined,
  )
})

it('accepts URLs with ports and paths', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendCTAURLMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Visit our store.',
    buttonText: 'Shop',
    url: 'https://shop.example.com:8080/products/category?sort=price',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: {
          text: 'Visit our store.',
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: 'Shop',
            url: 'https://shop.example.com:8080/products/category?sort=price',
          },
        },
      },
    },
    undefined,
  )
})
