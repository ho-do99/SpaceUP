import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from './axiosInstance'

describe('API client configuration', () => {
  it('uses the current backend port', () => {
    expect(API_BASE_URL).toBe('http://localhost:8090')
  })
})
