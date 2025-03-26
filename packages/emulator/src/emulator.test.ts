import type {
  CloudAPIErrorResponse,
  CloudAPIResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { SupportedVersion } from './constants.js'
import { WhatsAppEmulator } from './emulator.js'

const emulator = new WhatsAppEmulator({
  businessPhoneNumberId: '15550123456',
})

beforeAll(async () => {
  await emulator.start()
})

afterAll(async () => {
  await emulator.stop()
})

it('should respond to health check', async () => {
  const response = await fetch('http://localhost:4004/are-you-ok')
  const data = (await response.json()) as { status: string }
  expect(data).toEqual({ status: 'ok' })
})

it('should handle message sending with supported version', async () => {
  const response = await fetch(
    `http://localhost:4004/${SupportedVersion}/15550123456/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '15551234567',
        type: 'text',
        text: { body: 'Hello, World!' },
      }),
    },
  )

  const data = (await response.json()) as CloudAPIResponse
  expect(data.messaging_product).toBe('whatsapp')
  expect(data.contacts).toHaveLength(1)

  const contact = data.contacts[0]
  expect(contact).toBeDefined()
  if (!contact) throw new Error('Contact is undefined')
  expect(contact.input).toBe('15551234567')

  expect(data.messages).toHaveLength(1)
  const message = data.messages[0]
  expect(message).toBeDefined()
  if (!message) throw new Error('Message is undefined')
  expect(message.id).toMatch(/^mock_\d+_[a-z0-9]+$/)
})

it('should reject unsupported version', async () => {
  const response = await fetch(
    'http://localhost:4004/v18.0/15550123456/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '15551234567',
        type: 'text',
        text: { body: 'Hello, World!' },
      }),
    },
  )

  const data = (await response.json()) as CloudAPIErrorResponse
  expect(response.status).toBe(400)
  expect(data.error.type).toBe('UnsupportedVersion')
  expect(data.error.message).toContain(SupportedVersion)
  expect(data.error.error_subcode).toBe(1)
  expect(data.error.error_data?.messaging_product).toBe('whatsapp')
})
