import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createRequest } from '@/api/requestApi'
import { searchRentalApartments } from '@/api/rentalApartmentApi'
import { saveRequestDraft } from '@/utils/requestFlow'
import { assetUrlToFile } from '@/utils/floorPlanAnalysisFlow'
import { uploadAndAttachRequestImage } from '@/utils/requestImageFlow'
import ApartmentAddressSearchPage from './ApartmentAddressSearchPage'

vi.mock('@/api/rentalApartmentApi', () => ({ searchRentalApartments: vi.fn() }))
vi.mock('@/api/requestApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/requestApi')>()
  return { ...actual, createRequest: vi.fn() }
})
vi.mock('@/utils/requestImageFlow', () => ({ uploadAndAttachRequestImage: vi.fn() }))
vi.mock('@/utils/floorPlanAnalysisFlow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/floorPlanAnalysisFlow')>()
  return { ...actual, assetUrlToFile: vi.fn() }
})

const searchApartments = vi.mocked(searchRentalApartments)
const create = vi.mocked(createRequest)
const convertAsset = vi.mocked(assetUrlToFile)
const uploadAndAttach = vi.mocked(uploadAndAttachRequestImage)
const registeredFloorPlanFile = new File(['floor-plan'], 'registered-floor-plan.png', { type: 'image/png' })

