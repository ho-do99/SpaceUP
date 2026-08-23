import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EstimatePage from './EstimatePage'
import { acceptQuote, getQuote, requestQuoteRevision } from '@/api/estimateApi'
import { getRequest } from '@/api/requestApi'
import type { QuoteResponse } from '@/types/backendContractor'

vi.mock('@/api/estimateApi', () => ({
  acceptQuote: vi.fn(),
  getQuote: vi.fn(),
  requestQuoteRevision: vi.fn(),
}))
vi.mock('@/api/requestApi', () => ({ getRequest: vi.fn() }))

const mockedAcceptQuote = vi.mocked(acceptQuote)
const mockedGetQuote = vi.mocked(getQuote)
const mockedGetRequest = vi.mocked(getRequest)
const mockedRequestQuoteRevision = vi.mocked(requestQuoteRevision)

const quote: QuoteResponse = {
  id: 77,
  requestId: 21,
  contractorId: 5,
  contractorName: '스페이스업 인테리어',
  title: '실측 최종 견적',
  startDate: '2026-09-01',
  durationDays: 3,
  floorAreaM2: 10,
  wallpaperAreaM2: 20,
  lightingQuantity: 2,
  ceilingHeightM: 2.4,
  roomCount: 3,
  bathroomCount: 1,
  siteCondition: '철거 필요',
  materialCost: 600_000,
  laborCost: 400_000,
  vat: 100_000,
  discount: 0,
  detailContent: '현장 실측 완료',
  totalAmount: 1_100_000,
  status: 'SUBMITTED',
  phase: 'FINAL',
  validUntil: '2026-09-15',
  revisionCount: 0,
  createdAt: '2026-08-21T12:00:00',
  items: [
    { category: '바닥재', description: '강마루', quantity: 10, measurementUnit: '㎡', unitPrice: 30_000, amount: 300_000 },
    { category: '벽지', description: '실크벽지', quantity: 20, measurementUnit: '㎡', unitPrice: 10_000, amount: 200_000 },
    { category: '조명', description: 'LED 조명', quantity: 2, measurementUnit: '개', unitPrice: 50_000, amount: 100_000 },
    { category: '추가비용', description: '총 시공비', amount: 400_000 },
  ],
}

function renderEstimate(routeId = '77') {
  return render(
    <MemoryRouter initialEntries={[`/estimate/${routeId}`]}>
      <Routes>
        <Route path="/estimate/:id" element={<EstimatePage />} />
        <Route path="/mypage/requests/:requestId" element={<p>의뢰 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function checkApprovalAgreements() {
  screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox))
}

describe('EstimatePage live final quote', () => {
  beforeEach(() => {
    mockedGetQuote.mockReset().mockResolvedValue(quote)
    mockedGetRequest.mockReset().mockResolvedValue({
      id: 21,
      requestCode: 'REQ-260821-000021',
      landlordName: '시연 임대인',
      region: '광주광역시 서구 무진대로 919',
      propertyType: 'APARTMENT',
      areaM2: 84,
    })
    mockedAcceptQuote.mockReset().mockResolvedValue(undefined)
    mockedRequestQuoteRevision.mockReset().mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('shows the same measured items, supply amount, VAT, and total returned by the server', async () => {
    renderEstimate()

    expect(await screen.findByText('강마루')).toBeInTheDocument()
    expect(screen.getByText('실크벽지')).toBeInTheDocument()
    expect(screen.getByText('LED 조명')).toBeInTheDocument()
    expect(screen.getByText('총 시공비')).toBeInTheDocument()
    expect(screen.getByText('1,000,000원')).toBeInTheDocument()
    expect(screen.getAllByText('100,000원').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('1,100,000원')).toBeInTheDocument()
    expect(screen.queryByText('5,500,000원')).not.toBeInTheDocument()
    expect(screen.queryByText(/합계가 세부 항목과 일치하지 않습니다/)).not.toBeInTheDocument()
  })

  it('uses the loaded quote id for revision requests', async () => {
    renderEstimate('33')

    await waitFor(() => expect(mockedGetQuote).toHaveBeenCalledWith(33))
    fireEvent.click(await screen.findByRole('button', { name: '수정 요청' }))
    const dialog = screen.getByRole('dialog', { name: '견적 수정 요청' })
    fireEvent.change(within(dialog).getByLabelText('수정 요청 내용'), { target: { value: '  자재비를 확인해 주세요.  ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '수정 요청하기' }))

    await waitFor(() => expect(mockedRequestQuoteRevision).toHaveBeenCalledWith(77, { note: '자재비를 확인해 주세요.' }))
    expect(await screen.findByText('견적 수정 요청을 보냈습니다.')).toBeInTheDocument()
  })

  it('does not render mock amounts when the server quote cannot be loaded', async () => {
    mockedGetQuote.mockRejectedValue(new Error('견적을 찾을 수 없습니다.'))
    renderEstimate('21')

    expect(await screen.findByRole('alert')).toHaveTextContent('견적을 찾을 수 없습니다.')
    expect(screen.queryByText('5,500,000원')).not.toBeInTheDocument()
    expect(mockedGetRequest).not.toHaveBeenCalled()
  })

  it('opens the payment preparation screen after accepting a final quote', async () => {
    renderEstimate()

    await screen.findByText('실측 최종 견적')
    checkApprovalAgreements()
    fireEvent.click(screen.getByRole('button', { name: '견적 승인' }))

    await waitFor(() => expect(mockedAcceptQuote).toHaveBeenCalledWith(77))
    expect(await screen.findByRole('heading', { name: '결제 기능 준비 중입니다' }, { timeout: 2_000 })).toBeInTheDocument()
    expect(screen.getByText('스페이스업 인테리어')).toBeInTheDocument()
    expect(screen.getByText('REQ-260821-000021')).toBeInTheDocument()
    expect(screen.getByText('1,100,000원')).toBeInTheDocument()
  })
})
