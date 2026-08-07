import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { generateInteriorImages, getAnalysis, replaceAnalysisSpaces } from './analysisApi'

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
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: spaces })
    await replaceAnalysisSpaces(7, spaces)
    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'PUT', url: '/api/analysis/request/7/spaces', data: spaces, authenticated: true,
    }))
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
})
