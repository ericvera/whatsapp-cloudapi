import { expect, it, vi } from 'vitest'
import { sendButtonsMessage } from './sendButtonsMessage.js'

// Mock the sendRequest function
vi.mock('./internal/sendRequest.js', () => ({
  sendRequest: vi.fn(),
}))

import { sendRequest } from './internal/sendRequest.js'
const mockSendRequest = vi.mocked(sendRequest)

it('sends a buttons message with text header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Please select an option from the buttons below.',
    buttons: [
      { id: 'btn_1', title: 'Option 1' },
      { id: 'btn_2', title: 'Option 2' },
      { id: 'btn_3', title: 'Option 3' },
    ],
    headerText: 'Choose an option',
    footerText: 'Powered by WhatsApp',
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
        type: 'button',
        header: {
          type: 'text',
          text: 'Choose an option',
        },
        body: {
          text: 'Please select an option from the buttons below.',
        },
        footer: {
          text: 'Powered by WhatsApp',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: 'btn_1', title: 'Option 1' },
            },
            {
              type: 'reply',
              reply: { id: 'btn_2', title: 'Option 2' },
            },
            {
              type: 'reply',
              reply: { id: 'btn_3', title: 'Option 3' },
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a buttons message with image header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Choose your preferred contact method.',
    buttons: [
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
    ],
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
        type: 'button',
        header: {
          type: 'image',
          image: { id: 'MEDIA_ID_123' },
        },
        body: {
          text: 'Choose your preferred contact method.',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: 'email', title: 'Email' },
            },
            {
              type: 'reply',
              reply: { id: 'phone', title: 'Phone' },
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a buttons message with video header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Watch the video and let us know what you think.',
    buttons: [{ id: 'like', title: 'Like' }],
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
        type: 'button',
        header: {
          type: 'video',
          video: { link: 'https://example.com/video.mp4' },
        },
        body: {
          text: 'Watch the video and let us know what you think.',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: 'like', title: 'Like' },
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a buttons message with document header successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Please review the document and confirm.',
    buttons: [
      { id: 'accept', title: 'Accept' },
      { id: 'reject', title: 'Reject' },
    ],
    headerDocument: {
      id: 'DOC_ID',
      filename: 'contract.pdf',
    },
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
        type: 'button',
        header: {
          type: 'document',
          document: {
            id: 'DOC_ID',
            filename: 'contract.pdf',
          },
        },
        body: {
          text: 'Please review the document and confirm.',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: 'accept', title: 'Accept' },
            },
            {
              type: 'reply',
              reply: { id: 'reject', title: 'Reject' },
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a minimal buttons message with one button successfully', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Click the button to continue.',
    buttons: [{ id: 'continue', title: 'Continue' }],
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
        type: 'button',
        body: {
          text: 'Click the button to continue.',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: 'continue', title: 'Continue' },
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('sends a buttons message with custom baseUrl', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Select an option.',
    buttons: [{ id: 'yes', title: 'Yes' }],
    baseUrl: 'http://localhost:4004',
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    expect.any(Object),
    'http://localhost:4004',
  )
})

it('sends a buttons message with bizOpaqueCallbackData', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Select an option.',
    buttons: [{ id: 'yes', title: 'Yes' }],
    bizOpaqueCallbackData: 'tracking-456',
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
        type: 'button',
        body: {
          text: 'Select an option.',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: 'yes', title: 'Yes' },
            },
          ],
        },
      },
      biz_opaque_callback_data: 'tracking-456',
    },
    undefined,
  )
})

// Validation Error Tests

it('throws error when multiple header types are provided', async () => {
  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [{ id: 'btn', title: 'Click' }],
      headerText: 'Header',
      headerImage: { id: 'MEDIA_ID' },
    }),
  ).rejects.toThrow(
    'Only one header type can be specified (headerText, headerImage, headerVideo, or headerDocument)',
  )
})

it('throws error when no buttons are provided', async () => {
  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [],
    }),
  ).rejects.toThrow('Must provide between 1 and 3 buttons')
})

it('throws error when more than 3 buttons are provided', async () => {
  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [
        { id: 'btn_1', title: 'Button 1' },
        { id: 'btn_2', title: 'Button 2' },
        { id: 'btn_3', title: 'Button 3' },
        { id: 'btn_4', title: 'Button 4' },
      ],
    }),
  ).rejects.toThrow('Must provide between 1 and 3 buttons')
})

it('throws error when bodyText exceeds 1024 characters', async () => {
  const longBodyText = 'x'.repeat(1025)

  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: longBodyText,
      buttons: [{ id: 'btn', title: 'Click' }],
    }),
  ).rejects.toThrow('Body text cannot exceed 1024 characters')
})

it('throws error when headerText exceeds 60 characters', async () => {
  const longHeaderText = 'x'.repeat(61)

  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [{ id: 'btn', title: 'Click' }],
      headerText: longHeaderText,
    }),
  ).rejects.toThrow('Header text cannot exceed 60 characters')
})

it('throws error when footerText exceeds 60 characters', async () => {
  const longFooterText = 'x'.repeat(61)

  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [{ id: 'btn', title: 'Click' }],
      footerText: longFooterText,
    }),
  ).rejects.toThrow('Footer text cannot exceed 60 characters')
})

it('throws error when button ID exceeds 256 characters', async () => {
  const longButtonId = 'x'.repeat(257)

  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [{ id: longButtonId, title: 'Click' }],
    }),
  ).rejects.toThrow('Button ID cannot exceed 256 characters')
})

it('throws error when button title exceeds 20 characters', async () => {
  const longButtonTitle = 'x'.repeat(21)

  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [{ id: 'btn', title: longButtonTitle }],
    }),
  ).rejects.toThrow('Button title cannot exceed 20 characters')
})

it('throws error when duplicate button IDs are provided', async () => {
  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [
        { id: 'same_id', title: 'Button 1' },
        { id: 'same_id', title: 'Button 2' },
      ],
    }),
  ).rejects.toThrow('Duplicate button ID found: same_id')
})

it('throws error when API request fails', async () => {
  mockSendRequest.mockRejectedValueOnce(new Error('API Error'))

  await expect(
    sendButtonsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'Test message',
      buttons: [{ id: 'btn', title: 'Click' }],
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
  const buttonTitle = 'x'.repeat(20)
  const buttonId = 'x'.repeat(256)

  await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText,
    buttons: [{ id: buttonId, title: buttonTitle }],
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
        type: 'button',
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
          buttons: [
            {
              type: 'reply',
              reply: { id: buttonId, title: buttonTitle },
            },
          ],
        },
      },
    },
    undefined,
  )
})

it('accepts exactly 3 buttons', async () => {
  const mockResponse = {
    messaging_product: 'whatsapp' as const,
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'message_id' }],
  }

  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendButtonsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Choose one:',
    buttons: [
      { id: '1', title: 'One' },
      { id: '2', title: 'Two' },
      { id: '3', title: 'Three' },
    ],
  })

  expect(mockSendRequest).toHaveBeenCalled()
})
