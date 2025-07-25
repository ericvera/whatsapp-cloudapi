import { CloudAPISendTemplateMessageRequest } from '@whatsapp-cloudapi/types/cloudapi'
import { beforeEach, expect, it, vi } from 'vitest'
import { sendTemplateMessage } from './sendTemplateMessage.js'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Reset mocks before each test
beforeEach(() => {
  mockFetch.mockReset()
})

it('sends a template message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  const response = await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
  })

  expect(mockFetch).toHaveBeenCalledWith(
    'https://graph.facebook.com/v22.0/123456789/messages',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test_token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    },
  )

  expect(response).toEqual(mockResponse)
})

it('sends a template message with custom baseUrl', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  const response = await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockFetch).toHaveBeenCalledWith(
    'http://localhost:4004/v22.0/123456789/messages',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test_token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    },
  )

  expect(response).toEqual(mockResponse)
})

it('uses default baseUrl when not provided for template message', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    // baseUrl not provided - should use default
  })

  expect(mockFetch).toHaveBeenCalledWith(
    'https://graph.facebook.com/v22.0/123456789/messages',
    expect.any(Object),
  )
})

it('sends a template message with deterministic language policy', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    languagePolicy: 'deterministic',
  })

  const mockCall = mockFetch.mock.calls[0] as [string, { body: string }]
  const requestBody = JSON.parse(mockCall[1].body) as {
    template: { language: { policy: string } }
  }
  expect(requestBody.template.language.policy).toBe('deterministic')
})

it('sends a template message as a reply to a previous message', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  const messageId = 'wamid.HBgLMTY1MDUwNzY1MjAVAgARGBI5QTNDQTVCM0Q0Q0Q2RTY3RTcA'

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    replyToMessageId: messageId,
  })

  const mockCall = mockFetch.mock.calls[0] as [string, { body: string }]
  const requestBody = JSON.parse(mockCall[1].body) as {
    context: { message_id: string }
  }
  expect(requestBody.context).toEqual({ message_id: messageId })
})

it('sends a template message with components', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  const components = [
    {
      type: 'header' as const,
      parameters: [
        {
          type: 'image' as const,
          image: {
            link: 'https://example.com/image.jpg',
          },
        },
      ],
    },
    {
      type: 'body' as const,
      parameters: [
        {
          type: 'text' as const,
          text: 'John Doe',
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

  const mockCall = mockFetch.mock.calls[0] as [string, { body: string }]
  const requestBody = JSON.parse(mockCall[1].body) as {
    template: { components: typeof components }
  }
  expect(requestBody.template.components).toEqual(components)
})

it('sends a template message with bizOpaqueCallbackData', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  await sendTemplateMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    templateName: 'hello_world',
    languageCode: 'en_US',
    bizOpaqueCallbackData: 'tracking-456',
  })

  const mockCall = mockFetch.mock.calls[0] as [string, { body: string }]
  const requestBody = JSON.parse(
    mockCall[1].body,
  ) as CloudAPISendTemplateMessageRequest
  expect(requestBody.biz_opaque_callback_data).toBe('tracking-456')
})

it('throws an error when API request fails', async () => {
  const errorResponse = {
    error: {
      message: 'Template not found',
      type: 'WhatsAppBusinessApiError',
      code: 132000,
    },
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(errorResponse), { status: 404 }),
  )

  await expect(
    sendTemplateMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      templateName: 'non_existent_template',
      languageCode: 'en_US',
    }),
  ).rejects.toThrow(`WhatsApp API Error: ${JSON.stringify(errorResponse)}`)
})

it('sends a template message with button component', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(mockResponse), { status: 200 }),
  )

  const components = [
    {
      type: 'button' as const,
      sub_type: 'quick_reply' as const,
      index: '0',
      parameters: [
        {
          type: 'payload' as const,
          payload: 'PAYLOAD_VALUE',
        },
      ],
    },
    {
      type: 'button' as const,
      sub_type: 'url' as const,
      index: '1',
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

  const mockCall = mockFetch.mock.calls[0] as [string, { body: string }]
  const requestBody = JSON.parse(mockCall[1].body) as {
    template: { components: typeof components }
  }
  expect(requestBody.template.components).toEqual(components)
})
