import { expect, it, vi } from 'vitest'
import { sendFlowMessage } from './sendFlowMessage.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('sends a flow message with navigate action successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Complete your application form to get started.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Start Application',
    flowAction: 'navigate',
    screen: 'welcome_screen',
    headerText: 'Loan Application',
    footerText: 'Secure and fast',
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
        type: 'flow',
        header: {
          type: 'text',
          text: 'Loan Application',
        },
        body: {
          text: 'Complete your application form to get started.',
        },
        footer: {
          text: 'Secure and fast',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Start Application',
            flow_action: 'navigate',
            flow_action_payload: {
              screen: 'welcome_screen',
            },
          },
        },
      },
    },
    undefined,
  )
})

it('sends a flow message with data_exchange action successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const flowData = { userId: '12345', productType: 'premium' }

  const result = await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Update your preferences with our new form.',
    flowToken: 'FLOW_TOKEN_789',
    flowId: 'FLOW_ID_101',
    flowCta: 'Update Preferences',
    flowAction: 'data_exchange',
    data: flowData,
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
        type: 'flow',
        body: {
          text: 'Update your preferences with our new form.',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_789',
            flow_id: 'FLOW_ID_101',
            flow_cta: 'Update Preferences',
            flow_action: 'data_exchange',
            flow_action_payload: {
              data: flowData,
            },
          },
        },
      },
    },
    undefined,
  )
})

it('sends a flow message with image header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Browse our product catalog interactively.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Browse Products',
    flowAction: 'navigate',
    screen: 'catalog_screen',
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
        type: 'flow',
        header: {
          type: 'image',
          image: {
            id: 'MEDIA_ID_123',
          },
        },
        body: {
          text: 'Browse our product catalog interactively.',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Browse Products',
            flow_action: 'navigate',
            flow_action_payload: {
              screen: 'catalog_screen',
            },
          },
        },
      },
    },
    undefined,
  )
})

it('sends a flow message with video header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Watch our tutorial and get started.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Start Tutorial',
    flowAction: 'navigate',
    screen: 'tutorial_screen',
    headerVideo: { link: 'https://example.com/video.mp4' },
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
        type: 'flow',
        header: {
          type: 'video',
          video: {
            link: 'https://example.com/video.mp4',
          },
        },
        body: {
          text: 'Watch our tutorial and get started.',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Start Tutorial',
            flow_action: 'navigate',
            flow_action_payload: {
              screen: 'tutorial_screen',
            },
          },
        },
      },
    },
    undefined,
  )
})

it('sends a flow message with document header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Review the terms and complete your registration.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Complete Registration',
    flowAction: 'navigate',
    screen: 'registration_screen',
    headerDocument: { id: 'DOC_ID_789', filename: 'terms.pdf' },
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
        type: 'flow',
        header: {
          type: 'document',
          document: {
            id: 'DOC_ID_789',
            filename: 'terms.pdf',
          },
        },
        body: {
          text: 'Review the terms and complete your registration.',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Complete Registration',
            flow_action: 'navigate',
            flow_action_payload: {
              screen: 'registration_screen',
            },
          },
        },
      },
    },
    undefined,
  )
})

it('sends a minimal flow message successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Complete your survey.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Start Survey',
    flowAction: 'data_exchange',
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
        type: 'flow',
        body: {
          text: 'Complete your survey.',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Start Survey',
            flow_action: 'data_exchange',
          },
        },
      },
    },
    undefined,
  )
})

it('sends a flow message with custom baseUrl', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Complete your survey.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Start Survey',
    flowAction: 'data_exchange',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.any(Object),
    'http://localhost:4004',
  )
})

it('sends a flow message with bizOpaqueCallbackData', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Complete your survey.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Start Survey',
    flowAction: 'data_exchange',
    bizOpaqueCallbackData: 'tracking-flow-456',
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
        type: 'flow',
        body: {
          text: 'Complete your survey.',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Start Survey',
            flow_action: 'data_exchange',
          },
        },
      },
      biz_opaque_callback_data: 'tracking-flow-456',
    },
    undefined,
  )
})

// Validation Error Tests

it('throws error when multiple header types are provided', async () => {
  await expect(
    sendFlowMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      flowToken: 'FLOW_TOKEN_123',
      flowId: 'FLOW_ID_456',
      flowCta: 'Start',
      flowAction: 'navigate',
      screen: 'test_screen',
      headerText: 'Header',
      headerImage: { id: 'MEDIA_ID' },
    }),
  ).rejects.toThrow(
    'Only one header type can be specified (headerText, headerImage, headerVideo, or headerDocument)',
  )
})

it('throws error when bodyText exceeds 1024 characters', async () => {
  const longBodyText = 'x'.repeat(1025)

  await expect(
    sendFlowMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: longBodyText,
      flowToken: 'FLOW_TOKEN_123',
      flowId: 'FLOW_ID_456',
      flowCta: 'Start',
      flowAction: 'data_exchange',
    }),
  ).rejects.toThrow('Body text cannot exceed 1024 characters')
})

it('throws error when headerText exceeds 60 characters', async () => {
  const longHeaderText = 'x'.repeat(61)

  await expect(
    sendFlowMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      flowToken: 'FLOW_TOKEN_123',
      flowId: 'FLOW_ID_456',
      flowCta: 'Start',
      flowAction: 'data_exchange',
      headerText: longHeaderText,
    }),
  ).rejects.toThrow('Header text cannot exceed 60 characters')
})

it('throws error when footerText exceeds 60 characters', async () => {
  const longFooterText = 'x'.repeat(61)

  await expect(
    sendFlowMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      flowToken: 'FLOW_TOKEN_123',
      flowId: 'FLOW_ID_456',
      flowCta: 'Start',
      flowAction: 'data_exchange',
      footerText: longFooterText,
    }),
  ).rejects.toThrow('Footer text cannot exceed 60 characters')
})

it('throws error when navigate action is used without screen parameter', async () => {
  await expect(
    sendFlowMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      flowToken: 'FLOW_TOKEN_123',
      flowId: 'FLOW_ID_456',
      flowCta: 'Start',
      flowAction: 'navigate',
    }),
  ).rejects.toThrow('Screen parameter is required for navigate flow action')
})

it('throws error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendFlowMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      flowToken: 'FLOW_TOKEN_123',
      flowId: 'FLOW_ID_456',
      flowCta: 'Start',
      flowAction: 'data_exchange',
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
  const headerText = 'x'.repeat(60)
  const footerText = 'x'.repeat(60)

  await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText,
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Start',
    flowAction: 'data_exchange',
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
        type: 'flow',
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
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Start',
            flow_action: 'data_exchange',
          },
        },
      },
    },
    undefined,
  )
})

it('sends flow message with both screen and data in payload', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const flowData = { userId: '12345', step: 1 }

  await sendFlowMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Continue your journey.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'FLOW_ID_456',
    flowCta: 'Continue',
    flowAction: 'navigate',
    screen: 'step_one',
    data: flowData,
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
        type: 'flow',
        body: {
          text: 'Continue your journey.',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: 'FLOW_TOKEN_123',
            flow_id: 'FLOW_ID_456',
            flow_cta: 'Continue',
            flow_action: 'navigate',
            flow_action_payload: {
              screen: 'step_one',
              data: flowData,
            },
          },
        },
      },
    },
    undefined,
  )
})
