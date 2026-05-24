import { expect, it, vi } from 'vitest'
import { sendCallPermissionRequestMessage } from './sendCallPermissionRequestMessage.js'

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

it('sends a call permission request to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendCallPermissionRequestMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'May we call you?',
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
        type: 'call_permission_request',
        body: { text: 'May we call you?' },
        action: { name: 'call_permission_request' },
      },
    },
    undefined,
  )
})

it('sends a call permission request to a recipient with reply context', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendCallPermissionRequestMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    bodyText: 'May we call you?',
    context: { messageId: 'wamid.reply' },
  })

  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient: 'US.123',
      context: { message_id: 'wamid.reply' },
      type: 'interactive',
      interactive: {
        type: 'call_permission_request',
        body: { text: 'May we call you?' },
        action: { name: 'call_permission_request' },
      },
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendCallPermissionRequestMessage({
      accessToken: 'test_token',
      from: '123456789',
      bodyText: 'May we call you?',
    }),
  ).rejects.toThrow('Either "to" or "recipient" is required')
})

it('throws when the body text is too long', async () => {
  await expect(
    sendCallPermissionRequestMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      bodyText: 'x'.repeat(1025),
    }),
  ).rejects.toThrow('Body text too long')
})
