import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import ContractorEstimateCostList from '@/components/contractor/ContractorEstimateCostList'
import ContractorEstimateFixedActions from '@/components/contractor/ContractorEstimateFixedActions'
import ContractorEstimateHeader from '@/components/contractor/ContractorEstimateHeader'
import ContractorEstimateInfoRow from '@/components/contractor/ContractorEstimateInfoRow'
import ContractorEstimateSummary from '@/components/contractor/ContractorEstimateSummary'
import {
  calculateAdditionalTotal,
  formatWon,
  recalculateContractorEstimate,
  validateContractorEstimate,
  type ContractorEstimateErrors,
  type ContractorEstimateField,
} from '@/components/contractor/contractorEstimateUtils'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import {
  contractorDefaultEstimateDraft,
  findContractorRequestDetail,
} from '@/mocks/contractorPortalMockData'
import type {
  ContractorEstimateDraft,
  ContractorEstimateMeasurement,
} from '@/types/contractorPortal'

import ContractorRequestNotFound from './ContractorRequestNotFound'
import { createQuote, getQuotesByRequest, updateQuote } from '@/api/estimateApi'
import { getRequest } from '@/api/requestApi'
import { estimateDraftToQuoteInput, getStoredQuoteId, storeQuoteId } from '@/utils/quoteDraft'
import useContractorRequest from '@/hooks/useContractorRequest'
import { createLiveContractorEstimateDraft, quoteToContractorEstimateDraft } from '@/utils/contractorQuoteAdapter'
import { getMaterialCatalog } from '@/api/materialCatalogApi'
import type { RequestResponse } from '@/types/request'
import { applySelectedMaterials, type SelectedFinalEstimateMaterials } from '@/utils/contractorFinalEstimate'

const fieldOrder: readonly ContractorEstimateField[] = [
  'floorArea',
  'wallpaperArea',
  'lightingQuantity',
  'ceilingHeight',
  'rooms',
  'bathrooms',
  'materials',
  'additionalCosts',
  'startDate',
  'durationDays',
]

const finiteOrZero = (value: number) =>
  Number.isFinite(value) ? value : 0

const numericInputValue = (value: number) =>
  value === 0 ? '' : value

async function loadSelectedMaterials(request: RequestResponse): Promise<SelectedFinalEstimateMaterials> {
  const theme = request.selectedTheme
  if (!theme || !request.selectedFlooringProductId || !request.selectedWallpaperProductId || !request.selectedLightingProductId) {
    throw new Error('사용자가 선택한 바닥재·벽지·조명 정보가 없습니다.')
  }
  const [floorCatalog, wallpaperCatalog, lightingCatalog] = await Promise.all([
    getMaterialCatalog(theme, 'FLOORING'),
    getMaterialCatalog(theme, 'WALLPAPER'),
    getMaterialCatalog(theme, 'LIGHTING'),
  ])
  const floor = floorCatalog.find((item) => item.productId === request.selectedFlooringProductId)
  const wallpaper = wallpaperCatalog.find((item) => item.productId === request.selectedWallpaperProductId)
  const lighting = lightingCatalog.find((item) => item.productId === request.selectedLightingProductId)
  if (!floor || !wallpaper || !lighting) {
    throw new Error('선택한 자재가 현재 자재 카탈로그에 없습니다.')
  }
  return { floor, wallpaper, lighting }
}

function FieldError({
  field,
  errors,
}: {
  field: ContractorEstimateField
  errors: ContractorEstimateErrors
}) {
  const message = errors[field]

  return message ? (
    <p
      id={`${field}-error`}
      role="alert"
      className="mt-1 text-[11px] font-semibold leading-4 text-[#dc2626]"
    >
      {message}
    </p>
  ) : null
}

