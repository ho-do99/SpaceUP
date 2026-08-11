import { useNavigate } from 'react-router-dom'

import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import MaterialSummaryCard from '@/components/user/MaterialSummaryCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import {
  useLightingProducts,
  useMaterialProducts,
} from '@/hooks/useMaterialCatalog'
import {
  getMaterialProduct,
} from '@/mocks/estimateMaterials'
import { getMaterialTheme } from '@/utils/materialTheme'

export default function EstimateSummaryPage() {
  const navigate = useNavigate()

  const {
    selectedFloorId,
    selectedLightingId,
    selectedWallpaperId,
    selectFloor,
    selectLighting,
    selectWallpaper,
  } = useEstimateFlow()

  const theme = getMaterialTheme()

  const {
    products: floorProducts,
    loading: floorLoading,
    error: floorError,
    retry: retryFloor,
  } = useMaterialProducts(
    theme,
    'FLOORING',
  )

  const {
    products: wallpaperProducts,
    loading: wallpaperLoading,
    error: wallpaperError,
    retry: retryWallpaper,
  } = useMaterialProducts(
    theme,
    'WALLPAPER',
  )

  const {
    products: availableLightingProducts,
    loading: lightingLoading,
    error: lightingError,
    retry: retryLighting,
  } = useLightingProducts(theme)

  const selectedFloor = getMaterialProduct(
    floorProducts,
    selectedFloorId,
  )

  const selectedWallpaper = getMaterialProduct(
    wallpaperProducts,
    selectedWallpaperId,
  )

  const selectedLighting = getMaterialProduct(
    availableLightingProducts,
    selectedLightingId,
  )

  const hasRequiredMaterials = Boolean(
    selectedFloor?.id &&
      selectedWallpaper?.id &&
      selectedLighting?.id,
  )

  const catalogLoading = floorLoading || wallpaperLoading || lightingLoading
  const catalogError = floorError || wallpaperError || lightingError

  const completeSelection = () => {
    if (!selectedFloor || !selectedWallpaper || !selectedLighting) {
      return
    }

    selectFloor(selectedFloor.id)
    selectWallpaper(selectedWallpaper.id)
    selectLighting(selectedLighting.id)

    navigate('/contractors')
  }

  return (
    <UserScreenShell>
      <UserHeader
        variant="detail"
        title="자재 추천"
        onBack={() =>
          navigate('/analysis/simulation/result')
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <AnalysisStepIndicator
            currentStep={5}
            completedContent="number"
            showDivider
          />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[24px] text-[#15284c]">
              선택한 스타일에 어울리는 자재를 추천해드려요.
            </h1>

            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              모던 스타일과 선택한 공간 정보를 기준으로 추천했어요.
            </p>
          </section>

          {catalogLoading ? (
            <p className="mt-[22px] py-10 text-center text-[12px] text-[#64748b]">
              추천 자재를 불러오는 중입니다.
            </p>
          ) : catalogError ? (
            <div className="mt-[22px] rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-5 text-center">
              <p className="text-[12px] leading-5 text-[#b91c1c]">{catalogError}</p>
              <button
                type="button"
                className="mt-3 rounded-[7px] border border-[#dc2626] px-3 py-2 text-[11px] font-semibold text-[#b91c1c]"
                onClick={() => {
                  retryFloor()
                  retryWallpaper()
                  retryLighting()
                }}
              >
                다시 시도
              </button>
            </div>
          ) : !hasRequiredMaterials ? (
            <p className="mt-[22px] py-10 text-center text-[12px] text-[#64748b]">
              선택 가능한 추천 자재가 없습니다.
            </p>
          ) : null}

          {selectedFloor ? (
          <section className="mt-[22px] flex min-h-[82px] items-center rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-3">
            <img
              src={selectedFloor.thumbnailSrc}
              alt=""
              className="h-[58px] w-[66px] shrink-0 rounded-[8px] object-cover"
            />

            <div className="ml-3 min-w-0">
              <h2 className="text-[14px] font-bold leading-5 text-[#0f172a]">
                선택 스타일 · 모던
              </h2>

              <p className="mt-1 text-[12px] leading-5 text-[#475569]">
                AI 결과와 선택 공간을 기준으로 추천
              </p>
            </div>
          </section>
          ) : null}

          <section className="mt-8 rounded-[7px] border border-[#d5dfed] bg-[#f4f8ff] px-4 py-[14px] text-center">
            <p className="text-[9px] leading-4 text-[#15284c]">
              총 예상 비용
            </p>

            <p className="mt-1 text-[22px] font-bold leading-7 text-[#2563eb]">
              320 ~ 520
              <span className="ml-1 text-[14px]">
                만원
              </span>
            </p>

            <p className="mt-1 text-[9px] leading-4 text-[#15284c]">
              바닥재 · 벽지 · 조명
            </p>
          </section>

          <section
            className="mt-3 space-y-2.5 pb-6"
            aria-label="추천 자재 목록"
          >
            {selectedFloor ? <MaterialSummaryCard
              title="바닥재 교체"
              product={selectedFloor}
              onSelect={() =>
                navigate('/estimate/materials/floor')
              }
            /> : null}

            {selectedWallpaper ? <MaterialSummaryCard
              title="벽지 교체"
              product={selectedWallpaper}
              onSelect={() =>
                navigate('/estimate/materials/wallpaper')
              }
            /> : null}

            {selectedLighting ? <MaterialSummaryCard
              title="조명 교체"
              product={selectedLighting}
              onSelect={() =>
                navigate('/estimate/materials/lighting')
              }
            /> : null}

            <div className="rounded-[8px] border border-[#fdba74] bg-[#fff7ed] p-3 text-[11px] leading-4 text-[#9a3412]">
              <p>
                ※ 부자재비·철거비·폐기비는 제외된
                금액이며, 현장 상황에 따라 추가될 수
                있습니다.
              </p>

              <p className="mt-1.5">
                ※ 본 금액은 예상 견적이며, 현장 방문 후
                실제 견적서와 금액 차이가 발생할 수
                있습니다.
              </p>
            </div>
          </section>
        </main>

        <footer className="grid shrink-0 grid-cols-2 gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-semibold !text-[#2563eb] !shadow-none hover:!translate-y-0 hover:!bg-white hover:!shadow-none active:!translate-y-0"
            onClick={() =>
              navigate('/analysis/simulation/result')
            }
          >
            이전
          </Button>

          <Button
            type="button"
            disabled={catalogLoading || Boolean(catalogError) || !hasRequiredMaterials}
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[11px] !font-semibold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0"
            onClick={completeSelection}
          >
            추천 자재 선택 완료
          </Button>
        </footer>

      </div>
    </UserScreenShell>
  )
}
