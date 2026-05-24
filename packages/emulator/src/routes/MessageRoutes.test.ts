import { CloudAPIResponse } from '@whatsapp-cloudapi/types/cloudapi'
import supertest from 'supertest'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
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

const messagesPath = `/v25.0/${businessPhoneNumberId}/messages`

it('accepts a valid contacts message', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'contacts',
    contacts: [{ name: { formatted_name: 'Jane Doe', first_name: 'Jane' } }],
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIResponse
  expect(body.messaging_product).toBe('whatsapp')
  expect(body.messages[0]?.id).toMatch(/^message_/)
})

it('rejects a contacts message with an empty contacts array', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'contacts',
    contacts: [],
  })

  expect(res.status).toBe(400)
})

it('rejects a contact missing name.formatted_name', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'contacts',
    contacts: [{ name: { first_name: 'Jane' } }],
  })

  expect(res.status).toBe(400)
})

it('accepts a valid contact_request interactive message', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'contact_request',
      body: { text: 'Share your number so we can follow up' },
      action: { name: 'request_contact_info' },
    },
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIResponse
  expect(body.messages[0]?.id).toMatch(/^message_/)
})

it('rejects a contact_request with an empty body text', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'contact_request',
      body: { text: '' },
      action: { name: 'request_contact_info' },
    },
  })

  expect(res.status).toBe(400)
})

it('rejects a contact_request with the wrong action name', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'contact_request',
      body: { text: 'Share your number' },
      action: { name: 'wrong_action' },
    },
  })

  expect(res.status).toBe(400)
})

it('rejects a contact_request with body text over 1024 characters', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'contact_request',
      body: { text: 'x'.repeat(1025) },
      action: { name: 'request_contact_info' },
    },
  })

  expect(res.status).toBe(400)
})

it('accepts a BSUID recipient-only contact_request (no "to")', async () => {
  const bsuid = 'US.13491208655302741918'
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    recipient: bsuid,
    type: 'interactive',
    interactive: {
      type: 'contact_request',
      body: { text: 'Share your number so we can follow up' },
      action: { name: 'request_contact_info' },
    },
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIResponse
  expect(body.contacts[0]?.input).toBe(bsuid)
  expect(body.messages[0]?.id).toMatch(/^message_/)
})

it('rejects a send with neither "to" nor "recipient"', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    type: 'text',
    text: { body: 'hi' },
  })

  expect(res.status).toBe(400)
})

it('accepts a valid product interactive message', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'product',
      body: { text: 'Check this out' },
      action: { catalog_id: 'CATALOG-1', product_retailer_id: 'SKU-1' },
    },
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIResponse
  expect(body.messages[0]?.id).toMatch(/^message_/)
})

it('rejects a product message missing catalog/product ids', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'product',
      action: { catalog_id: '', product_retailer_id: '' },
    },
  })

  expect(res.status).toBe(400)
})

it('accepts a valid product_list interactive message', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'product_list',
      header: { type: 'text', text: 'Our picks' },
      body: { text: 'Browse our products' },
      action: {
        catalog_id: 'CATALOG-1',
        sections: [
          {
            title: 'Shoes',
            product_items: [{ product_retailer_id: 'SKU-1' }],
          },
        ],
      },
    },
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIResponse
  expect(body.messages[0]?.id).toMatch(/^message_/)
})

it('rejects a product_list message with no sections', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'interactive',
    interactive: {
      type: 'product_list',
      header: { type: 'text', text: 'Our picks' },
      body: { text: 'Browse' },
      action: { catalog_id: 'CATALOG-1', sections: [] },
    },
  })

  expect(res.status).toBe(400)
})

it('still accepts an audio message (unsupported type unchanged)', async () => {
  const res = await request.post(messagesPath).send({
    messaging_product: 'whatsapp',
    to: '+15551234567',
    type: 'audio',
    audio: { id: 'media_x' },
  })

  expect(res.status).toBe(200)
})

it('fires the status webhook when a contacts message is accepted', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })
  vi.stubGlobal('fetch', mockFetch)

  const webhookBusinessId = '15550000011'
  const webhookEmulator = new WhatsAppEmulator({
    businessPhoneNumberId: webhookBusinessId,
    host: '127.0.0.1',
    port: 0,
    log: { level: 'quiet' },
    webhook: { url: 'http://127.0.0.1:1/webhook', verifyToken: 'tok' },
  })
  await webhookEmulator.start()

  const server = webhookEmulator.getServer()
  if (!server) {
    throw new Error('Webhook emulator server failed to start')
  }
  if (!server.listening) {
    await new Promise<void>((resolve) => {
      server.once('listening', () => {
        resolve()
      })
    })
  }
  const webhookRequest = supertest(server)

  const res = await webhookRequest
    .post(`/v25.0/${webhookBusinessId}/messages`)
    .send({
      messaging_product: 'whatsapp',
      to: '+15551234567',
      type: 'contacts',
      contacts: [{ name: { formatted_name: 'Jane Doe' } }],
    })
  expect(res.status).toBe(200)

  await vi.waitFor(() => {
    expect(mockFetch).toHaveBeenCalled()
  })

  vi.unstubAllGlobals()
  await webhookEmulator.stop()
})
