import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { searchApartmentFloorPlans } from '@/api/apartmentFloorPlanApi'
import { requestAnalysis } from '@/api/analysisApi'
import { createRequest } from '@/api/requestApi'
import { searchDaumAddress } from '@/utils/daumPostcode'
import ApartmentAddressSearchPage from './ApartmentAddressSearchPage'

vi.mock('@/api/apartmentFloorPlanApi', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/apartmentFloorPlanApi')>()), searchApartmentFloorPlans: vi.fn() }))
vi.mock('@/api/analysisApi', () => ({ requestAnalysis: vi.fn() }))
vi.mock('@/api/requestApi', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/requestApi')>()), createRequest: vi.fn() }))
vi.mock('@/utils/daumPostcode', () => ({ searchDaumAddress: vi.fn() }))

const search = vi.mocked(searchApartmentFloorPlans)
const create = vi.mocked(createRequest)
const createJob = vi.mocked(requestAnalysis)
const searchAddress = vi.mocked(searchDaumAddress)
const apartment = (floorPlanImageUrl: string | null) => ({ id: 10, name: '상무센트럴아파트', roadAddress: '상무중앙로 100', lotAddress: '치평동 1234', region: '광주 서구', variants: [{ id: 1, exclusiveAreaM2: 59, supplyAreaM2: 84, exclusivePyeong: 17.8, supplyPyeong: 25.4, typeLabel: '기본형', roomCount: 3, floorPlanImageUrl }] })
const page = (content: ReturnType<typeof apartment>[]) => ({ content, totalElements: content.length, totalPages: content.length ? 1 : 0, number: 0, size: 20 })

function renderPage() {
  return render(<MemoryRouter initialEntries={['/analysis/new/address']}><Routes><Route path="/analysis/new/address" element={<ApartmentAddressSearchPage />} /><Route path="/analysis/loading" element={<p>analysis loading</p>} /><Route path="/upload" element={<p>direct upload</p>} /></Routes></MemoryRouter>)
}
async function searchAndSelect() {
  fireEvent.change(screen.getByLabelText('아파트명 또는 주소'), { target: { value: '상무' } })
  fireEvent.click(screen.getByRole('button', { name: '아파트 검색' }))
  await waitFor(() => expect(searchAddress).toHaveBeenCalledWith('상무'))
  fireEvent.click(await screen.findByRole('button', { name: /상무센트럴아파트/ }))
}

describe('ApartmentAddressSearchPage storage floor plan flow', () => {
  beforeEach(() => {
    search.mockReset()
    searchAddress.mockReset().mockResolvedValue({
      roadAddress: '상무중앙로 100',
      lotAddress: '치평동 1234',
      buildingName: '상무센트럴아파트',
      displayAddress: '상무중앙로 100 (상무센트럴아파트)',
    })
    create.mockReset().mockResolvedValue(77)
    createJob.mockReset().mockResolvedValue(88)
    sessionStorage.clear()
  })
  afterEach(cleanup)

  it('uses the catalog variant id, creates a pending job first, and enters storage analysis without mock upload', async () => {
    search.mockResolvedValue(page([apartment('floorplans/floorplan1.png')]))
    renderPage(); await searchAndSelect()
    await waitFor(() => expect(search).toHaveBeenCalledWith({ keyword: '상무센트럴아파트', page: 0, size: 20 }))
    fireEvent.click(screen.getByRole('button', { name: '면적을 선택해주세요' }))
    fireEvent.click(screen.getByRole('radio'))
    expect(screen.getByRole('img', { name: '선택한 등록 평면도' })).toHaveAttribute('src', '/api/floorplans/variants/1/image')
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    await waitFor(() => expect(create).toHaveBeenCalled())
    expect(createJob).toHaveBeenCalledWith(77)
    expect(await screen.findByText('analysis loading')).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem('spaceup.floorPlanStorageAnalysis') ?? '{}')).toEqual({ mode: 'storage', floorPlanVariantId: 1, analysisJobId: 88 })
  })

  it('routes a null image variant to the existing direct upload flow without storage analysis', async () => {
    search.mockResolvedValue(page([apartment(null)]))
    renderPage(); await searchAndSelect()
    expect(screen.getByText('전용 59m² · 등록된 평면도가 없습니다')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '평면도 직접 업로드' }))
    expect(await screen.findByText('direct upload')).toBeInTheDocument()
    expect(createJob).not.toHaveBeenCalled()
  })

  it('keeps the selected official address and routes a catalog miss to direct upload', async () => {
    search.mockResolvedValue(page([])); renderPage()
    fireEvent.change(screen.getByLabelText('아파트명 또는 주소'), { target: { value: '상무' } }); fireEvent.click(screen.getByRole('button', { name: '아파트 검색' }))
    await screen.findByText('상무중앙로 100')
    const input = await screen.findByLabelText('전용면적(㎡)')
    fireEvent.change(input, { target: { value: '0' } }); fireEvent.click(screen.getByRole('button', { name: '평면도 직접 업로드' }))
    expect(create).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '59.5' } }); fireEvent.click(screen.getByRole('button', { name: '평면도 직접 업로드' }))
    expect(await screen.findByText('direct upload')).toBeInTheDocument()
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ region: '상무중앙로 100', areaM2: 59.5 }))
  })
})