export default function ContractorEstimateEditPage() {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isLive = /^\d+$/.test(requestId ?? '')
  const liveRequest = useContractorRequest(requestId)
  const request = isLive ? liveRequest.request : findContractorRequestDetail(requestId)

  const {
    estimateDraft,
    estimateLifecycleStatus,
    revisionRequest,
    saveEstimateDraft,
    prepareEstimatePreview,
  } = useContractorPortalFlow()

  const isRevision =
    estimateLifecycleStatus ===
    'REVISION_REQUESTED'

  const isCompletedView =
    searchParams.get('mode') === 'completed'

  const completedQuery = isCompletedView
    ? '?mode=completed'
    : ''

  const [draft, setDraft] =
    useState<ContractorEstimateDraft>(
      isLive
        ? createLiveContractorEstimateDraft(requestId ?? '')
        : estimateDraft ?? contractorDefaultEstimateDraft,
    )

  const [errors, setErrors] =
    useState<ContractorEstimateErrors>({})

  const [saveNotice, setSaveNotice] =
    useState(false)
  const [apiError, setApiError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLive || !requestId) return
    let active = true
    const numericRequestId = Number(requestId)
    void Promise.all([getQuotesByRequest(numericRequestId), getRequest(numericRequestId)])
      .then(async ([quotes, rawRequest]) => {
        if (!active) return
        const existing = quotes
          .filter((quote) => quote.phase === 'FINAL' && quote.status === 'DRAFT')
          .sort((a, b) => b.id - a.id)[0]
        if (existing) {
          storeQuoteId(numericRequestId, existing.id)
          const loadedDraft = quoteToContractorEstimateDraft(existing, rawRequest)
          if (loadedDraft.categories.length === 3) {
            setDraft(recalculateContractorEstimate(loadedDraft))
            return
          }
        }
        const materials = await loadSelectedMaterials(rawRequest)
        if (!active) return
        const baseDraft = existing
          ? quoteToContractorEstimateDraft(existing, rawRequest)
          : createLiveContractorEstimateDraft(requestId)
        setDraft(applySelectedMaterials(baseDraft, materials))
      })
      .catch((error: unknown) => {
        if (active) setApiError(error instanceof Error ? error.message : '기존 견적을 불러오지 못했습니다.')
      })
    return () => { active = false }
  }, [isLive, requestId])

  if (isLive && liveRequest.loading) {
    return <ContractorMobileShell><main className="flex min-h-dvh items-center justify-center text-sm text-[#64748b]">견적을 불러오는 중입니다.</main></ContractorMobileShell>
  }

  if (!request) {
    return <ContractorRequestNotFound />
  }


  const updateMeasurement = (
    field: keyof ContractorEstimateMeasurement,
    value: number | string,
  ) => {
    setDraft((current) => recalculateContractorEstimate({
      ...current,
      measurement: {
        ...current.measurement,
        [field]: value,
      },
    }))

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
  }

  const updateAdditionalCost = (id: string, field: 'label' | 'amount', value: string | number) => {
    setDraft((current) => recalculateContractorEstimate({
      ...current,
      additionalCosts: current.additionalCosts.map((item) =>
        item.id === id ? { ...item, [field]: value } : item),
    }))
    setErrors((current) => ({ ...current, additionalCosts: undefined }))
  }

  const addAdditionalCost = () => {
    setDraft((current) => recalculateContractorEstimate({
      ...current,
      additionalCosts: [
        ...current.additionalCosts,
        { id: `additional-${Date.now()}-${current.additionalCosts.length}`, label: '', amount: 0 },
      ],
    }))
  }

  const removeAdditionalCost = (id: string) => {
    setDraft((current) => recalculateContractorEstimate({
      ...current,
      additionalCosts: current.additionalCosts.filter((item) => item.id !== id),
    }))
  }

  const validateDraft = () => {
    const normalized = recalculateContractorEstimate({
      ...draft,
      notes: draft.notes.trim(),
      additionalCosts: draft.additionalCosts.map((item) => ({ ...item, label: item.label.trim() })),
    })

    const nextErrors =
      validateContractorEstimate(normalized)

    setErrors(nextErrors)

    const firstError = fieldOrder.find(
      (field) => nextErrors[field],
    )

    if (firstError) {
      document
        .getElementById(firstError)
        ?.focus()

      return null
    }

    setDraft(normalized)

    return normalized
  }

  const persist = async (validDraft: ContractorEstimateDraft) => {
    if (!requestId || !/^\d+$/.test(requestId)) return
    const numericRequestId = Number(requestId)
    const input = estimateDraftToQuoteInput(numericRequestId, validDraft)
    const quoteId = getStoredQuoteId(numericRequestId)
    if (quoteId) {
      await updateQuote(quoteId, input)
    } else {
      storeQuoteId(numericRequestId, await createQuote(input))
    }
  }

  const save = async () => {
    const validDraft = validateDraft()

    if (!validDraft) {
      return
    }

    setIsSaving(true)
    setApiError('')
    try {
      await persist(validDraft)
      saveEstimateDraft(validDraft)
      setSaveNotice(true)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '견적 임시 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const preview = async () => {
    const validDraft = validateDraft()

    if (!validDraft) {
      return
    }

    setIsSaving(true)
    setApiError('')
    try {
      await persist(validDraft)
      prepareEstimatePreview(validDraft)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '견적 임시 저장에 실패했습니다.')
      setIsSaving(false)
      return
    }
    setIsSaving(false)

    navigate(
      `/contractor/requests/${request.requestId}/estimate/preview${completedQuery}`,
    )
  }

  const numericClass =
    'mt-1 h-11 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs outline-none focus:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#bfdbfe]'

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorEstimateHeader
        title={
          isRevision
            ? '수정 견적 작성'
            : '견적서 작성'
        }
        onSave={save}
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-5">
        <p className="mb-4 text-xs font-bold text-[#2563eb]">
          {isRevision
            ? '사용자 요청 확인 → 수정 견적 작성 → 재전송'
            : '현장방문 완료 → 견적 작성 중 → 제출 완료'}
        </p>
        {apiError ? <p role="alert" className="mb-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">{apiError}</p> : null}

        {isRevision ? (
          <div className="mb-4 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-bold text-[#1e293b]">
              수정 요청
            </p>

            <p className="mt-2 text-xs leading-5 text-[#64748b]">
              {revisionRequest.reason}
            </p>
          </div>
        ) : null}

        {saveNotice ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex items-center justify-between rounded-xl bg-[#0f172a] px-4 py-3 text-xs font-bold text-white"
          >
            <span>
              견적서가 임시 저장 상태로
              반영되었습니다.
            </span>

            <button
              type="button"
              aria-label="임시저장 안내 닫기"
              onClick={() =>
                setSaveNotice(false)
              }
              className="ml-3 rounded px-1 text-lg"
            >
              ×
            </button>
          </div>
        ) : null}

        <ContractorSectionCard title="의뢰 정보">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="사용자명">
              {request.customerName}
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="주소">
              {request.property.address}
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="주택 유형">
              {request.property.propertyType}
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="전용면적">
              {request.property.areaLabel}
            </ContractorEstimateInfoRow>

            {request.analysis.selectedAreaM2 != null ? (
              <ContractorEstimateInfoRow label="선택면적">
                {request.analysis.selectedAreaM2.toLocaleString('ko-KR', {
                  maximumFractionDigits: 1,
                })}㎡
              </ContractorEstimateInfoRow>
            ) : null}

            <ContractorEstimateInfoRow label="희망 일정">
              {request.desiredSchedule}
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="시공 항목">
              {request.selectedItems.length > 0
                ? request.selectedItems.join(' · ')
                : '등록된 시공 항목 없음'}
            </ContractorEstimateInfoRow>
          </dl>

          <p className="mt-3 rounded-lg bg-[#eff6ff] p-2 text-[11px] leading-4 text-[#2563eb]">
            의뢰에 등록된 시공 항목과 현장 실측 결과를 기준으로
            견적을 작성해 주세요.
          </p>
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-4"
          title="현장 실측 정보"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] font-bold">
              바닥 시공 면적(㎡)

              <input
                id="floorArea"
                type="number"
                inputMode="decimal"
                min="0.1"
                max="1000"
                step="0.1"
                value={
                  numericInputValue(draft.measurement.floorArea)
                }
                aria-invalid={Boolean(
                  errors.floorArea,
                )}
                aria-describedby={
                  errors.floorArea
                    ? 'floorArea-error'
                    : undefined
                }
                onChange={(event) =>
                  updateMeasurement(
                    'floorArea',
                    finiteOrZero(
                      event.target
                        .valueAsNumber,
                    ),
                  )
                }
                className={numericClass}
              />

              <FieldError
                field="floorArea"
                errors={errors}
              />
            </label>

            <label className="text-[11px] font-bold">
              벽지 시공 면적(㎡)

              <input
                id="wallpaperArea"
                type="number"
                inputMode="decimal"
                min="0.1"
                max="2000"
                step="0.1"
                value={
                  numericInputValue(
                    draft.measurement.wallpaperArea,
                  )
                }
                aria-invalid={Boolean(
                  errors.wallpaperArea,
                )}
                aria-describedby={
                  errors.wallpaperArea
                    ? 'wallpaperArea-error'
                    : undefined
                }
                onChange={(event) =>
                  updateMeasurement(
                    'wallpaperArea',
                    finiteOrZero(
                      event.target
                        .valueAsNumber,
                    ),
                  )
                }
                className={numericClass}
              />

              <FieldError
                field="wallpaperArea"
                errors={errors}
              />
            </label>

            <label className="text-[11px] font-bold">
              조명 수량(개)

              <input
                id="lightingQuantity"
                type="number"
                inputMode="numeric"
                min="1"
                max="1000"
                step="1"
                value={numericInputValue(draft.measurement.lightingQuantity)}
                aria-invalid={Boolean(errors.lightingQuantity)}
                aria-describedby={errors.lightingQuantity ? 'lightingQuantity-error' : undefined}
                onChange={(event) =>
                  updateMeasurement('lightingQuantity', finiteOrZero(event.target.valueAsNumber))
                }
                className={numericClass}
              />

              <FieldError field="lightingQuantity" errors={errors} />
            </label>

            <label className="text-[11px] font-bold">
              층고(m)

              <input
                id="ceilingHeight"
                type="number"
                inputMode="decimal"
                min="0.1"
                max="10"
                step="0.1"
                value={
                  numericInputValue(
                    draft.measurement.ceilingHeight,
                  )
                }
                aria-invalid={Boolean(
                  errors.ceilingHeight,
                )}
                aria-describedby={
                  errors.ceilingHeight
                    ? 'ceilingHeight-error'
                    : undefined
                }
                onChange={(event) =>
                  updateMeasurement(
                    'ceilingHeight',
                    finiteOrZero(
                      event.target
                        .valueAsNumber,
                    ),
                  )
                }
                className={numericClass}
              />

              <FieldError
                field="ceilingHeight"
                errors={errors}
              />
            </label>

            <label className="text-[11px] font-bold">
              방 개수

              <input
                id="rooms"
                type="number"
                inputMode="numeric"
                min="0"
                max="20"
                step="1"
                value={
                  numericInputValue(draft.measurement.rooms)
                }
                aria-invalid={Boolean(
                  errors.rooms,
                )}
                aria-describedby={
                  errors.rooms
                    ? 'rooms-error'
                    : undefined
                }
                onChange={(event) =>
                  updateMeasurement(
                    'rooms',
                    finiteOrZero(
                      event.target
                        .valueAsNumber,
                    ),
                  )
                }
                className={numericClass}
              />

              <FieldError
                field="rooms"
                errors={errors}
              />
            </label>

            <label className="text-[11px] font-bold">
              욕실 개수

              <input
                id="bathrooms"
                type="number"
                inputMode="numeric"
                min="0"
                max="20"
                step="1"
                value={
                  numericInputValue(
                    draft.measurement.bathrooms,
                  )
                }
                aria-invalid={Boolean(
                  errors.bathrooms,
                )}
                aria-describedby={
                  errors.bathrooms
                    ? 'bathrooms-error'
                    : undefined
                }
                onChange={(event) =>
                  updateMeasurement(
                    'bathrooms',
                    finiteOrZero(
                      event.target
                        .valueAsNumber,
                    ),
                  )
                }
                className={numericClass}
              />

              <FieldError
                field="bathrooms"
                errors={errors}
              />
            </label>
          </div>

          <label className="mt-3 block text-[11px] font-bold">
            현장 상태

            <input
              type="text"
              value={
                draft.measurement.siteCondition
              }
              onChange={(event) =>
                updateMeasurement(
                  'siteCondition',
                  event.target.value,
                )
              }
              className={numericClass}
            />
          </label>
        </ContractorSectionCard>

        <div id="materials" tabIndex={-1}>
          {draft.categories.map((category) => (
            <ContractorSectionCard
              key={category.id}
              className="mt-4"
              title={`${category.label} 실측 견적`}
            >
              <ContractorEstimateCostList category={category} />
            </ContractorSectionCard>
          ))}
          <FieldError field="materials" errors={errors} />
        </div>

        <ContractorSectionCard
          className="mt-4"
          title="추가 비용"
        >
          <div id="additionalCosts" tabIndex={-1} className="space-y-3">
            {draft.additionalCosts.map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] gap-2">
                <label className="text-[10px] font-semibold text-[#64748b]">
                  항목명
                  <input
                    type="text"
                    maxLength={50}
                    value={item.label}
                    onChange={(event) => updateAdditionalCost(item.id, 'label', event.target.value)}
                    className={numericClass}
                  />
                </label>
                <label className="text-[10px] font-semibold text-[#64748b]">
                  금액(원)
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1000"
                    value={item.amount}
                    onChange={(event) => updateAdditionalCost(item.id, 'amount', finiteOrZero(event.target.valueAsNumber))}
                    className={numericClass}
                  />
                </label>
                <button
                  type="button"
                  aria-label={`${item.label || '추가 비용'} 삭제`}
                  onClick={() => removeAdditionalCost(item.id)}
                  className="mt-[19px] h-11 rounded-lg border border-[#fecaca] text-base text-[#dc2626]"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addAdditionalCost}
              className="h-10 w-full rounded-lg border border-dashed border-[#2563eb] text-xs font-bold text-[#2563eb]"
            >
              + 추가 비용 항목 추가
            </button>
            <FieldError field="additionalCosts" errors={errors} />
          </div>

          <div className="mt-4 border-t border-[#e2e8f0] pt-3">
            <ContractorEstimateInfoRow label="추가 비용 합계" emphasize>
              {formatWon(calculateAdditionalTotal(draft))}
            </ContractorEstimateInfoRow>
          </div>
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-4"
          title="최종 금액 (VAT 포함)"
        >
          <ContractorEstimateSummary
            draft={draft}
            preview
          />
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-4"
          title="시공 조건"
        >
          <div className="space-y-3">
            <label className="block text-[11px] font-bold">
              시공 시작 예정일

              <input
                id="startDate"
                type="date"
                required
                value={
                  draft.condition.startDate
                }
                aria-invalid={Boolean(
                  errors.startDate,
                )}
                aria-describedby={
                  errors.startDate
                    ? 'startDate-error'
                    : undefined
                }
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    condition: {
                      ...current.condition,
                      startDate:
                        event.target.value,
                    },
                  }))

                  setErrors((current) => ({
                    ...current,
                    startDate: undefined,
                  }))
                }}
                className={numericClass}
              />

              <FieldError
                field="startDate"
                errors={errors}
              />
            </label>

            <label className="block text-[11px] font-bold">
              예상 시공 기간(일)

              <input
                id="durationDays"
                type="number"
                inputMode="numeric"
                min="1"
                max="365"
                step="1"
                value={
                  draft.condition.durationDays
                }
                aria-invalid={Boolean(
                  errors.durationDays,
                )}
                aria-describedby={
                  errors.durationDays
                    ? 'durationDays-error'
                    : undefined
                }
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    condition: {
                      ...current.condition,
                      durationDays:
                        finiteOrZero(
                          event.target
                            .valueAsNumber,
                        ),
                    },
                  }))

                  setErrors((current) => ({
                    ...current,
                    durationDays: undefined,
                  }))
                }}
                className={numericClass}
              />

              <FieldError
                field="durationDays"
                errors={errors}
              />
            </label>

            <ContractorEstimateInfoRow label="완료 예정일">
              2026.08.07
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="A/S 보증기간">
              {
                draft.condition
                  .warrantyLabel
              }
            </ContractorEstimateInfoRow>
          </div>
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-4"
          title="특이사항"
        >
          <label>
            <span className="sr-only">
              특이사항
            </span>

            <textarea
              maxLength={500}
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="h-28 w-full resize-none rounded-lg border border-[#e2e8f0] p-3 text-xs leading-5 outline-none focus:border-[#2563eb]"
            />
          </label>

          <p className="mt-1 text-right text-[10px] text-[#94a3b8]">
            {draft.notes.length}/500
          </p>
        </ContractorSectionCard>
      </main>

      <ContractorEstimateFixedActions
        onSave={() => { if (!isSaving) void save() }}
        onPreview={() => { if (!isSaving) void preview() }}
      />
    </ContractorMobileShell>
  )
}
