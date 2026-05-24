import {
  CloudAPIBlockUsersResponse,
  CloudAPIListBlockedUsersResponse,
  CloudAPIUnblockUsersResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import supertest from 'supertest'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { WhatsAppEmulator } from '../emulator/WhatsAppEmulator.js'

const businessPhoneNumberId = '15550000004'

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

const blockPath = `/v25.0/${businessPhoneNumberId}/block_users`

const listWaIds = async (): Promise<string[]> => {
  const res = await request.get(blockPath)
  expect(res.status).toBe(200)
  const body = res.body as CloudAPIListBlockedUsersResponse
  return body.data.map((entry) => entry.wa_id)
}

it('blocks users and lists them', async () => {
  const res = await request.post(blockPath).send({
    messaging_product: 'whatsapp',
    block_users: [{ user: '+16500000001' }, { user: '+16500000002' }],
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIBlockUsersResponse
  expect(body.messaging_product).toBe('whatsapp')
  expect(body.block_users.added_users).toEqual([
    { input: '+16500000001', wa_id: '16500000001' },
    { input: '+16500000002', wa_id: '16500000002' },
  ])

  const waIds = await listWaIds()
  expect(waIds).toContain('16500000001')
  expect(waIds).toContain('16500000002')
})

it('unblocks a user and removes it from the list', async () => {
  await request.post(blockPath).send({
    messaging_product: 'whatsapp',
    block_users: [{ user: '+16500000003' }],
  })

  const res = await request.delete(blockPath).send({
    messaging_product: 'whatsapp',
    block_users: [{ user: '+16500000003' }],
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIUnblockUsersResponse
  expect(body.block_users.removed_users).toEqual([
    { input: '+16500000003', wa_id: '16500000003' },
  ])

  const waIds = await listWaIds()
  expect(waIds).not.toContain('16500000003')
})

it('blocking an already-blocked user keeps a single entry', async () => {
  await request.post(blockPath).send({
    messaging_product: 'whatsapp',
    block_users: [{ user: '+16500000004' }],
  })
  const second = await request.post(blockPath).send({
    messaging_product: 'whatsapp',
    block_users: [{ user: '+16500000004' }],
  })

  expect(second.status).toBe(200)

  const waIds = await listWaIds()
  expect(waIds.filter((id) => id === '16500000004')).toHaveLength(1)
})

it('unblocking a user that is not blocked does not crash', async () => {
  const res = await request.delete(blockPath).send({
    messaging_product: 'whatsapp',
    block_users: [{ user: '+16500000099' }],
  })

  expect(res.status).toBe(200)
  const body = res.body as CloudAPIUnblockUsersResponse
  expect(body.block_users.removed_users).toEqual([
    { input: '+16500000099', wa_id: '16500000099' },
  ])
})

it('rejects an empty block_users array', async () => {
  const res = await request
    .post(blockPath)
    .send({ messaging_product: 'whatsapp', block_users: [] })

  expect(res.status).toBe(400)
})

it('rejects a missing block_users array', async () => {
  const res = await request
    .post(blockPath)
    .send({ messaging_product: 'whatsapp' })

  expect(res.status).toBe(400)
})

it('rejects an unsupported version', async () => {
  const res = await request
    .post(`/v1.0/${businessPhoneNumberId}/block_users`)
    .send({
      messaging_product: 'whatsapp',
      block_users: [{ user: '+16500000001' }],
    })

  expect(res.status).toBe(400)
})

it('rejects a mismatched phone number ID', async () => {
  const res = await request.post('/v25.0/9999999999/block_users').send({
    messaging_product: 'whatsapp',
    block_users: [{ user: '+16500000001' }],
  })

  expect(res.status).toBe(400)
})
