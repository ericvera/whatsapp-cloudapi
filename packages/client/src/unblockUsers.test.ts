import { expect, it, vi } from 'vitest'
import { unblockUsers } from './unblockUsers.js'

vi.mock('./internal/apiRequest.js', () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from './internal/apiRequest.js'
const mockApiRequest = vi.mocked(apiRequest)

const response = {
  messaging_product: 'whatsapp' as const,
  block_users: {
    removed_users: [{ input: '+16505551234', wa_id: '16505551234' }],
  },
}

it('unblocks users via a DELETE to block_users', async () => {
  mockApiRequest.mockResolvedValueOnce(response)

  const result = await unblockUsers({
    accessToken: 'test_token',
    from: '106540352242922',
    users: ['+16505551234'],
  })

  expect(result).toEqual(response)
  expect(mockApiRequest).toHaveBeenCalledWith({
    accessToken: 'test_token',
    method: 'DELETE',
    path: '106540352242922/block_users',
    body: {
      messaging_product: 'whatsapp',
      block_users: [{ user: '+16505551234' }],
    },
  })
})

it('forwards a custom baseUrl', async () => {
  mockApiRequest.mockResolvedValueOnce(response)

  await unblockUsers({
    accessToken: 'test_token',
    from: '106540352242922',
    users: ['+16505551234'],
    baseUrl: 'http://localhost:4004',
  })

  expect(mockApiRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'DELETE',
      path: '106540352242922/block_users',
      baseUrl: 'http://localhost:4004',
    }),
  )
})
