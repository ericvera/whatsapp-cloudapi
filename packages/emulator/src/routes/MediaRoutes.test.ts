import {
  CloudAPIMediaDeleteResponse,
  CloudAPIMediaUploadResponse,
  CloudAPIMediaURLResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import { createHash } from 'crypto'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
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

it('uploads a PNG and returns the media id only', async () => {
  const bytes = Buffer.from('fake png bytes')

  const res = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', bytes, { filename: 'pic.png', contentType: 'image/png' })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIMediaUploadResponse
  expect(body.id).toMatch(/^media_/)
  // The real upload endpoint returns { id } only; the metadata fields are
  // surfaced by the GET media-URL response instead.
  expect(body.file_size).toBeUndefined()
  expect(body.mime_type).toBeUndefined()
  expect(body.sha256).toBeUndefined()
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

it('round-trips upload -> metadata -> download with matching bytes', async () => {
  const bytes = Buffer.from('round-trip bytes')

  const uploadRes = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', bytes, { filename: 'r.png', contentType: 'image/png' })
  expect(uploadRes.status).toBe(200)
  const uploaded = uploadRes.body as CloudAPIMediaUploadResponse

  const metaRes = await request.get(`/v25.0/${uploaded.id}`)
  expect(metaRes.status).toBe(200)
  const meta = metaRes.body as CloudAPIMediaURLResponse
  expect(meta.id).toBe(uploaded.id)
  expect(meta.mime_type).toBe('image/png')
  expect(meta.file_size).toBe(bytes.length)
  expect(meta.sha256).toBe(createHash('sha256').update(bytes).digest('hex'))
  expect(meta.url).toContain(`/v25.0/${uploaded.id}/download`)

  const downloadPath = new URL(meta.url).pathname
  const dlRes = await request.get(downloadPath).buffer(true)
  expect(dlRes.status).toBe(200)
  const downloaded = dlRes.body as Buffer
  expect(downloaded.equals(bytes)).toBe(true)
})

it('returns 404 for unknown media metadata', async () => {
  const res = await request.get('/v25.0/media_does_not_exist')

  expect(res.status).toBe(404)
})

it('deletes media and then 404s on its metadata', async () => {
  const up = await request
    .post(uploadPath)
    .field('messaging_product', 'whatsapp')
    .attach('file', Buffer.from('del'), {
      filename: 'd.png',
      contentType: 'image/png',
    })
  const { id } = up.body as CloudAPIMediaUploadResponse

  const del = await request.delete(`/v25.0/${id}`)
  expect(del.status).toBe(200)
  expect((del.body as CloudAPIMediaDeleteResponse).success).toBe(true)

  const meta = await request.get(`/v25.0/${id}`)
  expect(meta.status).toBe(404)
})

it('rejects a media GET with an unsupported version', async () => {
  const res = await request.get('/v1.0/media_whatever')

  expect(res.status).toBe(400)
})

it('does not let the media route shadow /debug/health', async () => {
  const res = await request.get('/debug/health')

  expect(res.status).toBe(200)
  expect((res.body as { status: string }).status).toBe('ok')
})

it('keeps /debug/media/list reachable', async () => {
  const res = await request.get('/debug/media/list')

  expect(res.status).toBe(200)
})

it('returns 404 when downloading a byteless (imported) entry', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wa-media-'))
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const manifest = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    media: [
      {
        id: 'media_imported',
        filename: 'x.png',
        mimeType: 'image/png',
        size: 3,
        uploadedAt: new Date().toISOString(),
        expiresAt: future,
        sha256: 'abc',
      },
    ],
  }
  await writeFile(join(dir, 'media-manifest.json'), JSON.stringify(manifest))

  const importEmulator = new WhatsAppEmulator({
    businessPhoneNumberId: '15550000003',
    host: '127.0.0.1',
    port: 0,
    log: { level: 'quiet' },
    persistence: { importPath: dir, shouldExport: false },
  })
  await importEmulator.start()

  const server = importEmulator.getServer()
  if (!server) {
    throw new Error('Import emulator server failed to start')
  }
  if (!server.listening) {
    await new Promise<void>((resolve) => {
      server.once('listening', () => {
        resolve()
      })
    })
  }
  const importRequest = supertest(server)

  const meta = await importRequest.get('/v25.0/media_imported')
  expect(meta.status).toBe(200)

  const dl = await importRequest.get('/v25.0/media_imported/download')
  expect(dl.status).toBe(404)

  await importEmulator.stop()
  await rm(dir, { recursive: true, force: true })
})
