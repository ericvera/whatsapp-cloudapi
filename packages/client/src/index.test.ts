import { expect, it } from 'vitest'
import { add } from './index.js'

it('works', () => {
  expect(add(1, 1)).toEqual(2)
})
