import { describe, expect, it } from 'vitest'
import { ApiClientError } from './axiosInstance'
import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'

describe('unwrapApiResponse', () => {
  it('returns successful response data', () => {
    expect(
      unwrapApiResponse(
        { success: true, message: 'ok', data: { id: 1 } },
        '요청 실패',
      ),
    ).toEqual({ id: 1 })
  })

  it('uses the backend business message', () => {
    expect(() =>
      unwrapApiResponse(
        { success: false, message: '현재 처리할 수 없습니다.', data: null },
        '요청 실패',
      ),
    ).toThrow('현재 처리할 수 없습니다.')
  })

  it('rejects a successful envelope with no data', () => {
    try {
      unwrapApiResponse(
        { success: true, message: 'ok', data: null },
        '요청 실패',
      )
      throw new Error('expected unwrapApiResponse to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiClientError)
      expect(error).toMatchObject({ kind: 'invalid-response' })
    }
  })
})

describe('unwrapEmptyApiResponse', () => {
  it('accepts a successful response with null data', () => {
    expect(unwrapEmptyApiResponse({ success: true, message: 'ok', data: null }, 'failed')).toBeUndefined()
  })

  it('still rejects a business failure', () => {
    expect(() => unwrapEmptyApiResponse({ success: false, message: 'denied', data: null }, 'failed'))
      .toThrow('denied')
  })
})
