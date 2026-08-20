import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import useContractorRequest from '@/hooks/useContractorRequest'
import { getQuotesByRequest } from '@/api/estimateApi'
import { getRequest } from '@/api/requestApi'
import { getMaterialCatalog } from '@/api/materialCatalogApi'
import type { CatalogMaterialProduct, MaterialWorkType } from '@/types/materialCatalog'
import ContractorEstimateEditPage from './ContractorEstimateEditPage'

vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))
vi.mock('@/api/estimateApi', () => ({
  createQuote: vi.fn(),
  getQuotesByRequest: vi.fn(),
  updateQuote: vi.fn(),
}))
vi.mock('@/api/requestApi', () => ({ getRequest: vi.fn() }))
vi.mock('@/api/materialCatalogApi', () => ({ getMaterialCatalog: vi.fn() }))

const useContractorRequestMock = vi.mocked(useContractorRequest)
const getQuotesByRequestMock = vi.mocked(getQuotesByRequest)
const getRequestMock = vi.mocked(getRequest)
const getMaterialCatalogMock = vi.mocked(getMaterialCatalog)

const product = (productId: number, workType: MaterialWorkType, unitPrice: number): CatalogMaterialProduct => ({
  productId,
  workType,
  materialCategory: '시연 자재',
  theme: 'MODERN',
  priceTier: 'MID',
  brandName: 'SpaceUP',
  productName: `${workType} 선택 자재`,
  saleUnit: workType === 'LIGHTING' ? '개' : 'BOX',
  currentPrice: unitPrice,
  normalizedPriceM2: workType === 'LIGHTING' ? null : unitPrice,
  priceCheckedAt: '2026-08-20T00:00:00',
})

describe('ContractorEstimateEditPage confirmed calculation', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useContractorRequestMock.mockReturnValue({
      request: {
        requestId: '108', customerName: '시연 임대인', maskedPhone: '계약 전 비공개',
        property: { region: '광주', address: '광주 서구', propertyType: '아파트', areaLabel: '84㎡' },
        budgetLabel: '협의', estimatedCostLabel: '분석 완료', matchScore: 90,
        desiredSchedule: '2026-09-01', status: 'in_progress', statusLabel: '진행 중',
        lastActivityLabel: '2026-08-20', analysis: { rooms: 3, bathrooms: 1, hasBalcony: true, kitchenType: '오픈형', ceilingHeight: '2.4m' },
        selectedItems: ['바닥재 교체', '벽지 교체', '조명 교체'], lightingNotice: '', hasLinkedFloorPlan: false, photos: [],
      },
      loading: false,
      error: '',
    })
    getQuotesByRequestMock.mockResolvedValue([])
    getRequestMock.mockResolvedValue({
      id: 108, region: '광주 서구', propertyType: 'APARTMENT', areaM2: 84,
      selectedTheme: 'MODERN', selectedFlooringProductId: 1,
      selectedWallpaperProductId: 2, selectedLightingProductId: 3,
    })
    getMaterialCatalogMock.mockImplementation(async (_theme, workType) => {
      if (workType === 'FLOORING') return [product(1, workType, 30_000)]
      if (workType === 'WALLPAPER') return [product(2, workType, 10_000)]
      return [product(3, workType, 50_000)]
    })
  })

  afterEach(cleanup)

  it('updates material, additional, VAT, and final totals immediately', async () => {
    render(
      <MemoryRouter initialEntries={['/contractor/requests/108/estimate?mode=completed']}>
        <Routes>
          <Route path="/contractor/requests/:requestId/estimate" element={<ContractorPortalFlowProvider><ContractorEstimateEditPage /></ContractorPortalFlowProvider>} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText(/FLOORING 선택 자재/)
    fireEvent.change(screen.getByLabelText('바닥 시공 면적(㎡)'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('벽지 시공 면적(㎡)'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('조명 수량(개)'), { target: { value: '2' } })
    fireEvent.change(screen.getAllByLabelText('금액(원)')[0], { target: { value: '400000' } })

    await waitFor(() => {
      expect(screen.getByText('1,000,000원')).toBeInTheDocument()
      expect(screen.getAllByText('100,000원').length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('1,100,000원')).toBeInTheDocument()
    })
  })
})
