import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError, apiRequest } from './axiosInstance'
import {
  generateInteriorImages,
  getAnalysis,
  getInteriorImageGenerationErrorMessage,
  replaceAnalysisSpaces,
  requestAnalysis,
  scanFloorPlan,
  scanLinkedFloorPlan,
  scanStoredFloorPlan,
} from './analysisApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockedApiRequest = vi.mocked(apiRequest)

describe('analysisApi', () => {
  beforeEach(() => mockedApiRequest.mockReset())

  it('loads analysis by request id', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: { requestId: 7, status: 'PENDING' } })
    await getAnalysis(7)
    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET', url: '/api/analysis/request/7', authenticated: true,
    }))
  })

  it('replaces the complete analysis space list', async () => {
    const spaces = [{ spaceName: '거실', spaceAreaM2: 20, floorAreaM2: 20, wallpaperAreaM2: 45, selectedForConstruction: true }]
    mockedApiRequest.mockResolvedValue({ success: true, message: '공간 정보 수정 완료', data: null })
    await expect(replaceAnalysisSpaces(7, spaces)).resolves.toBeUndefined()
    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'PUT', url: '/api/analysis/request/7/spaces', data: spaces, authenticated: true,
    }))
  })

  it('scans a floor plan with the request id, multipart file, and analysis timeout', async () => {
    mockedApiRequest.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { requestId: 7, status: 'COMPLETED' },
    })
    const file = new File(['floor-plan'], 'floor-plan.png', { type: 'image/png' })

    await scanFloorPlan(7, file)

    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: '/api/analysis/request/7/floorplan-scan',
      authenticated: true,
      timeout: 45_000,
      data: expect.any(FormData),
    }))
    const request = mockedApiRequest.mock.calls[0][0]
    expect((request.data as FormData).get('file')).toBe(file)
  })

  it('scans an attached floor plan without sending a request body', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: { requestId: 7, status: 'COMPLETED' } })
    await scanLinkedFloorPlan(7)
    expect(mockedApiRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/analysis/request/7/floorplan-scan-linked',
      authenticated: true,
      timeout: 45_000,
    })
    expect(mockedApiRequest.mock.calls[0][0]).not.toHaveProperty('data')
  })

  it('creates the pending job before storage scan and sends only the variant id', async () => {
    mockedApiRequest
      .mockResolvedValueOnce({ success: true, message: 'created', data: 19 })
      .mockResolvedValueOnce({ success: true, message: 'done', data: { requestId: 7, status: 'COMPLETED' } })

    await requestAnalysis(7)
    await scanStoredFloorPlan(7, 1)

    expect(mockedApiRequest.mock.calls[0][0]).toEqual(expect.objectContaining({ method: 'POST', url: '/api/analysis/request/7', authenticated: true }))
    expect(mockedApiRequest.mock.calls[1][0]).toEqual(expect.objectContaining({
      method: 'POST', url: '/api/analysis/request/7/floorplan-scan-storage', data: { floorPlanVariantId: 1 }, authenticated: true,
    }))
    expect(mockedApiRequest.mock.calls[1][0].data).not.toHaveProperty('floorPlanImageUrl')
  })

  it('requests an interior image with a generation-specific timeout', async () => {
    const input = { style: '모던', referenceImageUrl: '/api/files/images/room.jpg' }
    mockedApiRequest.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { imageUrls: ['/api/files/images/generated.png'] },
    })

    await generateInteriorImages(7, input)

    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: '/api/analysis/request/7/interior-images',
      data: input,
      authenticated: true,
      timeout: 75_000,
    }))
  })

  it.each([
    [new ApiClientError('unauthorized', 'http', 401), '로그인이 만료되었습니다. 다시 로그인해 주세요.'],
    [new ApiClientError('forbidden', 'http', 403), '이 의뢰의 AI 이미지를 생성할 권한이 없습니다.'],
    [new ApiClientError('unavailable', 'http', 503), 'AI 생성 설정을 확인할 수 없습니다.'],
    [new ApiClientError('network', 'network'), 'AI 생성 응답이 지연되고 있습니다. 다시 시도해 주세요.'],
    [new Error('unknown'), 'AI 이미지 생성 중 오류가 발생했습니다.'],
  ])('maps an interior image generation failure to a user-safe message', (error, expected) => {
    expect(getInteriorImageGenerationErrorMessage(error)).toBe(expected)
  })
})
