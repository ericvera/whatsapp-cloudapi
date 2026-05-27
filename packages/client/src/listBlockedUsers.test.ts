import { expect, it, vi } from 'vitest'
import { listBlockedUsers } from './listBlockedUsers.js'

vi.mock('./internal/apiRequest.js', () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from './internal/apiRequest.js'
const mockApiRequest = vi.mocked(apiRequest)

const response = {
  data: [{ messaging_product: 'whatsapp' as const, wa_id: '16505551234' }],
  paging: { cursors: { after: 'a-cursor', before: 'b-cursor' } },
}

it('lists blocked users via a GET to block_users', async () => {
  mockApiRequest.mockResolvedValueOnce(response)

  const result = await listBlockedUsers({
    accessToken: 'test_token',
    from: '106540352242922',
  })

  expect(result).toEqual(response)
  expect(mockApiRequest).toHaveBeenCalledWith({
    accessToken: 'test_token',
    method: 'GET',
    path: '106540352242922/block_users',
  })
})

it('passes pagination params in the query string', async () => {
  mockApiRequest.mockResolvedValueOnce(response)

  await listBlockedUsers({
    accessToken: 'test_token',
    from: '106540352242922',
    limit: 10,
    after: 'next-cursor',
  })

  expect(mockApiRequest).toHaveBeenCalledWith({
    accessToken: 'test_token',
    method: 'GET',
    path: '106540352242922/block_users?limit=10&after=next-cursor',
  })
})

it('forwards a custom baseUrl', async () => {
  mockApiRequest.mockResolvedValueOnce(response)

  await listBlockedUsers({
    accessToken: 'test_token',
    from: '106540352242922',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockApiRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'GET',
      path: '106540352242922/block_users',
      baseUrl: 'http://localhost:4004',
    }),
  )
})