const makePage = (content: Array<{
  id: number
  apartmentName: string
  roadAddress: string
  lotAddress: string
  exclusiveAreaM2: number
  sggCode: string
}>) => ({
  content,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  number: 0,
  size: 20,
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/analysis/new/address']}>
      <Routes>
        <Route path="/analysis/new/address" element={<ApartmentAddressSearchPage />} />
        <Route path="/analysis/loading" element={<p>analysis loading</p>} />
        <Route path="/upload" element={<p>direct upload</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function submitSearch(keyword = '상무') {
  fireEvent.change(screen.getByLabelText('아파트명 또는 주소'), { target: { value: keyword } })
  fireEvent.click(screen.getByRole('button', { name: '아파트 검색' }))
  await waitFor(() => expect(searchApartments).toHaveBeenCalledWith({ keyword, page: 0, size: 20 }))
}

describe('ApartmentAddressSearchPage', () => {
  beforeEach(() => {
    searchApartments.mockReset()
    create.mockReset().mockResolvedValue(77)
    convertAsset.mockReset().mockResolvedValue(registeredFloorPlanFile)
    uploadAndAttach.mockReset().mockResolvedValue({ id: 91, imageUrl: '/api/files/images/registered-floor-plan.png' })
    sessionStorage.clear()
  })
  afterEach(cleanup)

  it('renders backend results as-is, including duplicate names with different areas and addresses', async () => {
    searchApartments.mockResolvedValue(makePage([
      { id: 1, apartmentName: '상무센트럴아파트', roadAddress: '상무중앙로 100', lotAddress: '치평동 1234', exclusiveAreaM2: 59, sggCode: '29155' },
      { id: 2, apartmentName: '상무센트럴아파트', roadAddress: '상무중앙로 100', lotAddress: '치평동 1234', exclusiveAreaM2: 84, sggCode: '29155' },
    ]))
    renderPage()
    await submitSearch()

    expect(await screen.findByText('검색 결과 2건')).toBeInTheDocument()
    expect(screen.getAllByText('상무센트럴아파트')).toHaveLength(2)
    expect(screen.getByText('전용 59m²')).toBeInTheDocument()
    expect(screen.getByText('전용 84m²')).toBeInTheDocument()
    expect(screen.getAllByText('도로명: 상무중앙로 100')).toHaveLength(2)
    expect(screen.getAllByText('지번: 치평동 1234')).toHaveLength(2)
  })

  it('shows loading, empty, error, and allows a retry', async () => {
    let resolveSearch: ((value: ReturnType<typeof makePage>) => void) | undefined
    searchApartments.mockReturnValueOnce(new Promise((resolve) => { resolveSearch = resolve }))
    renderPage()
    fireEvent.change(screen.getByLabelText('아파트명 또는 주소'), { target: { value: '없는아파트' } })
    fireEvent.click(screen.getByRole('button', { name: '아파트 검색' }))
    expect(screen.getByText('아파트 정보를 검색하고 있습니다')).toBeInTheDocument()
    resolveSearch?.(makePage([]))
    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()

    searchApartments.mockRejectedValueOnce(new Error('서버에서 요청을 처리하지 못했습니다.'))
    await submitSearch('오류')
    expect(await screen.findByRole('alert')).toHaveTextContent('서버에서 요청을 처리하지 못했습니다.')

    searchApartments.mockResolvedValueOnce(makePage([]))
    await submitSearch('재검색')
    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()
  })

  it('matches an exact mock floor plan, uploads it, and enters the shared analysis flow', async () => {
    searchApartments.mockResolvedValue(makePage([
      { id: 501, apartmentName: '상무센트럴아파트', roadAddress: '광주광역시 서구 상무중앙로 100', lotAddress: '치평동 1234', exclusiveAreaM2: 59, sggCode: '29155' },
    ]))
    saveRequestDraft({ region: '', propertyType: 'APARTMENT', areaM2: 0, budgetMin: 15_000_000 })
    renderPage()
    await submitSearch()
    fireEvent.click(await screen.findByRole('button', { name: /상무센트럴아파트/ }))
    fireEvent.click(screen.getByRole('button', { name: '면적을 선택해주세요' }))
    fireEvent.click(screen.getByRole('radio'))
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      region: '광주광역시 서구 상무중앙로 100',
      propertyType: 'APARTMENT',
      areaM2: 59,
    })))
    expect(convertAsset).toHaveBeenCalledWith(
      expect.stringContaining('apartment-floor-plan'),
      'apartment-floor-plan-exclusive-59.png',
    )
    expect(uploadAndAttach).toHaveBeenCalledWith(77, registeredFloorPlanFile, 'FLOOR_PLAN')
    expect(await screen.findByText('analysis loading')).toBeInTheDocument()
  })

  it('offers direct upload with the searched area when the exact mock is unavailable', async () => {
    searchApartments.mockResolvedValue(makePage([
      { id: 502, apartmentName: '상무센트럴자이', roadAddress: '상무중앙로 100', lotAddress: '치평동 1234', exclusiveAreaM2: 84.97, sggCode: '29155' },
    ]))
    renderPage()
    await submitSearch()
    fireEvent.click(await screen.findByRole('button', { name: /상무센트럴자이/ }))

    expect(screen.getByText('전용 84.97m² · 등록된 평면도가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '평면도 직접 업로드' }))

    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      region: '상무중앙로 100',
      propertyType: 'APARTMENT',
      areaM2: 84.97,
    })))
    expect(await screen.findByText('direct upload')).toBeInTheDocument()
  })

  it('requires a positive manual area before an empty search can continue to upload', async () => {
    searchApartments.mockResolvedValue(makePage([]))
    renderPage()
    await submitSearch('광주 서구')
    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()

    const areaInput = screen.getByLabelText('전용면적(㎡)')
    fireEvent.change(areaInput, { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: '평면도 직접 업로드' }))
    expect(screen.getByText('전용면적은 0보다 큰 숫자로 입력해 주세요.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()

    fireEvent.change(areaInput, { target: { value: '59.5' } })
    fireEvent.click(screen.getByRole('button', { name: '평면도 직접 업로드' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      region: '광주 서구',
      propertyType: 'APARTMENT',
      areaM2: 59.5,
    })))
    expect(await screen.findByText('direct upload')).toBeInTheDocument()
  })

  it('ignores non-numeric manual area characters', async () => {
    searchApartments.mockResolvedValue(makePage([]))
    renderPage()
    await submitSearch('광주')
    const areaInput = await screen.findByLabelText('전용면적(㎡)')

    fireEvent.change(areaInput, { target: { value: '59㎡' } })
    expect(areaInput).toHaveValue('')
  })
})
