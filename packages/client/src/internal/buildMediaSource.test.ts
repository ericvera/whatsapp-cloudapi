import { expect, it } from 'vitest'
import { buildMediaSource } from './buildMediaSource.js'

it('returns an { id } fragment when only mediaId is provided', () => {
  expect(buildMediaSource('media_123', undefined)).toEqual({ id: 'media_123' })
})

it('returns a { link } fragment when only link is provided', () => {
  expect(buildMediaSource(undefined, 'https://example.com/a.jpg')).toEqual({
    link: 'https://example.com/a.jpg',
  })
})

it('throws when both mediaId and link are provided', () => {
  expect(() =>
    buildMediaSource('media_123', 'https://example.com/a.jpg'),
  ).toThrow('Provide only one of "mediaId" / "link"')
})

it('throws when neither mediaId nor link is provided', () => {
  expect(() => buildMediaSource(undefined, undefined)).toThrow(
    'Either "mediaId" or "link" is required',
  )
})
