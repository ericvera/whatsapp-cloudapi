import { expect, it, vi } from 'vitest'
import { sendTemplateMessage } from './sendTemplateMessage.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('sends a template message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
    },
    undefined,
  )
})

it('sends a template message with custom baseUrl', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.anything(),
    'http://localhost:4004',
  )
})

it('uses default baseUrl when not provided for template message', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.anything(),
    undefined,
  )
})

it('sends a template message with deterministic language policy', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    languagePolicy: 'deterministic',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
          policy: 'deterministic',
        },
      },
    },
    undefined,
  )
})

it('sends a template message as a reply to a previous message', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const messageId = 'wamid.HBgLMTY1MDUwNzY1MjAVAgARGBI5QTNDQTVCM0Q0Q0Q2RTY3RTcA'

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    replyToMessageId: messageId,
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
      context: {
        message_id: messageId,
      },
    },
    undefined,
  )
})

it('sends a template message with components', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const components = [
    {
      type: 'header' as const,
      parameters: [
        {
          type: 'image' as const,
          image: {
            id: 'media_123',
          },
        },
      ],
    },
    {
      type: 'body' as const,
      parameters: [
        {
          type: 'text' as const,
          text: 'John',
        },
        {
          type: 'currency' as const,
          currency: {
            code: 'USD',
            amount_1000: 10990,
            fallback_value: '$10.99',
          },
        },
      ],
    },
  ]

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'order_confirmation',
    languageCode: 'en_US',
    components,
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'template',
      template: {
        name: 'order_confirmation',
        language: {
          code: 'en_US',
        },
        components,
      },
    },
    undefined,
  )
})

it('sends a template message with bizOpaqueCallbackData', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    bizOpaqueCallbackData: 'tracking-456',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
      biz_opaque_callback_data: 'tracking-456',
    },
    undefined,
  )
})

it('throws an error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendTemplateMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      templateName: 'hello_world',
      languageCode: 'en_US',
    }),
  ).rejects.toThrow('API Error')
})

it('sends a template message with button component', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const components = [
    {
      type: 'button' as const,
      sub_type: 'quick_reply' as const,
      index: 0,
      parameters: [
        {
          type: 'payload' as const,
          payload: 'quick_reply_payload',
        },
      ],
    },
    {
      type: 'button' as const,
      sub_type: 'url' as const,
      index: 1,
      parameters: [
        {
          type: 'text' as const,
          text: 'example.com',
        },
      ],
    },
  ]

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'button_template',
    languageCode: 'en_US',
    components,
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'template',
      template: {
        name: 'button_template',
        language: {
          code: 'en_US',
        },
        components,
      },
    },
    undefined,
  )
})
