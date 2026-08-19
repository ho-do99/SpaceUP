import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import EstimateFlowProvider from '@/contexts/EstimateFlowProvider'
import type { LightingProduct, MaterialProduct } from '@/mocks/estimateMaterials'
import EstimateSummaryPage from './EstimateSummaryPage'

const api = vi.hoisted(() => ({
  getRecommendedProducts: vi.fn(),
  getAnalysis: vi.fn(),
  updateRequest: vi.fn(),
}))

vi.mock('@/api/analysisApi', () => ({ getRecommendedProducts: api.getRecommendedProducts, getAnalysis: api.getAnalysis }))
vi.mock('@/api/requestApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/requestApi')>()
  return { ...actual, updateRequest: api.updateRequest }
})

const product = (id: string, category: MaterialProduct['category'], name: string): MaterialProduct => ({
  id, category, name, brandDetail: '테스트 브랜드', materialCost: '테스트 가격', installationCost: '시공비 별도',
  totalLabel: '자재 참고가', thumbnailSrc: '/material.png', thumbnailAlt: `${name} 이미지`, tags: ['recommended'],
  isAiRecommended: true, popularityRank: 1, priceRank: 1, summaryCostRows: [], summaryDescription: '테스트 자재',
})
const floor = product('11', 'floor', '우드 바닥재')
const wallpaper = product('12', 'wallpaper', '우드 벽지')
const lighting: LightingProduct = {
  ...product('13', 'lighting', '우드 조명'), category: 'lighting', filterId: 'living-room', roomLabel: '거실',
  specification: 'LED', materialPriceLabel: '600,000원', removalPriceLabel: '별도', laborPriceLabel: '별도',
}

vi.mock('@/hooks/useMaterialCatalog', () => ({
  useMaterialProducts: (_theme: string, workType: string) => ({
    products: workType === 'FLOORING' ? [floor] : [wallpaper], loading: false, error: '', retry: vi.fn(),
  }),
  useLightingProducts: () => ({ products: [lighting], loading: false, error: '', retry: vi.fn() }),
}))

const recommendations = [
  { productId: 11, productName: '우드 바닥재', category: 'FLOORING', unitPrice: 1_200_000, quantity: 2, amount: 2_400_000, reason: '우드 스타일과 바닥 면적 기준', priority: 1 },
  { productId: 12, productName: '우드 벽지', category: 'WALLPAPER', unitPrice: 600_000, quantity: 3, amount: 1_800_000, reason: '우드 스타일과 벽 면적 기준', priority: 1 },
  { productId: 13, productName: '우드 조명', category: 'LIGHTING', unitPrice: 600_000, quantity: 1, amount: 600_000, reason: '우드 스타일 기준', priority: 1 },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/estimate/summary']}>
      <EstimateFlowProvider>
        <Routes>
          <Route path="/estimate/summary" element={<EstimateSummaryPage />} />
          <Route path="/contractors" element={<p>contractors page</p>} />
        </Routes>
      </EstimateFlowProvider>
    </MemoryRouter>,
  )
}

describe('EstimateSummaryPage', () => {
  beforeEach(() => {
    sessionStorage.setItem('spaceup.activeRequestId', '77')
    sessionStorage.setItem('spaceup-material-theme', 'WOOD')
    api.getRecommendedProducts.mockReset().mockResolvedValue(recommendations)
    api.getAnalysis.mockReset().mockResolvedValue({
      requestId: 77, status: 'COMPLETED', totalFloorAreaM2: 30, totalWallpaperAreaM2: 70,
      ceilingHeightM: 2.4,
    })
    api.updateRequest.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => { cleanup(); sessionStorage.clear() })

  it('shows analysis recommendations and persists all choices before contractor navigation', async () => {
    renderPage()

    expect(await screen.findByText('선택 스타일 · 우드')).toBeInTheDocument()
    expect(screen.getByText('626 ~ 765')).toBeInTheDocument()
    expect(screen.getByText(/선택 공간 30㎡ · 약 9.1평 기준/)).toBeInTheDocument()
    expect(screen.getByText('자재비').nextElementSibling).toHaveTextContent('4,800,000원')
    expect(screen.getByText('철거비').nextElementSibling).toHaveTextContent('640,000원')
    expect(screen.getByText('인건비').nextElementSibling).toHaveTextContent('1,510,000원')
    expect(screen.getByText('총액').nextElementSibling).toHaveTextContent('6,950,000원')
    expect(screen.getByText(/우드 스타일과 바닥 면적 기준/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '추천 자재 선택 완료' }))

    await waitFor(() => expect(api.updateRequest).toHaveBeenCalledWith(77, {
      selectedTheme: 'WOOD', selectedFlooringProductId: 11, selectedWallpaperProductId: 12, selectedLightingProductId: 13,
    }))
    expect(await screen.findByText('contractors page')).toBeInTheDocument()
  })

  it('stays on the summary when saving the material selection fails', async () => {
    api.updateRequest.mockRejectedValue(new Error('자재 선택 저장 실패'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '추천 자재 선택 완료' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('자재 선택 저장 실패')
    expect(screen.queryByText('contractors page')).not.toBeInTheDocument()
  })
})
