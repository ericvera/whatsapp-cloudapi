import { expect, it, vi } from 'vitest'
import { sendRequestContactInfoMessage } from './sendRequestContactInfoMessage.js'

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

it('sends a contact-info request to a recipient (BSUID)', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendRequestContactInfoMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    bodyText: 'Share your number so we can follow up',
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      recipient: 'US.123',
      type: 'interactive',
      interactive: {
        type: 'contact_request',
        body: { text: 'Share your number so we can follow up' },
        action: { name: 'request_contact_info' },
      },
    },
    undefined,
  )
})

it('sends a contact-info request to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendRequestContactInfoMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    bodyText: 'Share your number',
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
        type: 'contact_request',
        body: { text: 'Share your number' },
        action: { name: 'request_contact_info' },
      },
      biz_opaque_callback_data: 'tracking-123',
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendRequestContactInfoMessage({
      accessToken: 'test_token',
      from: '123456789',
      bodyText: 'Share your number',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "to" or "recipient" is required]`,
  )
})

it('throws when the body text is too long', async () => {
  await expect(
    sendRequestContactInfoMessage({
      accessToken: 'test_token',
      from: '123456789',
      recipient: 'US.123',
      bodyText: 'x'.repeat(1025),
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Body text too long: 1025 characters. Maximum allowed: 1024 characters]`,
  )
})
