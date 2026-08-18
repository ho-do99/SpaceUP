import { useState } from 'react'
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
  ContractorEstimatePaymentTerms,
} from '@/types/contractorPortal'

import ContractorRequestNotFound from './ContractorRequestNotFound'
import { createQuote, updateQuote } from '@/api/estimateApi'
import { estimateDraftToQuoteInput, getStoredQuoteId, storeQuoteId } from '@/utils/quoteDraft'
import useContractorRequest from '@/hooks/useContractorRequest'

const fieldOrder: readonly ContractorEstimateField[] = [
  'floorArea',
  'wallpaperArea',
  'ceilingHeight',
  'rooms',
  'bathrooms',
  'startDate',
  'durationDays',
  'depositPercent',
  'interimPercent',
  'balancePercent',
  'paymentTotal',
]

const finiteOrZero = (value: number) =>
  Number.isFinite(value) ? value : 0

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

  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)

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
      estimateDraft ??
        contractorDefaultEstimateDraft,
    )

  const [errors, setErrors] =
    useState<ContractorEstimateErrors>({})

  const [saveNotice, setSaveNotice] =
    useState(false)
  const [apiError, setApiError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!request) {
    return <ContractorRequestNotFound />
  }


  const updateMeasurement = (
    field: keyof ContractorEstimateMeasurement,
    value: number | string,
  ) => {
    setDraft((current) => ({
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

  const updatePayment = (
    field: keyof ContractorEstimatePaymentTerms,
    value: number,
  ) => {
    setDraft((current) => ({
      ...current,
      condition: {
        ...current.condition,
        paymentTerms: {
          ...current.condition.paymentTerms,
          [field]: value,
        },
      },
    }))

    const errorField =
      field === 'depositPercent'
        ? 'depositPercent'
        : field === 'interimPercent'
          ? 'interimPercent'
          : 'balancePercent'

    setErrors((current) => ({
      ...current,
      [errorField]: undefined,
      paymentTotal: undefined,
    }))
  }

  const validateDraft = () => {
    const normalized = {
      ...draft,
      notes: draft.notes.trim(),
    }

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

  const paymentTotal =
    draft.condition.paymentTerms
      .depositPercent +
    draft.condition.paymentTerms
      .interimPercent +
    draft.condition.paymentTerms
      .balancePercent

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

            <ContractorEstimateInfoRow label="현장방문일">
              2026.07.24
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="희망 시공일">
              2026.08.05
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="시공 항목">
              바닥재 · 벽지 · 조명
            </ContractorEstimateInfoRow>
          </dl>

          <p className="mt-3 rounded-lg bg-[#eff6ff] p-2 text-[11px] leading-4 text-[#2563eb]">
            실제 견적: 바닥재 · 벽지
            <br />
            조명은 현장 실측 후 별도 협의 · 현재
            견적 금액 미포함
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
                  draft.measurement.floorArea
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
                  draft.measurement
                    .wallpaperArea
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
              층고(m)

              <input
                id="ceilingHeight"
                type="number"
                inputMode="decimal"
                min="0.1"
                max="10"
                step="0.1"
                value={
                  draft.measurement
                    .ceilingHeight
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
                  draft.measurement.rooms
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
                  draft.measurement
                    .bathrooms
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

        {draft.categories.map((category) => (
          <ContractorSectionCard
            key={category.id}
            className="mt-4"
            title={`${category.label} 견적`}
          >
            <ContractorEstimateCostList
              category={category}
            />

            {category.id === 'wallpaper' ? (
              <p className="mt-3 text-[10px] leading-4 text-[#64748b]">
                항목 합계는 확정된 견적 기준값으로
                표시됩니다.
              </p>
            ) : null}
          </ContractorSectionCard>
        ))}

        <ContractorSectionCard
          className="mt-4"
          title="추가 비용"
        >
          <dl className="space-y-2">
            {draft.additionalCosts.map(
              (item) => (
                <ContractorEstimateInfoRow
                  key={item.id}
                  label={item.label}
                >
                  {formatWon(item.amount)}
                </ContractorEstimateInfoRow>
              ),
            )}

            <ContractorEstimateInfoRow
              label="추가 비용 합계"
              emphasize
            >
              {formatWon(
                calculateAdditionalTotal(
                  draft,
                ),
              )}
            </ContractorEstimateInfoRow>
          </dl>
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-4"
          title="할인 및 세금"
        >
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="할인 금액">
              -
              {formatWon(
                draft.discountAmount,
              )}
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="부가세">
              {draft.vatIncluded
                ? '포함'
                : '별도'}
            </ContractorEstimateInfoRow>
          </dl>

          <p className="mt-3 text-[11px] text-[#64748b]">
            총 견적 금액에는 부가세가 포함되어
            있습니다.
          </p>
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-4"
          title="시공사 제안 견적"
        >
          <ContractorEstimateSummary
            draft={draft}
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

            <ContractorEstimateInfoRow label="견적 유효기간">
              작성일로부터 14일
            </ContractorEstimateInfoRow>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  [
                    'depositPercent',
                    'depositPercent',
                    '계약금',
                  ],
                  [
                    'interimPercent',
                    'interimPercent',
                    '중도금',
                  ],
                  [
                    'balancePercent',
                    'balancePercent',
                    '잔금',
                  ],
                ] as const
              ).map(
                ([
                  key,
                  errorKey,
                  label,
                ]) => (
                  <label
                    key={key}
                    className="text-[11px] font-bold"
                  >
                    {label}(%)

                    <input
                      id={errorKey}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="100"
                      step="1"
                      value={
                        draft.condition
                          .paymentTerms[key]
                      }
                      aria-invalid={Boolean(
                        errors[errorKey],
                      )}
                      aria-describedby={
                        errors[errorKey]
                          ? `${errorKey}-error`
                          : undefined
                      }
                      onChange={(event) =>
                        updatePayment(
                          key,
                          finiteOrZero(
                            event.target
                              .valueAsNumber,
                          ),
                        )
                      }
                      className={
                        numericClass
                      }
                    />

                    <FieldError
                      field={errorKey}
                      errors={errors}
                    />
                  </label>
                ),
              )}
            </div>

            <p
              id="paymentTotal"
              tabIndex={
                errors.paymentTotal
                  ? -1
                  : undefined
              }
              className={`text-xs ${
                errors.paymentTotal
                  ? 'font-semibold text-[#dc2626]'
                  : 'text-[#64748b]'
              }`}
              role={
                errors.paymentTotal
                  ? 'alert'
                  : undefined
              }
            >
              결제 비율 합계 {paymentTotal}%
            </p>

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
