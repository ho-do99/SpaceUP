import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getAnalysis, getRecommendedProducts, updateAnalysis } from '@/api/analysisApi'
import { updateRequest } from '@/api/requestApi'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import MaterialSummaryCard from '@/components/user/MaterialSummaryCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import { useLightingProducts, useMaterialProducts } from '@/hooks/useMaterialCatalog'
import { getMaterialProduct } from '@/mocks/estimateMaterials'
import type { MaterialProduct } from '@/mocks/estimateMaterials'
import type { AnalysisJobResponse, RecommendedProduct } from '@/types/analysis'
import type { MaterialTheme } from '@/types/materialCatalog'
import { getMaterialTheme } from '@/utils/materialTheme'
import { groupRecommendedProducts } from '@/utils/materialRecommendation'
import { calculatePreliminaryEstimate } from '@/utils/preliminaryEstimate'
import { getActiveRequestId } from '@/utils/requestFlow'

const themeLabels: Record<MaterialTheme, string> = {
  MODERN: '모던', WOOD: '우드', WHITE: '화이트', MARBLE: '대리석',
}

function selectedRecommendation(products: RecommendedProduct[], selected?: MaterialProduct) {
  const direct = products.find((product) => String(product.productId) === selected?.id)
  if (direct || !selected) return direct ?? products[0]
  const basis = products[0]
  if (!basis || selected.unitPrice == null) return basis
  return {
    ...basis,
    productId: Number(selected.id),
    productName: selected.name,
    unitPrice: selected.unitPrice,
    amount: selected.unitPrice * basis.quantity,
  }
}

