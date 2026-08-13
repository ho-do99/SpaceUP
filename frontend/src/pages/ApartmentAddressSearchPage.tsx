import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

import { createRequest } from '@/api/requestApi'
import { getFloorPlanVariantPreviewUrl, searchApartmentFloorPlans } from '@/api/apartmentFloorPlanApi'
import { requestAnalysis } from '@/api/analysisApi'
import { createStoredFloorPlanAnalysisState } from '@/utils/floorPlanAnalysisFlow'
import {
  getRequestDraft,
  saveRequestDraft,
  setActiveRequestId,
} from '@/utils/requestFlow'
import type { FloorPlanVariant } from '@/types/apartmentFloorPlan'
import { searchDaumAddress, type SelectedAddress } from '@/utils/daumPostcode'

interface ApartmentVariantResult extends FloorPlanVariant {
  apartmentId: number
  apartmentName: string
  roadAddress: string
  lotAddress: string
  region: string
}

function parsePositiveArea(value: string) {
  if (!/^\d+(?:\.\d+)?$/.test(value.trim())) return null
  const area = Number(value)
  return Number.isFinite(area) && area > 0 ? area : null
}

function FloorPlanLabel({
  option,
}: {
  option: ApartmentVariantResult
}) {
  return (
    <>
      <span className="block">
        전용 {option.exclusiveAreaM2}m² · 공급 {option.supplyAreaM2 ?? '-'}m²
      </span>

      <span className="block">
        {option.exclusivePyeong ?? '-'}평(전용) / {option.supplyPyeong ?? '-'}평(공급)
      </span>
    </>
  )
}

