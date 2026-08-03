import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import MaterialSummaryCard from '@/components/user/MaterialSummaryCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import {
  floorMaterialProducts,
  getMaterialProduct,
  recommendedLightingProduct,
  wallpaperMaterialProducts,
} from '@/mocks/estimateMaterials'

export default function EstimateSummaryPage() {
  const navigate = useNavigate()
  const { selectedFloorId, selectedWallpaperId } = useEstimateFlow()
  const selectedFloor = getMaterialProduct(floorMaterialProducts, selectedFloorId)
  const selectedWallpaper = getMaterialProduct(wallpaperMaterialProducts, selectedWallpaperId)

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="자재 추천"
        onBack={() => navigate('/analysis/simulation/result')}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <AnalysisStepIndicator currentStep={5} completedContent="number" showDivider />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[24px] text-[#15284c]">
              선택한 스타일에 어울리는 자재를 추천해드려요.
            </h1>
            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              모던 스타일과 선택한 공간 정보를 기준으로 추천했어요.
            </p>
          </section>

          <section className="mt-[22px] flex min-h-[82px] items-center rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-5">
            <img
              src={selectedFloor.thumbnailSrc}
              alt=""
              className="size-10 shrink-0 rounded-[5px] object-cover"
            />
            <div className="ml-3">
              <h2 className="text-[13px] font-bold leading-5 text-[#1e293b]">선택 스타일 · 모던</h2>
              <p className="mt-1 text-[10px] leading-4 text-[#64748b]">
                AI 결과와 선택 공간을 기준으로 추천
              </p>
            </div>
          </section>

          <section className="mt-4 rounded-[7px] border border-[#d5dfed] bg-[#f8fbff] px-4 py-3 text-center">
            <p className="text-[9px] leading-4 text-[#64748b]">총 예상 비용</p>
            <p className="mt-1 text-[22px] font-bold leading-7 text-[#2563eb]">
              470 ~ 750<span className="ml-1 text-[12px]">만원</span>
            </p>
            <p className="mt-1 text-[8px] leading-3 text-[#334155]">바닥재 · 벽지 · 조명</p>
          </section>

          <section className="mt-3 space-y-2.5 pb-6" aria-label="추천 자재 목록">
            <MaterialSummaryCard
              title="바닥재 교체"
              product={selectedFloor}
              onSelect={() => navigate('/estimate/materials/floor')}
            />
            <MaterialSummaryCard
              title="벽지 교체"
              product={selectedWallpaper}
              onSelect={() => navigate('/estimate/materials/wallpaper')}
            />
            <article className="rounded-[7px] border border-[#d5dfed] bg-white px-3 py-3">
              <h2 className="text-[13px] font-bold leading-5 text-[#1e293b]">조명 교체</h2>
              <p className="mt-2 text-[10px] leading-4 text-[#64748b]">
                {recommendedLightingProduct.name}
              </p>
              <div className="mt-2 flex items-start gap-3">
                <img
                  src={recommendedLightingProduct.thumbnailSrc}
                  alt={recommendedLightingProduct.thumbnailAlt}
                  className="size-10 shrink-0 rounded-[6px] border border-[#d5dfed] object-cover"
                />
                <dl className="min-w-0 flex-1 space-y-1">
                  {recommendedLightingProduct.summaryCostRows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-2 text-[9px] leading-4">
                      <dt className="text-[#64748b]">{row.label}</dt>
                      <dd className="shrink-0 text-[#334155]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="mt-2 flex justify-between border-t border-[#e2e8f0] pt-2 text-[10px]">
                <span className="text-[#64748b]">항목 예상 합계</span>
                <strong className="text-[#2563eb]">50 ~ 120만원</strong>
              </div>
              <p className="mt-2 text-[9px] leading-4 text-[#64748b]">공간의 선을 깔끔하게 살려줘요.</p>
              <span className="mt-2 inline-block rounded-full bg-[#eff6ff] px-5 py-1 text-[9px] font-medium text-[#2563eb]">
                AI 추천
              </span>
            </article>
          </section>
        </main>

        <footer className="grid shrink-0 grid-cols-[1fr_1.03fr] gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-semibold !text-[#2563eb] !shadow-none hover:!translate-y-0 hover:!bg-white hover:!shadow-none active:!translate-y-0"
            onClick={() => navigate('/analysis/simulation/result')}
          >
            이전
          </Button>
          <Button
            type="button"
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[12px] !font-semibold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0"
          >
            추천 자재 선택 완료
          </Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
