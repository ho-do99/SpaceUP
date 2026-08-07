import { beforeEach, describe, expect, it } from 'vitest'
import { clearRequestFlow, getActiveRequestId, getRequestDraft, parseManwon, saveRequestDraft, setActiveRequestId } from './requestFlow'

describe('requestFlow', () => {
  beforeEach(() => sessionStorage.clear())

  it('normalizes displayed 만원 values to won', () => {
    expect(parseManwon('1,500만원')).toBe(15_000_000)
  })

  it('stores one active request and draft for the multi-page flow', () => {
    saveRequestDraft({ region: '광주', propertyType: 'VILLA', areaM2: 59 })
    setActiveRequestId(7)
    expect(getRequestDraft()?.region).toBe('광주')
    expect(getActiveRequestId()).toBe(7)
    clearRequestFlow()
    expect(getActiveRequestId()).toBeNull()
  })
})
