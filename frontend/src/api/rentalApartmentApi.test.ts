import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { searchRentalApartments } from './rentalApartmentApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)
const page = {
  content: [{
    id: 128,
    apartmentName: '상무센트럴자이',
    roadAddress: '상무중앙로 100',
    lotAddress: '치평동 1234',
    exclusiveAreaM2: 84.97,
    sggCode: '29155',
  }],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
}

describe('rental apartment search API', () => {
  beforeEach(() => {
    request.mockReset().mockResolvedValue({ success: true, message: '검색 완료', data: page })
  })

  it('uses the public apartments endpoint with trimmed keyword and default pagination', async () => {
    await expect(searchRentalApartments({ keyword: ' 상무 ' })).resolves.toEqual(page)
    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/rental-transactions/apartments',
      params: { keyword: '상무', page: 0, size: 20 },
      authenticated: false,
    })
  })

  it('includes a valid sggCode and omits it when unavailable', async () => {
    await searchRentalApartments({ sggCode: '29155', keyword: '치평동', page: 1, size: 10 })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { sggCode: '29155', keyword: '치평동', page: 1, size: 10 },
    }))

    await searchRentalApartments({ keyword: '치평동' })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { keyword: '치평동', page: 0, size: 20 },
    }))
  })

  it('blocks an invalid sggCode before making a request', async () => {
    await expect(searchRentalApartments({ sggCode: '2915' })).rejects.toThrow('숫자 5자리')
    expect(request).not.toHaveBeenCalled()
  })
})
