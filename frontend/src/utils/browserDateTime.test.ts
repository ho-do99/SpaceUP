import { describe, expect, it } from 'vitest'
import {
  formatBrowserDateTime,
  formatBrowserMonthDayTime,
  formatBrowserTime24,
  parseApiDateTime,
} from './browserDateTime'

describe('browserDateTime', () => {
  it('treats a zone-less backend timestamp as UTC', () => {
    expect(parseApiDateTime('2026-08-20T05:06:00')?.toISOString())
      .toBe('2026-08-20T05:06:00.000Z')
  })

  it('keeps an explicit offset instead of adding another zone', () => {
    expect(parseApiDateTime('2026-08-20T14:06:00+09:00')?.toISOString())
      .toBe('2026-08-20T05:06:00.000Z')
  })

  it('formats timestamps with the runtime browser time zone', () => {
    const value = '2026-08-20T05:06:00'
    const local = new Date('2026-08-20T05:06:00Z')
    const hour = String(local.getHours()).padStart(2, '0')
    const minute = String(local.getMinutes()).padStart(2, '0')
    const month = String(local.getMonth() + 1).padStart(2, '0')
    const day = String(local.getDate()).padStart(2, '0')

    expect(formatBrowserTime24(value)).toBe(`${hour}:${minute}`)
    expect(formatBrowserMonthDayTime(value)).toBe(`${month}-${day} ${hour}:${minute}`)
    expect(formatBrowserDateTime(value)).toBe(`${local.getFullYear()}-${month}-${day} ${hour}:${minute}`)
  })
})
