import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { attachRequestImage, createRequest, deleteEstimateRequest, deleteRequestImage, getRequestImages, updateRequest } from './requestApi'
import type { RequestUpdateInput } from '@/types/request'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockedApiRequest = vi.mocked(apiRequest)

describe('requestApi', () => {
  beforeEach(() => mockedApiRequest.mockReset())

  it('creates an authenticated request and unwraps its response', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: 7 })
    const input = { region: '광주', propertyType: 'VILLA', areaM2: 59 }
    await expect(createRequest(input)).resolves.toBe(7)
    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST', url: '/api/requests', data: input, authenticated: true,
    }))
  })

  it('attaches and filters request images', async () => {
    mockedApiRequest.mockResolvedValueOnce({ success: true, message: 'ok', data: 31 })
    await expect(attachRequestImage(7, { imageType: 'FLOOR_PLAN', imageUrl: '/api/files/images/a.png' })).resolves.toBe(31)
    mockedApiRequest.mockResolvedValueOnce({ success: true, message: 'ok', data: [] })
    await getRequestImages(7, 'FLOOR_PLAN')
    expect(mockedApiRequest).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'GET', url: '/api/requests/7/images', params: { imageType: 'FLOOR_PLAN' }, authenticated: true,
    }))
  })

  it('accepts the backend null payload for a successful partial update', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: null })
    const input = {
      budgetMin: 3_000_000,
      selectedTheme: 'WOOD',
      selectedFlooringProductId: 11,
      selectedWallpaperProductId: 12,
      selectedLightingProductId: 13,
    } satisfies RequestUpdateInput

    await expect(updateRequest(7, input)).resolves.toBeUndefined()
    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({ data: input }))
  })

  it('deletes the exact request image id from its owning request', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: null })
    await expect(deleteRequestImage(17, 91)).resolves.toBeUndefined()
    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'DELETE', url: '/api/requests/17/images/91', authenticated: true,
    }))
  })

  it('deletes the authenticated landlord request', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: null })

    await expect(deleteEstimateRequest(17)).resolves.toBeUndefined()

    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'DELETE', url: '/api/requests/17', authenticated: true,
    }))
  })
})
