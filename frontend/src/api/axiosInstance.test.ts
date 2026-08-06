import { describe, expect, it } from 'vitest'
import { API_BASE_URL, normalizeRequestUrl } from './axiosInstance'

describe('API client configuration', () => {
  it('uses the current backend port', () => {
    expect(API_BASE_URL).toBe('http://localhost:8090')
  })

  it('normalizes API paths without duplicating the prefix', () => {
    expect(normalizeRequestUrl('api/member/login')).toBe('/api/member/login')
    expect(normalizeRequestUrl('/api/api/member/login')).toBe('/api/member/login')
    expect(normalizeRequestUrl('https://example.com/api')).toBe('https://example.com/api')
  })
})
