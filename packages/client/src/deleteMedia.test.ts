import { expect, it, vi } from 'vitest'
import { deleteMedia } from './deleteMedia.js'

vi.mock('./internal/apiRequest.js', () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from './internal/apiRequest.js'
const mockApiRequest = vi.mocked(apiRequest)

it('deletes a media asset via a DELETE request', async () => {
  mockApiRequest.mockResolvedValueOnce({ success: true })

  const result = await deleteMedia({
    accessToken: 'test_token',
    mediaId: 'media_1',
  })

  expect(result).toEqual({ success: true })
  expect(mockApiRequest).toHaveBeenCalledWith({
    accessToken: 'test_token',
    method: 'DELETE',
    path: 'media_1',
    baseUrl: undefined,
  })
})

it('forwards a custom baseUrl', async () => {
  mockApiRequest.mockResolvedValueOnce({ success: true })

  await deleteMedia({
    accessToken: 'test_token',
    mediaId: 'media_1',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockApiRequest).toHaveBeenCalledWith({
    accessToken: 'test_token',
    method: 'DELETE',
    path: 'media_1',
    baseUrl: 'http://localhost:4004',
  })
})