export default function EstimateSummaryPage() {
  const navigate = useNavigate()
  const flow = useEstimateFlow()
  const theme = getMaterialTheme()
  const requestId = getActiveRequestId()
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
  const [analysis, setAnalysis] = useState<AnalysisJobResponse | null>(null)
  const [recommendationLoading, setRecommendationLoading] = useState(true)
  const [recommendationError, setRecommendationError] = useState('')
  const [recommendationRetry, setRecommendationRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!requestId) {
      setRecommendationLoading(false)
      setRecommendationError('진행 중인 의뢰 정보를 찾을 수 없습니다.')
      return
    }
    let active = true
    setRecommendationLoading(true)
    setRecommendationError('')
    Promise.all([getRecommendedProducts(requestId, theme), getAnalysis(requestId)])
      .then(([products, liveAnalysis]) => { if (active) {
        setRecommendations(products)
        setAnalysis(liveAnalysis)
      } })
      .catch((error) => { if (active) setRecommendationError(error instanceof Error ? error.message : '추천 자재를 불러오지 못했습니다.') })
      .finally(() => { if (active) setRecommendationLoading(false) })
    return () => { active = false }
  }, [recommendationRetry, requestId, theme])

  const floorCatalog = useMaterialProducts(theme, 'FLOORING')
  const wallpaperCatalog = useMaterialProducts(theme, 'WALLPAPER')
  const lightingCatalog = useLightingProducts(theme)
  const groups = useMemo(() => groupRecommendedProducts(recommendations), [recommendations])

  const floorId = floorCatalog.products.some((product) => product.id === flow.selectedFloorId)
    ? flow.selectedFloorId : String(groups.FLOORING[0]?.productId ?? '')
  const wallpaperId = wallpaperCatalog.products.some((product) => product.id === flow.selectedWallpaperId)
    ? flow.selectedWallpaperId : String(groups.WALLPAPER[0]?.productId ?? '')
  const lightingId = lightingCatalog.products.some((product) => product.id === flow.selectedLightingId)
    ? flow.selectedLightingId : String(groups.LIGHTING[0]?.productId ?? '')

  const selectedFloor = getMaterialProduct(floorCatalog.products, floorId)
  const selectedWallpaper = getMaterialProduct(wallpaperCatalog.products, wallpaperId)
  const selectedLighting = getMaterialProduct(lightingCatalog.products, lightingId)
  const floorRecommendation = selectedRecommendation(groups.FLOORING, selectedFloor)
  const wallpaperRecommendation = selectedRecommendation(groups.WALLPAPER, selectedWallpaper)
  const lightingRecommendation = selectedRecommendation(groups.LIGHTING, selectedLighting)
  const estimate = calculatePreliminaryEstimate(
    [floorRecommendation, wallpaperRecommendation, lightingRecommendation],
    {
      floorAreaM2: analysis?.totalFloorAreaM2 ?? 0,
      wallpaperAreaM2: analysis?.totalWallpaperAreaM2 ?? 0,
      lightingQuantity: lightingRecommendation?.quantity ?? 0,
    },
  )
  const estimateMin = Math.floor(estimate.estimateMin / 10_000)
  const estimateMax = Math.ceil(estimate.estimateMax / 10_000)
  const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`
  const loading = recommendationLoading || floorCatalog.loading || wallpaperCatalog.loading || lightingCatalog.loading
  const loadError = recommendationError || floorCatalog.error || wallpaperCatalog.error || lightingCatalog.error
  const hasRequiredMaterials = Boolean(selectedFloor && selectedWallpaper && selectedLighting && floorRecommendation && wallpaperRecommendation && lightingRecommendation)

  const retryAll = () => {
    floorCatalog.retry(); wallpaperCatalog.retry(); lightingCatalog.retry()
    setRecommendationRetry((value) => value + 1)
  }

  const completeSelection = async () => {
    if (!requestId || !selectedFloor || !selectedWallpaper || !selectedLighting || saving) return
    setSaving(true)
    setSaveError('')
    try {
      await updateRequest(requestId, {
        selectedTheme: theme,
        selectedFlooringProductId: Number(selectedFloor.id),
        selectedWallpaperProductId: Number(selectedWallpaper.id),
        selectedLightingProductId: Number(selectedLighting.id),
      })
      await updateAnalysis(requestId, {
        estimatedQuoteMin: estimate.estimateMin,
        estimatedQuoteMax: estimate.estimateMax,
      })
      flow.selectFloor(selectedFloor.id)
      flow.selectWallpaper(selectedWallpaper.id)
      flow.selectLighting(selectedLighting.id)
      navigate('/contractors')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '자재 선택을 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <UserScreenShell>
      <UserHeader variant="detail" title="자재 추천" onBack={() => navigate('/analysis/simulation/result')} />
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <AnalysisStepIndicator currentStep={5} completedContent="number" showDivider />
          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[24px] text-[#15284c]">선택한 스타일에 어울리는 자재를 추천해드려요.</h1>
            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">{themeLabels[theme]} 스타일과 선택한 공간 정보를 기준으로 추천했어요.</p>
          </section>

          {loading ? <p role="status" className="mt-[22px] py-10 text-center text-[12px] text-[#64748b]">추천 자재를 불러오는 중입니다.</p> : loadError ? (
            <div className="mt-[22px] rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-5 text-center">
              <p role="alert" className="text-[12px] leading-5 text-[#b91c1c]">{loadError}</p>
              <button type="button" className="mt-3 rounded-[7px] border border-[#dc2626] px-3 py-2 text-[11px] font-semibold text-[#b91c1c]" onClick={retryAll}>다시 시도</button>
            </div>
          ) : !hasRequiredMaterials ? <p className="mt-[22px] py-10 text-center text-[12px] text-[#64748b]">선택 가능한 추천 자재가 없습니다.</p> : null}

          {selectedFloor && hasRequiredMaterials ? (
            <section className="mt-[22px] flex min-h-[82px] items-center rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-3">
              <img src={selectedFloor.thumbnailSrc} alt="" className="h-[58px] w-[66px] shrink-0 rounded-[8px] object-cover" />
              <div className="ml-3 min-w-0"><h2 className="text-[14px] font-bold leading-5 text-[#0f172a]">선택 스타일 · {themeLabels[theme]}</h2><p className="mt-1 text-[12px] leading-5 text-[#475569]">AI 결과와 선택 공간을 기준으로 추천</p></div>
            </section>
          ) : null}

          {hasRequiredMaterials ? <>
            <section className="mt-8 rounded-[7px] border border-[#d5dfed] bg-[#f4f8ff] px-4 py-[14px] text-center">
              <p className="text-[9px] leading-4 text-[#15284c]">총 예상 비용</p>
              <p className="mt-1 text-[22px] font-bold leading-7 text-[#2563eb]">{estimateMin} ~ {estimateMax}<span className="ml-1 text-[14px]">만원</span></p>
              <p className="mt-1 text-[9px] leading-4 text-[#15284c]">자재비 · 철거비 · 인건비 포함</p>
              <p className="mt-1 text-[10px] font-semibold text-[#475569]">선택 공간 {Number(estimate.floorAreaM2.toFixed(1))}㎡ · 약 {(estimate.floorAreaM2 / 3.3058).toFixed(1)}평 기준</p>
              <dl className="mt-3 space-y-1.5 border-t border-[#bfdbfe] pt-3 text-[11px]">
                <div className="flex justify-between"><dt>자재비</dt><dd>{formatWon(estimate.materialCost)}</dd></div>
                <div className="flex justify-between"><dt>철거비</dt><dd>{formatWon(estimate.demolitionCost)}</dd></div>
                <div className="flex justify-between"><dt>인건비</dt><dd>{formatWon(estimate.laborCost)}</dd></div>
                <div className="flex justify-between border-t border-[#bfdbfe] pt-1.5 font-bold text-[#2563eb]"><dt>총액</dt><dd>{formatWon(estimate.totalCost)}</dd></div>
              </dl>
            </section>
            <section className="mt-3 space-y-2.5 pb-6" aria-label="추천 자재 목록">
              <MaterialSummaryCard title="바닥재 교체" product={selectedFloor!} recommendation={floorRecommendation} onSelect={() => navigate('/estimate/materials/floor')} />
              <MaterialSummaryCard title="벽지 교체" product={selectedWallpaper!} recommendation={wallpaperRecommendation} onSelect={() => navigate('/estimate/materials/wallpaper')} />
              <MaterialSummaryCard title="조명 교체" product={selectedLighting!} recommendation={lightingRecommendation} onSelect={() => navigate('/estimate/materials/lighting')} />
              <div className="rounded-[8px] border border-[#fdba74] bg-[#fff7ed] p-3 text-[11px] leading-4 text-[#9a3412]"><p>※ 자재비는 선택 공간 면적과 자재별 시공 가능 면적으로 수량을 산정하며, 철거비·인건비는 선택 공간의 바닥/벽 면적과 조명 수량에 표준 단가를 적용합니다.</p><p className="mt-1.5">※ 본 금액은 예상 견적이며, 현장 방문 후 실제 견적서와 금액 차이가 발생할 수 있습니다.</p></div>
            </section>
          </> : null}
          {saveError ? <p role="alert" className="mb-3 text-center text-[11px] font-semibold text-[#dc2626]">{saveError}</p> : null}
        </main>
        <footer className="grid shrink-0 grid-cols-2 gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-semibold !text-[#2563eb] !shadow-none" onClick={() => navigate('/analysis/simulation/result')}>이전</Button>
          <Button type="button" disabled={loading || saving || Boolean(loadError) || !hasRequiredMaterials} className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[11px] !font-semibold !shadow-none" onClick={completeSelection}>{saving ? '저장 중…' : '추천 자재 선택 완료'}</Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
