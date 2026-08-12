import { parseProjectDate } from './project-date.utils'

describe('parseProjectDate', () => {
  it('parses date-only values in the local timezone', () => {
    const date = parseProjectDate('2025-03-08')

    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(8)
  })
})