export default function ApartmentAddressSearchPage() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState<ApartmentVariantResult[]>([])
  const [totalElements, setTotalElements] = useState(0)

  const [selectedApartmentId, setSelectedApartmentId] =
    useState<number | null>(null)

  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<number | null>(null)

  const [isAreaListOpen, setIsAreaListOpen] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [manualArea, setManualArea] = useState('')
  const [manualAreaError, setManualAreaError] = useState('')
  const [preparedRequestId, setPreparedRequestId] = useState<number | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)

  const selectedApartment = searchResults.find(
    (result) => result.id === selectedApartmentId,
  )

  const matchedFloorPlan = selectedApartment?.floorPlanImageUrl ? selectedApartment : null

  const selectedFloorPlan = matchedFloorPlan?.id === selectedFloorPlanId
    ? matchedFloorPlan
    : null

  const canContinue = Boolean(
    selectedApartment && selectedFloorPlan,
  )

  const handleSearch = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    if (isSearching) return

    const keyword = query.trim()
    if (!keyword) return

    setQuery(keyword)
    setIsSearching(true)
    setSearchError('')

    setSelectedApartmentId(null)
    setSelectedFloorPlanId(null)
    setIsAreaListOpen(false)

    try {
      const address = await searchDaumAddress(keyword)
      if (!address) return
      setSelectedAddress(address)
      const result = await searchApartmentFloorPlans({
        keyword: address.buildingName || address.roadAddress,
        page: 0,
        size: 20,
      })
      const variants = result.content.flatMap((apartment) => apartment.variants.map((variant) => ({
        ...variant,
        apartmentId: apartment.id,
        apartmentName: apartment.name,
        roadAddress: apartment.roadAddress,
        lotAddress: apartment.lotAddress,
        region: apartment.region,
      })))
      setSearchResults(variants)
      setTotalElements(1)
      setHasSearched(true)
    } catch (error) {
      setSearchResults([])
      setTotalElements(0)
      setHasSearched(true)
      setSearchError(
        error instanceof Error
          ? error.message
          : '아파트 검색에 실패했습니다.',
      )
    } finally {
      setIsSearching(false)
    }
  }

  const selectApartment = (apartmentId: number) => {
    setSelectedApartmentId(apartmentId)
    setSelectedFloorPlanId(null)
    setIsAreaListOpen(false)
  }

  const resetSearch = () => {
    setQuery('')
    setHasSearched(false)
    setSearchResults([])
    setTotalElements(0)
    setSearchError('')
    setSelectedApartmentId(null)
    setSelectedFloorPlanId(null)
    setIsAreaListOpen(false)
    setManualArea('')
    setManualAreaError('')
    setPreparedRequestId(null)
    setSelectedAddress(null)
  }

  const handleBack = () => {
    if (selectedApartment) {
      setSelectedApartmentId(null)
      setSelectedFloorPlanId(null)
      setIsAreaListOpen(false)
      return
    }

    navigate('/analysis/new/property')
  }

  const createApartmentRequest = async (areaM2: number, region: string) => {
    if (preparedRequestId) return preparedRequestId

    const previous = getRequestDraft()
    const draft = {
      ...previous,
      region,
      propertyType: 'APARTMENT',
      areaM2,
    }

    saveRequestDraft(draft)
    const requestId = await createRequest(draft)
    setActiveRequestId(requestId)
    setPreparedRequestId(requestId)
    return requestId
  }

  const continueWithApartment = async () => {
    if (
      !selectedApartment ||
      !selectedFloorPlan ||
      isSubmitting
    ) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const requestId = await createApartmentRequest(
        selectedFloorPlan.exclusiveAreaM2,
        selectedApartment.roadAddress,
      )
      const analysisJobId = await requestAnalysis(requestId)

      navigate('/analysis/loading', {
        state: createStoredFloorPlanAnalysisState(selectedFloorPlan.id, analysisJobId),
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '의뢰 생성에 실패했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const continueWithDirectUpload = async (
    areaM2: number,
    region: string,
  ) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await createApartmentRequest(areaM2, region)
      navigate('/upload')
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '의뢰 생성에 실패했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const continueEmptyResultWithUpload = () => {
    const areaM2 = parsePositiveArea(manualArea)

    if (areaM2 === null) {
      setManualAreaError('전용면적은 0보다 큰 숫자로 입력해 주세요.')
      return
    }

    setManualAreaError('')
    void continueWithDirectUpload(areaM2, selectedAddress?.roadAddress ?? query.trim())
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title={
          selectedApartment
            ? '아파트 정보 확인'
            : '아파트 주소 검색'
        }
        onBack={handleBack}
      />

      {selectedApartment ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8">
            <AnalysisStepIndicator currentStep={2} />

            {/* 페이지 제목 */}
            <section className="pt-3 text-center">
              <h1 className="break-keep text-[18px] font-bold leading-[26px] text-[#1e293b]">
                선택한 아파트와 면적 정보를 확인해주세요.
              </h1>
            </section>

            {/* 다시 검색 */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="text-[11px] font-bold leading-[22px] text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                onClick={resetSearch}
              >
                다시 검색
              </button>
            </div>

            {/* 건물 정보 */}
            <section className="mt-1.5 min-h-[150px] rounded-[10px] border border-[#e2e8f0] bg-white p-[13px]">
              <h2 className="text-[14px] font-bold leading-[22px] text-[#1e293b]">
                건물 정보
              </h2>

              <p className="mt-1 text-[15px] font-bold leading-[22px] text-[#1e293b]">
                {selectedApartment.apartmentName}
              </p>

              <dl className="mt-3.5 space-y-2 text-[11px] leading-[22px] text-[#64748b]">
                <div className="flex gap-2">
                  <dt className="shrink-0">
                    도로명
                  </dt>

                  <dd>
                    {selectedApartment.roadAddress}
                  </dd>
                </div>

                <div className="flex gap-2">
                  <dt className="shrink-0">
                    지번
                  </dt>

                  <dd>
                    {selectedApartment.lotAddress}
                  </dd>
                </div>
              </dl>
            </section>

            {/* 안내 */}
            <aside className="mt-3 min-h-[60px] rounded-[10px] bg-[#fffbeb] px-3.5 py-3 text-[10px] leading-[18px] text-[#92400e]">
              <p>
                ⚠ 아파트 정보는 등록된 건축 데이터를
                기준으로 제공됩니다.
              </p>

              <p>
                실제 정보와 일부 차이가 있을 수 있습니다.
              </p>
            </aside>

            {/* 면적 정보 */}
            <section
              className="mt-3"
              aria-labelledby="apartment-area-heading"
            >
              <h2
                id="apartment-area-heading"
                className="text-[15px] font-bold leading-6 text-[#1e293b]"
              >
                면적 정보
              </h2>

              <button
                type="button"
                aria-expanded={isAreaListOpen}
                aria-controls="apartment-area-options"
                disabled={!matchedFloorPlan}
                className="mt-2 flex h-[64px] w-full items-center justify-between rounded-[10px] border border-[#d5dfed] bg-white px-3.5 text-left disabled:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                onClick={() =>
                  setIsAreaListOpen((current) => !current)
                }
              >
                <span
                  className={
                    selectedFloorPlan
                      ? 'text-[12px] font-bold leading-6 text-[#1e293b]'
                      : 'text-[13px] font-normal text-[#94a3b8]'
                  }
                >
                  {selectedFloorPlan ? (
                    <FloorPlanLabel
                      option={selectedFloorPlan}
                    />
                  ) : (
                    matchedFloorPlan
                      ? '면적을 선택해주세요'
                      : `전용 ${selectedApartment.exclusiveAreaM2}m² · 등록된 평면도가 없습니다`
                  )}
                </span>

                <span
                  aria-hidden="true"
                  className="text-[16px] font-bold text-[#64748b]"
                >
                  {isAreaListOpen ? '⌃' : '⌄'}
                </span>
              </button>

              {/* 면적 선택 목록 */}
              {isAreaListOpen && matchedFloorPlan ? (
                <div
                  id="apartment-area-options"
                  className="overflow-hidden rounded-b-[10px] border-x border-b border-[#d5dfed] bg-white"
                >
                  {matchedFloorPlan ? (
                      <label
                        key={matchedFloorPlan.id}
                        className="flex min-h-[66px] cursor-pointer items-center gap-3 border-t border-[#e2e8f0] px-3.5 text-[12px] leading-5 text-[#1e293b] first:border-t-0 focus-within:bg-[#eff6ff]"
                      >
                        <input
                          type="radio"
                          name="apartment-area"
                          value={matchedFloorPlan.id}
                          checked={
                            selectedFloorPlanId === matchedFloorPlan.id
                          }
                          className="size-4 shrink-0 accent-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                          onChange={() => {
                            setSelectedFloorPlanId(
                              matchedFloorPlan.id,
                            )
                            setIsAreaListOpen(false)
                          }}
                        />

                        <span>
                          <span className="block font-bold">
                            전용 {matchedFloorPlan.exclusiveAreaM2}m²
                          </span>

                          <span className="block text-[11px] text-[#64748b]">
                            {matchedFloorPlan.exclusivePyeong}평(전용)
                            {' / '}
                            {matchedFloorPlan.supplyPyeong}평(공급)
                            {' · '}
                            공급 {matchedFloorPlan.supplyAreaM2 ?? '-'}m²
                          </span>
                        </span>
                      </label>
                  ) : null}
                </div>
              ) : null}
            </section>

            {!matchedFloorPlan ? (
              <section className="mt-3 rounded-[10px] border border-[#dbeafe] bg-[#f8fafc] p-3.5">
                <p className="text-[11px] leading-[18px] text-[#64748b]">
                  등록된 평면도가 없어 보유한 평면도를 직접 업로드해야 합니다.
                </p>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  onClick={() => void continueWithDirectUpload(
                    selectedApartment.exclusiveAreaM2,
                    selectedApartment.roadAddress,
                  )}
                  className="mt-3 h-11 w-full !rounded-[8px] !border !border-[#2563eb] !bg-[#2563eb] !px-4 !py-0 !text-[12px] !font-bold !shadow-none"
                >
                  평면도 직접 업로드
                </Button>
                <p role="alert" className="mt-2 min-h-4 text-center text-[10px] text-[#ef4444]">
                  {submitError}
                </p>
              </section>
            ) : null}

            {/* 면적 선택 완료 안내 */}
            {selectedFloorPlan ? (
              <aside className="mt-3 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-3">
                <img src={getFloorPlanVariantPreviewUrl(selectedFloorPlan.id)} alt="선택한 등록 평면도" className="mb-3 h-32 w-full rounded-lg object-contain" />
                <p className="text-[13px] font-bold leading-[22px] text-[#2563eb]">
                  면적 선택 완료
                </p>

                <p className="mt-0.5 text-[11px] leading-[18px] text-[#64748b]">
                  선택한 면적 정보를 기준으로 다음 단계의 공간
                  분석을 진행합니다.
                </p>
              </aside>
            ) : null}
          </main>

          {/* 하단 다음 버튼 */}
          <footer className="shrink-0 bg-white px-4 pb-[calc(19px+env(safe-area-inset-bottom))]">
            <Button
              type="button"
              disabled={!canContinue || isSubmitting}
              isLoading={isSubmitting}
              className={`h-12 w-full !rounded-[8px] !border !px-4 !py-0 !text-[14px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
                canContinue
                  ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]'
                  : '!border-[#cbd5e1] !bg-[#cbd5e1] !opacity-100'
              }`}
              onClick={continueWithApartment}
            >
              다음
            </Button>

            <p
              role="alert"
              className="mt-2 min-h-4 text-center text-[10px] text-[#ef4444]"
            >
              {submitError}
            </p>
          </footer>
        </div>
      ) : (
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8">
          <AnalysisStepIndicator currentStep={2} />

          {/* 검색 안내 */}
          <section className="pt-3 text-center">
            <h1 className="text-[18px] font-bold leading-[26px] text-[#1e293b]">
              아파트를 검색해주세요
            </h1>

            <p className="mt-1 break-keep text-[12px] leading-[17px] text-[#64748b]">
              아파트명, 도로명 또는 지번 주소로 검색하면
              <br />
              건물 정보를 불러옵니다.
            </p>
          </section>

          {/* 검색창 */}
          <form
            className="mt-4 flex h-12 rounded-[10px] border border-[#d5dfed] bg-white p-[3px] focus-within:border-[#2563eb]"
            onSubmit={handleSearch}
          >
            <label
              htmlFor="apartment-search"
              className="sr-only"
            >
              아파트명 또는 주소
            </label>

            <input
              id="apartment-search"
              value={query}
              className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-[#1e293b] outline-none placeholder:text-[#94a3b8]"
              placeholder="아파트명, 도로명, 지번 주소를 입력하세요"
              onChange={(event) => {
                setQuery(event.target.value)
                setHasSearched(false)
                setSearchError('')
              }}
            />

            <button
              type="submit"
              aria-label="아파트 검색"
              disabled={isSearching || !query.trim()}
              aria-busy={isSearching}
              className="flex h-10 w-12 shrink-0 items-center justify-center rounded-[8px] bg-[#2563eb] text-[22px] font-bold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e293b]"
            >
              <span aria-hidden="true">
                ⌕
              </span>
            </button>
          </form>

          {/* 검색 결과 */}
          {isSearching ? (
            <section className="mt-4" aria-live="polite" aria-busy="true">
              <div className="rounded-[12px] bg-[#f8fafc] px-4 py-14 text-center">
                <p className="text-[15px] font-bold text-[#1e293b]">
                  아파트 정보를 검색하고 있습니다
                </p>
              </div>
            </section>
          ) : hasSearched ? (
            <section
              className="mt-4"
              aria-live="polite"
            >
              <h2 className="text-[15px] font-bold leading-6 text-[#1e293b]">
                검색 결과 {totalElements}건
              </h2>

              {searchError ? (
                <div className="mt-2.5 rounded-[12px] bg-[#f8fafc] px-4 py-14 text-center">
                  <p role="alert" className="text-[15px] font-bold text-[#ef4444]">
                    {searchError}
                  </p>
                  <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
                    검색어를 확인한 뒤 다시 시도해주세요.
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="mt-2.5 space-y-2.5">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="min-h-[96px] w-full rounded-[10px] border border-[#d5dfed] bg-white px-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                      onClick={() =>
                        selectApartment(result.id)
                      }
                    >
                      <strong className="block text-[15px] leading-[22px] text-[#1e293b]">
                        {result.apartmentName}
                      </strong>

                      <span className="mt-1 block text-[11px] leading-[19px] text-[#64748b]">
                        도로명: {result.roadAddress}
                      </span>

                      <span className="block text-[11px] leading-[19px] text-[#64748b]">
                        지번: {result.lotAddress}
                      </span>

                      <span className="mt-1 block text-[11px] font-bold leading-[19px] text-[#2563eb]">
                        전용 {result.exclusiveAreaM2}m²
                      </span>
                    </button>
                  ))}
                </div>
              ) : selectedAddress ? (
                <div className="mt-2.5 rounded-[12px] bg-[#f8fafc] px-4 py-14 text-center">
                  <p className="text-[15px] font-bold text-[#1e293b]">
                    {selectedAddress.buildingName || '선택한 주소'}
                  </p>

                  <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
                    {selectedAddress.roadAddress}
                  </p>
                  <p className="mt-1 text-[11px] leading-[18px] text-[#64748b]">
                    SpaceUP에 등록된 평면도가 없어 직접 업로드가 필요합니다.
                  </p>

                  <div className="mx-auto mt-5 max-w-[280px] text-left">
                    <label htmlFor="manual-exclusive-area" className="block text-[11px] font-bold text-[#1e293b]">
                      전용면적(㎡)
                    </label>
                    <input
                      id="manual-exclusive-area"
                      type="text"
                      inputMode="decimal"
                      value={manualArea}
                      aria-invalid={Boolean(manualAreaError)}
                      aria-describedby={manualAreaError ? 'manual-exclusive-area-error' : undefined}
                      placeholder="예: 59.5"
                      className="mt-1.5 h-11 w-full rounded-[8px] border border-[#d5dfed] bg-white px-3 text-[13px] text-[#1e293b] outline-none focus:border-[#2563eb]"
                      onChange={(event) => {
                        const nextValue = event.target.value
                        if (/^\d*(?:\.\d*)?$/.test(nextValue)) {
                          setManualArea(nextValue)
                          setManualAreaError('')
                        }
                      }}
                    />
                    <p id="manual-exclusive-area-error" role="alert" className="mt-1 min-h-4 text-[10px] text-[#ef4444]">
                      {manualAreaError}
                    </p>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      onClick={continueEmptyResultWithUpload}
                      className="mt-2 h-11 w-full !rounded-[8px] !border !border-[#2563eb] !bg-[#2563eb] !px-4 !py-0 !text-[12px] !font-bold !shadow-none"
                    >
                      평면도 직접 업로드
                    </Button>
                    <p role="alert" className="mt-2 min-h-4 text-center text-[10px] text-[#ef4444]">
                      {submitError}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 rounded-[12px] bg-[#f8fafc] px-4 py-14 text-center">
                  <p className="text-[15px] font-bold text-[#1e293b]">주소를 선택하지 않았습니다</p>
                </div>
              )}
            </section>
          ) : (
            <section className="mt-5 rounded-[12px] bg-[#f8fafc] px-4 py-14 text-center">
              <span
                aria-hidden="true"
                className="text-[32px] font-bold text-[#2563eb]"
              >
                ⌕
              </span>

              <h2 className="mt-2 text-[15px] font-bold text-[#1e293b]">
                아파트 주소를 검색해주세요
              </h2>

              <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
                검색 결과에서 보유한 아파트를 선택할 수 있습니다.
              </p>
            </section>
          )}
        </main>
      )}
    </UserScreenShell>
  )
}
