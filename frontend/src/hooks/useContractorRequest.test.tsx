import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAnalysis } from '@/api/analysisApi'
import { getRequest, getRequestImages } from '@/api/requestApi'
import useContractorRequest from './useContractorRequest'

vi.mock('@/api/analysisApi', () => ({ getAnalysis: vi.fn() }))
vi.mock('@/api/requestApi', () => ({ getRequest: vi.fn(), getRequestImages: vi.fn() }))

const mockedGetAnalysis = vi.mocked(getAnalysis)
const mockedGetRequest = vi.mocked(getRequest)
const mockedGetRequestImages = vi.mocked(getRequestImages)

describe('useContractorRequest', () => {
  beforeEach(() => {
    mockedGetAnalysis.mockReset().mockRejectedValue(new Error('분석을 찾을 수 없습니다.'))
    mockedGetRequest.mockReset()
    mockedGetRequestImages.mockReset().mockResolvedValue([])
  })

  afterEach(() => vi.clearAllMocks())

  it('keeps a numeric request empty when its API request fails', async () => {
    mockedGetRequest.mockRejectedValue(new Error('의뢰를 찾을 수 없습니다.'))

    const { result } = renderHook(() => useContractorRequest('99'))

    expect(result.current.request).toBeNull()
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.request).toBeNull()
    expect(result.current.error).toBe('의뢰를 찾을 수 없습니다.')
  })

  it('initializes a nonnumeric design route from its mock detail', () => {
    const { result } = renderHook(() => useContractorRequest('REQ-260715-012'))

    expect(result.current.request?.requestId).toBe('REQ-260715-012')
    expect(result.current.loading).toBe(false)
  })

  it('clears a nonnumeric mock before a numeric route API failure resolves', async () => {
    let rejectRequest: (reason?: unknown) => void = () => undefined
    mockedGetRequest.mockImplementationOnce(() => new Promise((_, reject) => { rejectRequest = reject }))

    const { result, rerender } = renderHook(
      ({ requestId }) => useContractorRequest(requestId),
      { initialProps: { requestId: 'REQ-260715-012' } },
    )

    expect(result.current.request?.requestId).toBe('REQ-260715-012')

    rerender({ requestId: '99' })

    expect(result.current.request).toBeNull()

    act(() => rejectRequest(new Error('의뢰를 찾을 수 없습니다.')))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.request).toBeNull()
    expect(result.current.error).toBe('의뢰를 찾을 수 없습니다.')
  })
})
