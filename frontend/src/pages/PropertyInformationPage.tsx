import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/Button'
import SegmentedControl from '@/components/user/SegmentedControl'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

import { createRequest } from '@/api/requestApi'
import {
  clearRequestFlow,
  parseManwon,
  saveRequestDraft,
  setActiveRequestId,
} from '@/utils/requestFlow'

export type PropertyType = 'villa' | 'apartment'

interface PropertyFormState {
  budget: string
  desiredDate: string

  /*
   * 현재 Figma에서는 더 이상 직접 입력하지 않지만,
   * 기존 빌라 의뢰 생성 API 흐름을 깨뜨리지 않기 위해
   * 내부 기본값은 임시로 유지합니다.
   */
  region: string
  exclusiveArea: string
  deposit: string
}

interface InputFieldProps {
  id: string
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  unit?: string
  inputMode?: 'text' | 'decimal' | 'numeric'
}

const propertyOptions: ReadonlyArray<{
  label: string
  value: PropertyType
}> = [
  {
    label: '아파트',
    value: 'apartment',
  },
  {
    label: '빌라',
    value: 'villa',
  },
]

const initialFormState: PropertyFormState = {
  budget: '1,500',
  desiredDate: '2025-07-31',

  // 기존 의뢰 생성 로직 호환용
  region: '광주광역시',
  exclusiveArea: '59',
  deposit: '0',
}

function InputField({
  id,
  label,
  value,
  onChange,
  unit,
  inputMode = 'text',
}: InputFieldProps) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold leading-3 text-[#152036]"
      >
        {label}
      </label>

      <div
        className={`mt-1.5 flex h-[35px] overflow-hidden rounded-[5px] border border-[#d5dfed] bg-white focus-within:border-[#2563eb] focus-within:ring-1 focus-within:ring-[#2563eb]/20 ${
          unit ? 'w-[114px]' : 'w-full'
        }`}
      >
        <input
          id={id}
          value={value}
          inputMode={inputMode}
          className="min-w-0 flex-1 bg-white px-[9px] text-[10px] font-bold text-[#425068] outline-none"
          onChange={onChange}
        />

        {unit ? (
          <span className="flex min-w-[33px] items-center justify-center bg-[#f0f3f7] px-2 text-[9px] font-black text-[#617087]">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default function PropertyInformationPage() {
  const navigate = useNavigate()

  const [propertyType, setPropertyType] =
    useState<PropertyType>('apartment')

  const [formState, setFormState] =
    useState<PropertyFormState>(initialFormState)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const isApartment = propertyType === 'apartment'

  const updateField =
    (field: keyof PropertyFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const budget = parseManwon(formState.budget)

    /*
     * 아파트의 지역·전용면적·공급면적·평면도는
     * 다음 주소 검색 단계에서 실제 값으로 가져옵니다.
     *
     * 현재 requestFlow의 기존 타입/흐름을 유지하기 위해
     * 필요한 기본 필드는 남겨둡니다.
     */
    const draft = {
      region: isApartment ? '' : formState.region.trim(),
      propertyType: propertyType.toUpperCase(),
      areaM2: isApartment
        ? 0
        : Number(formState.exclusiveArea.replace(/,/g, '')) || 0,
      deposit: parseManwon(formState.deposit),
      budgetMin: budget,
      budgetMax: budget,
      desiredDate: formState.desiredDate || undefined,
    }

    clearRequestFlow()
    saveRequestDraft(draft)

    /*
     * 아파트:
     * 주소 검색 → 아파트명/면적 → 등록 평면도 불러오기
     */
    if (isApartment) {
      navigate('/analysis/new/address')
      return
    }

    /*
     * 빌라:
     * 현재 프로젝트에 이미 구현되어 있는 기존 흐름을 유지합니다.
     */
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const requestId = await createRequest(draft)

      setActiveRequestId(requestId)
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

  return (
    <UserScreenShell>
      <UserHeader
        variant="detail"
        title="주택 정보 입력"
        onBack={() => navigate('/')}
      />

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit}
      >
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          {/* 진행 단계 */}
          <ol
            aria-label="분석 진행 단계"
            className="mx-auto mt-4 flex h-[50px] w-[295px] max-w-full items-center justify-between border-b border-[#e4e9f0]"
          >
            {Array.from(
              { length: 6 },
              (_, index) => index + 1,
            ).map((step) => (
              <li
                key={step}
                aria-current={
                  step === 1 ? 'step' : undefined
                }
                className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  step === 1
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-[#e2e8f0] text-[#64748b]'
                }`}
              >
                {step}
              </li>
            ))}
          </ol>

          {/* 페이지 제목 */}
          <section className="pt-5 text-center">
            <h1 className="text-[18px] font-bold leading-[22px] text-[#15284c]">
              주택 정보를 입력해주세요
            </h1>

            <p className="mt-2 text-[10px] leading-[17px] text-[#657187]">
              시공 요청에 필요한 정보를 입력해주세요.
            </p>
          </section>

          {/* 주택 유형 */}
          <section
            className="mt-[7px]"
            aria-labelledby="property-type-label"
          >
            <h2
              id="property-type-label"
              className="text-[14px] font-bold leading-5 text-[#1e293b]"
            >
              주택 유형 *
            </h2>

            <p className="text-[11px] leading-[18px] text-[#64748b]">
              보유하고 있는 주택 유형을 선택해주세요.
            </p>

            <div className="mt-1">
              <SegmentedControl
                ariaLabel="주택 유형"
                options={propertyOptions}
                value={propertyType}
                inset="three"
                textSize="md"
                onChange={setPropertyType}
              />
            </div>
          </section>

          {/* 주택 유형별 안내 */}
          {isApartment ? (
            <section className="mt-2.5 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-[13px] py-2.5">
              <h2 className="text-[13px] font-bold leading-[22px] text-[#2563eb]">
                ⌕ 아파트 정보 자동 불러오기
              </h2>

              <p className="mt-0.5 break-keep text-[11px] leading-[14px] text-[#64748b]">
                다음 단계에서 주소를 검색하면 지역,
                전용면적, 공급면적과 평면도를 자동으로
                불러옵니다.
              </p>
            </section>
          ) : (
            <section className="mt-2.5 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-[13px] py-2.5">
              <h2 className="text-[13px] font-bold leading-[22px] text-[#2563eb]">
                빌라 평면도 직접 등록
              </h2>

              <p className="mt-0.5 break-keep text-[11px] leading-[14px] text-[#64748b]">
                빌라는 다음 단계에서 보유한 평면도를 직접
                업로드해주세요.
              </p>
            </section>
          )}

          {/* 예산 */}
          <section
            className="mt-[28px]"
            aria-label="시공 요청 정보"
          >
            <InputField
              id="remodeling-budget"
              label="예산(리모델링)"
              value={formState.budget}
              unit="만원"
              inputMode="numeric"
              onChange={updateField('budget')}
            />
          </section>

          {/* 일정 */}
          <section className="mt-[29px] pb-6">
            <InputField
              id="desired-date"
              label="일정"
              value={formState.desiredDate}
              onChange={updateField('desiredDate')}
            />
          </section>
        </main>

        {/* 하단 다음 버튼 */}
        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
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
      </form>
    </UserScreenShell>
  )
}