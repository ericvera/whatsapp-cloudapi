import { expect, it } from 'vitest'
import { buildRecipient } from './buildRecipient.js'

it('returns a { to } fragment when only to is provided', () => {
  expect(buildRecipient('+1234567890', undefined)).toEqual({
    to: '+1234567890',
  })
})

it('returns a { recipient } fragment when only recipient is provided', () => {
  expect(buildRecipient(undefined, 'bsuid_123')).toEqual({
    recipient: 'bsuid_123',
  })
})

it('includes both when to and recipient are provided', () => {
  expect(buildRecipient('+1234567890', 'bsuid_123')).toEqual({
    to: '+1234567890',
    recipient: 'bsuid_123',
  })
})

it('throws when neither to nor recipient is provided', () => {
  expect(() =>
    buildRecipient(undefined, undefined),
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Either "to" or "recipient" is required]`,
  )
})
