import { expect, it, vi } from 'vitest'
import { sendContactsMessage } from './sendContactsMessage.js'

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

const sampleContacts = [
  {
    name: { formatted_name: 'John Doe', first_name: 'John' },
    phones: [{ phone: '+16505551234', type: 'WORK' as const }],
  },
]

it('sends a contacts message to a phone number', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  const result = await sendContactsMessage({
    accessToken: 'test_token',
    from: '123456789',
    to: '+1234567890',
    contacts: sampleContacts,
  })

  expect(result).toEqual(mockResponse)
  expect(mockSendRequest).toHaveBeenCalledWith(
    'test_token',
    '123456789',
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+1234567890',
      type: 'contacts',
      contacts: sampleContacts,
    },
    undefined,
  )
})

it('sends a contacts message to a recipient (BSUID) with reply context', async () => {
  mockSendRequest.mockResolvedValueOnce(mockResponse)

  await sendContactsMessage({
    accessToken: 'test_token',
    from: '123456789',
    recipient: 'US.123',
    contacts: sampleContacts,
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
      type: 'contacts',
      contacts: sampleContacts,
    },
    undefined,
  )
})

it('throws when neither to nor recipient is provided', async () => {
  await expect(
    sendContactsMessage({
      accessToken: 'test_token',
      from: '123456789',
      contacts: sampleContacts,
    }),
  ).rejects.toThrow('Either "to" or "recipient" is required')
})

it('throws when the contacts array is empty', async () => {
  await expect(
    sendContactsMessage({
      accessToken: 'test_token',
      from: '123456789',
      to: '+1234567890',
      contacts: [],
    }),
  ).rejects.toThrow('At least one contact is required')
})
