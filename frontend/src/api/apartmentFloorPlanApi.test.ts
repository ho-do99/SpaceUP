import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { getFloorPlanVariantPreviewUrl, searchApartmentFloorPlans } from './apartmentFloorPlanApi'

vi.mock('./axiosInstance', async (importOriginal) => ({ ...(await importOriginal<typeof import('./axiosInstance')>()), apiRequest: vi.fn() }))
const request = vi.mocked(apiRequest)

describe('apartmentFloorPlanApi', () => {
  beforeEach(() => request.mockReset())
  it('searches the public catalog and preserves variant image availability', async () => {
    const data = { content: [{ id: 10, name: '상무', roadAddress: '도로', lotAddress: '지번', region: '광주', variants: [{ id: 1, exclusiveAreaM2: 59, supplyAreaM2: 84, exclusivePyeong: 17.8, supplyPyeong: 25.4, typeLabel: '기본', roomCount: 3, floorPlanImageUrl: 'floorplans/1.png' }, { id: 2, exclusiveAreaM2: 74, supplyAreaM2: null, exclusivePyeong: null, supplyPyeong: null, typeLabel: null, roomCount: null, floorPlanImageUrl: null }] }], totalElements: 1, totalPages: 1, number: 0, size: 20 }
    request.mockResolvedValue({ success: true, message: 'ok', data })
    await expect(searchApartmentFloorPlans({ keyword: ' 상무 ' })).resolves.toEqual(data)
    expect(request).toHaveBeenCalledWith({ method: 'GET', url: '/api/floorplans/apartments/search', params: { page: 0, size: 20, keyword: '상무' }, authenticated: false })
  })
  it('uses the backend image proxy instead of the object key', () => {
    expect(getFloorPlanVariantPreviewUrl(1)).toBe('/api/floorplans/apartments/variants/1/image')
  })
})
