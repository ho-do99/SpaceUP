import { useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorCompanyTabs from '@/components/contractor/ContractorCompanyTabs'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

const regionOptions = [
  '서울',
  '경기',
  '인천',
  '광주',
  '전남',
  '전북',
  '대전',
  '충남',
] as const

type ContractorRegion = (typeof regionOptions)[number]
type TravelDistance = 30 | 50 | 100

interface RegionInformation {
  fullName: string
  description: string
}

const regionInformation: Record<
  ContractorRegion,
  RegionInformation
> = {
  서울: {
    fullName: '서울특별시',
    description: '세부 지역: 전체',
  },
  경기: {
    fullName: '경기도',
    description: '세부 지역: 전체',
  },
  인천: {
    fullName: '인천광역시',
    description: '세부 지역: 전체',
  },
  광주: {
    fullName: '광주광역시',
    description: '세부 지역: 전체',
  },
  전남: {
    fullName: '전라남도',
    description: '나주 · 담양 · 화순 · 장성',
  },
  전북: {
    fullName: '전북특별자치도',
    description: '세부 지역: 전체',
  },
  대전: {
    fullName: '대전광역시',
    description: '세부 지역: 전체',
  },
  충남: {
    fullName: '충청남도',
    description: '세부 지역: 전체',
  },
}

const travelDistanceOptions: readonly TravelDistance[] = [
  30,
  50,
  100,
]

export default function ContractorCompanyRegionsPage() {
  const [selectedRegions, setSelectedRegions] = useState<
    ContractorRegion[]
  >(['광주', '전남'])

  const [travelDistance, setTravelDistance] =
    useState<TravelDistance>(50)

  const [showSavedToast, setShowSavedToast] = useState(false)

  const toggleRegion = (region: ContractorRegion) => {
    setShowSavedToast(false)

    setSelectedRegions((current) => {
      const isSelected = current.includes(region)

      if (isSelected) {
        return current.filter((item) => item !== region)
      }

      return [...current, region]
    })
  }

  const changeTravelDistance = (distance: TravelDistance) => {
    setTravelDistance(distance)
    setShowSavedToast(false)
  }

  const handleSave = () => {
    if (selectedRegions.length === 0) {
      return
    }

    setShowSavedToast(true)
  }

  const isSaveDisabled = selectedRegions.length === 0

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="업체 정보" />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">
          시공 가능한 지역과 출장 범위를 설정하세요.
        </p>

        <div className="mt-2">
          <ContractorCompanyTabs activeTab="regions" />
        </div>

        <section
          className="mt-3"
          aria-labelledby="service-region-title"
        >
          <h2
            id="service-region-title"
            className="text-sm font-bold text-[#1e293b]"
          >
            시공 가능 시·도
          </h2>

          <div
            className="mt-3 flex flex-wrap gap-2"
            aria-label="시공 가능 지역 선택"
          >
            {regionOptions.map((region) => {
              const isSelected = selectedRegions.includes(region)

              return (
                <button
                  key={region}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleRegion(region)}
                  className={`flex h-9 min-w-[58px] items-center justify-center rounded-full border px-4 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                    isSelected
                      ? 'border-[#2563eb] bg-[#2563eb] text-white'
                      : 'border-[#e2e8f0] bg-white text-[#64748b]'
                  }`}
                >
                  {region}
                </button>
              )
            })}
          </div>
        </section>

        <section
          className="mt-5"
          aria-labelledby="selected-region-title"
        >
          <h2
            id="selected-region-title"
            className="text-sm font-bold text-[#1e293b]"
          >
            현재 선택 지역
          </h2>

          {selectedRegions.length > 0 ? (
            <div className="mt-3 space-y-2">
              {selectedRegions.map((region, index) => {
                const information = regionInformation[region]
                const isPrimaryRegion = index === 0

                return (
                  <article
                    key={region}
                    className="flex min-h-[76px] items-start justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-[13px] py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-bold text-[#1e293b]">
                        {information.fullName}
                      </h3>

                      <p className="mt-2 break-words text-[11px] leading-4 text-[#64748b]">
                        {information.description}
                      </p>
                    </div>

                    <span className="flex h-5 min-w-[105px] shrink-0 items-center justify-center rounded-full bg-[#eff6ff] px-3 text-[10px] font-bold text-[#2563eb]">
                      {isPrimaryRegion
                        ? '주 시공 지역'
                        : '추가 시공 지역'}
                    </span>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-3 flex min-h-[76px] items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white px-4">
              <p className="text-xs text-[#64748b]">
                시공 가능한 지역을 한 곳 이상 선택해 주세요.
              </p>
            </div>
          )}
        </section>

        <section
          className="mt-5"
          aria-labelledby="travel-distance-title"
        >
          <h2
            id="travel-distance-title"
            className="text-sm font-bold text-[#1e293b]"
          >
            출장 가능 거리
          </h2>

          <p className="mt-1 text-xs text-[#64748b]">
            사업장 기준 최대 {travelDistance}km
          </p>

          <div
            className="mt-3 grid grid-cols-3 gap-[10px]"
            aria-label="출장 가능 거리 선택"
          >
            {travelDistanceOptions.map((distance) => {
              const isSelected = travelDistance === distance

              return (
                <button
                  key={distance}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => changeTravelDistance(distance)}
                  className={`flex h-9 items-center justify-center rounded-full border text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                    isSelected
                      ? 'border-[#2563eb] bg-[#2563eb] text-white'
                      : 'border-[#e2e8f0] bg-white text-[#64748b]'
                  }`}
                >
                  {distance}km
                </button>
              )
            })}
          </div>
        </section>

        <button
          type="button"
          disabled={isSaveDisabled}
          onClick={handleSave}
          className="mt-7 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          시공 지역 저장
        </button>
      </main>

      <ContractorBottomNavigation />

      {showSavedToast ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-[76px] left-1/2 z-40 w-[280px] -translate-x-1/2"
        >
          <button
            type="button"
            aria-label="시공 지역 저장 완료 안내 닫기"
            onClick={() => setShowSavedToast(false)}
            className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[#0f172a] px-4 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <span className="text-xs font-bold text-white">
              시공 지역이 저장되었습니다.
            </span>
          </button>
        </div>
      ) : null}
    </ContractorMobileShell>
  )
}