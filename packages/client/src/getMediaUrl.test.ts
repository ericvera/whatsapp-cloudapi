import { expect, it, vi } from 'vitest'
import { getMediaUrl } from './getMediaUrl.js'

vi.mock('./internal/apiRequest.js', () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from './internal/apiRequest.js'
const mockApiRequest = vi.mocked(apiRequest)

const meta = {
  messaging_product: 'whatsapp' as const,
  url: 'https://lookaside.example/abc',
  mime_type: 'image/jpeg',
  sha256: 'hash',
  file_size: 1234,
  id: 'media_1',
}

it('retrieves media url/metadata via a GET request', async () => {
  mockApiRequest.mockResolvedValueOnce(meta)

  const result = await getMediaUrl({
    accessToken: 'test_token',
    mediaId: 'media_1',
  })

  expect(result).toEqual(meta)
  expect(mockApiRequest).toHaveBeenCalledWith({
    accessToken: 'test_token',
    method: 'GET',
    path: 'media_1',
    baseUrl: undefined,
  })
})

it('forwards a custom baseUrl', async () => {
  mockApiRequest.mockResolvedValueOnce(meta)

  await getMediaUrl({
    accessToken: 'test_token',
    mediaId: 'media_1',
    baseUrl: 'http://localhost:4004',
  })

  expect(mockApiRequest).toHaveBeenCalledWith({
    accessToken: 'test_token',
    method: 'GET',
    path: 'media_1',
    baseUrl: 'http://localhost:4004',
  })
})
