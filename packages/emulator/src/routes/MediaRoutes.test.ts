import { CloudAPIMediaUploadResponse } from '@whatsapp-cloudapi/types/cloudapi'
import { createHash } from 'crypto'
import supertest from 'supertest'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { WhatsAppEmulator } from '../emulator/WhatsAppEmulator.js'

const businessPhoneNumberId = '15550000002'

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

const uploadPath = `/v25.0/${businessPhoneNumberId}/media`

it('uploads a PNG and returns id, file_size, mime_type, and sha256', async () => {
  const bytes = Buffer.from('fake png bytes')

  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', bytes, { filename: 'pic.png', contentType: 'image/png' })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIMediaUploadResponse
  expect(body.id).toMatch(/^media_/)
  expect(body.file_size).toBe(bytes.length)
  expect(body.mime_type).toBe('image/png')
  expect(body.sha256).toBe(createHash('sha256').update(bytes).digest('hex'))
})

it('accepts an audio file', async () => {
  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', Buffer.from('audio'), {
      filename: 'a.mp3',
      contentType: 'audio/mpeg',
    })

  expect(res.status).toBe(200)
})

it('accepts a video file', async () => {
  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', Buffer.from('video'), {
      filename: 'v.mp4',
      contentType: 'video/mp4',
    })

  expect(res.status).toBe(200)
})

it('accepts a document file', async () => {
  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', Buffer.from('doc'), {
      filename: 'd.pdf',
      contentType: 'application/pdf',
    })

  expect(res.status).toBe(200)
})

it('accepts a sticker file', async () => {
  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', Buffer.from('sticker'), {
      filename: 's.webp',
      contentType: 'image/webp',
    })

  expect(res.status).toBe(200)
})

it('rejects an unsupported MIME type', async () => {
  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', Buffer.from('x'), {
      filename: 'x.foo',
      contentType: 'application/x-foo',
    })

  expect(res.status).toBe(400)
})

it('rejects a file exceeding its category size limit', async () => {
  // 600KB webp: over the 500KB sticker limit but under the global cap
  const big = Buffer.alloc(600 * 1024, 1)

  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', big, { filename: 'big.webp', contentType: 'image/webp' })

  expect(res.status).toBe(400)
})

it('rejects an upload missing messaging_product', async () => {
  const res = await request
    .post(uploadPath)
    .attach('file', Buffer.from('png'), {
      filename: 'pic.png',
      contentType: 'image/png',
    })

  expect(res.status).toBe(400)
})
