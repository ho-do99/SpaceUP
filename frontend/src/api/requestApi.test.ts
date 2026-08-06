import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { attachRequestImage, createRequest, getRequestImages } from './requestApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockedApiRequest = vi.mocked(apiRequest)

describe('requestApi', () => {
  beforeEach(() => mockedApiRequest.mockReset())

  it('creates an authenticated request and unwraps its response', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: { id: 7 } })
    const input = { region: '광주', propertyType: 'VILLA', areaM2: 59 }
    await expect(createRequest(input)).resolves.toMatchObject({ id: 7 })
    expect(mockedApiRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST', url: '/api/requests', data: input, authenticated: true,
    }))
  })

  it('attaches and filters request images', async () => {
    mockedApiRequest.mockResolvedValue({ success: true, message: 'ok', data: [] })
    await attachRequestImage(7, { imageType: 'FLOOR_PLAN', imageUrl: '/api/files/images/a.png' })
    await getRequestImages(7, 'FLOOR_PLAN')
    expect(mockedApiRequest).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'GET', url: '/api/requests/7/images', params: { imageType: 'FLOOR_PLAN' }, authenticated: true,
    }))
  })
})
