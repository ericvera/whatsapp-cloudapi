import { CloudAPIResponse } from '@whatsapp-cloudapi/types/cloudapi'
import supertest from 'supertest'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { WhatsAppEmulator } from '../emulator/WhatsAppEmulator.js'

const businessPhoneNumberId = '15550000001'

let emulator: WhatsAppEmulator
let request: ReturnType<typeof supertest>

beforeAll(async () => {
  emulator = new WhatsAppEmulator({
    businessPhoneNumberId,
    host: '127.0.0.1',
    port: 0,
    log: { level: 'quiet' },
  })
  await emulator.start()

  const server = emulator.getServer()
  if (!server) {
    throw new Error('Emulator server failed to start')
  }
  // start() resolves before the server emits 'listening'; wait for it so
  // supertest binds to the running server instead of managing its lifecycle.
  if (!server.listening) {
    await new Promise<void>((resolve) => {
      server.once('listening', () => {
        resolve()
      })
    })
  }
  request = supertest(server)
})

afterAll(async () => {
  await emulator.stop()
})

it('sends a text message and returns 200 with the response shape', async () => {
  const res = await request
    .post(`/v25.0/${businessPhoneNumberId}/messages`)
    .send({
      messaging_product: 'whatsapp',
      to: '+15551234567',
      type: 'text',
      text: { body: 'hi' },
    })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIResponse
  expect(body.messaging_product).toBe('whatsapp')
  expect(body.contacts[0]?.input).toBe('15551234567')
  expect(body.messages[0]?.id).toMatch(/^message_/)
})

it('rejects an unsupported API version with a 400', async () => {
  const res = await request
    .post(`/v1.0/${businessPhoneNumberId}/messages`)
    .send({
      messaging_product: 'whatsapp',
      to: '+15551234567',
      type: 'text',
      text: { body: 'hi' },
    })

  expect(res.status).toBe(400)
})
