import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import SegmentedControl from '@/components/user/SegmentedControl'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { createRequest } from '@/api/requestApi'
import { clearRequestFlow, parseManwon, saveRequestDraft, setActiveRequestId } from '@/utils/requestFlow'

export type PropertyType = 'villa' | 'apartment'
export type ContractType = 'monthly' | 'jeonse'
type OccupancyStatus = 'vacant' | 'occupied' | 'planned'

interface PropertyFormState {
  region: string
  exclusiveArea: string
  monthlyDeposit: string
  monthlyRent: string
  villaJeonseDeposit: string
  apartmentJeonseDeposit: string
  budget: string
  occupancyStatus: OccupancyStatus
  desiredDate: string
}

interface InputFieldProps {
  id: string
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  unit?: string
  required?: boolean
  inputMode?: 'text' | 'decimal' | 'numeric'
}

const propertyOptions: ReadonlyArray<{ label: string; value: PropertyType }> = [
  { label: '아파트', value: 'apartment' },
  { label: '빌라', value: 'villa' },
]

const contractOptions: ReadonlyArray<{ label: string; value: ContractType }> = [
  { label: '월세', value: 'monthly' },
  { label: '전세', value: 'jeonse' },
]

const occupancyOptions: ReadonlyArray<{ label: string; value: OccupancyStatus }> = [
  { label: '공실', value: 'vacant' },
  { label: '거주 중', value: 'occupied' },
  { label: '입주 예정', value: 'planned' },
]

const initialFormState: PropertyFormState = {
  region: '광주광역시',
  exclusiveArea: '59',
  monthlyDeposit: '10,000',
  monthlyRent: '60',
  villaJeonseDeposit: '20,000',
  apartmentJeonseDeposit: '30,000',
  budget: '1,500',
  occupancyStatus: 'vacant',
  desiredDate: '2025-07-31',
}

function InputField({
  id,
  label,
  value,
  onChange,
  unit,
  required = false,
  inputMode = 'text',
}: InputFieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-[10px] font-bold leading-3 text-[#152036]">
        {label}
        {required && ' *'}
      </label>
      <div className="mt-1.5 flex h-[35px] overflow-hidden rounded-[5px] border border-[#d5dfed] bg-white focus-within:border-[#2563eb] focus-within:ring-1 focus-within:ring-[#2563eb]/20">
        <input
          id={id}
          value={value}
          required={required}
          inputMode={inputMode}
          className="min-w-0 flex-1 bg-white px-[9px] text-[10px] font-bold text-[#425068] outline-none"
          onChange={onChange}
        />
        {unit && (
          <span className="flex min-w-[33px] items-center justify-center bg-[#f0f3f7] px-2 text-[9px] font-black text-[#617087]">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export default function PropertyInformationPage() {
  const navigate = useNavigate()
  const [propertyType, setPropertyType] = useState<PropertyType | null>('villa')
  const [contractType, setContractType] = useState<ContractType | null>('monthly')
  const [formState, setFormState] = useState<PropertyFormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const isVilla = propertyType === 'villa'
  const isMonthly = contractType === 'monthly'
  const canContinue = propertyType !== null && contractType !== null

  const updateField = (field: keyof PropertyFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!propertyType || !contractType) {
      return
    }

    const deposit = contractType === 'monthly'
      ? parseManwon(formState.monthlyDeposit)
      : parseManwon(isVilla ? formState.villaJeonseDeposit : formState.apartmentJeonseDeposit)
    const budget = parseManwon(formState.budget)
    const draft = {
      region: formState.region.trim(),
      propertyType: propertyType.toUpperCase(),
      areaM2: Number(formState.exclusiveArea.replace(/,/g, '')) || 0,
      deposit,
      monthlyRent: contractType === 'monthly' ? parseManwon(formState.monthlyRent) : undefined,
      budgetMin: budget,
      budgetMax: budget,
      desiredDate: formState.desiredDate || undefined,
    }
    clearRequestFlow()
    saveRequestDraft(draft)

    if (propertyType === 'apartment') {
      navigate('/analysis/new/address')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    try {
      const requestId = await createRequest(draft)
      setActiveRequestId(requestId)
      navigate('/upload')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '의뢰 생성에 실패했습니다.')
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

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <ol
            aria-label="분석 진행 단계"
            className="mx-auto mt-4 flex h-[50px] w-[min(295px,100%)] items-center justify-between border-b border-[#e4e9f0]"
          >
            {Array.from({ length: 6 }, (_, index) => index + 1).map((step) => (
              <li
                key={step}
                aria-current={step === 1 ? 'step' : undefined}
                className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  step === 1 ? 'bg-[#2563eb] text-white' : 'bg-[#e2e8f0] text-[#64748b]'
                }`}
              >
                {step}
              </li>
            ))}
          </ol>

          <section className="pt-5 text-center">
            <h1 className="text-[18px] font-bold leading-[22px] text-[#15284c]">
              주택 및 거래 정보를 입력해주세요
            </h1>
            <p className="mt-2 text-[10px] leading-[17px] text-[#657187]">
              정확한 분석을 위해 주택과 거래 정보를 입력해주세요.
            </p>
          </section>

          <section className="mt-[7px]" aria-labelledby="property-type-label">
            <h2 id="property-type-label" className="text-[14px] font-bold leading-5 text-[#1e293b]">
              주택 유형 *
            </h2>
            <p className="text-[11px] leading-[18px] text-[#64748b]">
              보유하고 있는 주택 유형을 선택해주세요.
            </p>
            {propertyType && (
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
            )}
          </section>

          <section className="mt-2.5" aria-labelledby="contract-type-label">
            <h2 id="contract-type-label" className="text-[12px] font-bold leading-5 text-[#1e293b]">
              거래 유형 *
            </h2>
            <p className="text-[11px] leading-[18px] text-[#64748b]">
              현재 계약 또는 거래 유형을 선택해주세요.
            </p>
            {contractType && (
              <div className="mt-1">
                <SegmentedControl
                  ariaLabel="거래 유형"
                  options={contractOptions}
                  value={contractType}
                  onChange={setContractType}
                />
              </div>
            )}
          </section>

          {isVilla ? (
            <p className="mt-2.5 text-[11px] leading-5 text-[#64748b]">
              빌라는 다음 단계에서 평면도를 직접 업로드해주세요.
            </p>
          ) : (
            <section className="mt-2.5 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-[13px] py-2.5">
              <h2 className="text-[13px] font-bold leading-[22px] text-[#2563eb]">
                ⌕ 아파트 정보 자동 불러오기
              </h2>
              <p className="mt-0.5 break-keep text-[11px] leading-[14px] text-[#64748b]">
                다음 단계에서 주소를 검색하면 지역, 전용면적, 공급면적과 평면도를 자동으로 불러옵니다.
              </p>
            </section>
          )}

          <section className={isVilla ? 'mt-[27px]' : 'mt-[28px]'} aria-label="주택 상세 정보">
            {isVilla && (
              <div className="grid grid-cols-2 gap-2.5">
                <InputField
                  id="property-region"
                  label="지역"
                  value={formState.region}
                  required
                  onChange={updateField('region')}
                />
                <InputField
                  id="property-area"
                  label="전용 면적(m²)"
                  value={formState.exclusiveArea}
                  unit="m²"
                  required
                  inputMode="decimal"
                  onChange={updateField('exclusiveArea')}
                />
              </div>
            )}

            <div className={`${isVilla ? 'mt-[15px]' : ''} grid ${isMonthly ? 'grid-cols-3' : 'grid-cols-2'} gap-[9px]`}>
              {isMonthly ? (
                <>
                  <InputField
                    id="monthly-deposit"
                    label="월세 보증금"
                    value={formState.monthlyDeposit}
                    unit="만원"
                    inputMode="numeric"
                    onChange={updateField('monthlyDeposit')}
                  />
                  <InputField
                    id="monthly-rent"
                    label="월세"
                    value={formState.monthlyRent}
                    unit="만원"
                    inputMode="numeric"
                    onChange={updateField('monthlyRent')}
                  />
                </>
              ) : (
                <InputField
                  id="jeonse-deposit"
                  label="현재 전세 보증금"
                  value={
                    isVilla ? formState.villaJeonseDeposit : formState.apartmentJeonseDeposit
                  }
                  unit="만원"
                  inputMode="numeric"
                  onChange={updateField(
                    isVilla ? 'villaJeonseDeposit' : 'apartmentJeonseDeposit',
                  )}
                />
              )}
              <InputField
                id="remodeling-budget"
                label="예산(리모델링)"
                value={formState.budget}
                unit="만원"
                inputMode="numeric"
                onChange={updateField('budget')}
              />
            </div>
          </section>

          <fieldset className="mt-3.5 border-0 p-0">
            <legend className="text-[10px] font-bold leading-3 text-[#15284c]">공실 상태</legend>
            <div className="mt-2 flex flex-wrap gap-x-[17px] gap-y-2">
              {occupancyOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-[5px] text-[10px] leading-4 text-[#647086]"
                >
                  <input
                    type="radio"
                    name="occupancy-status"
                    value={option.value}
                    checked={formState.occupancyStatus === option.value}
                    className="size-4 shrink-0 appearance-none rounded-full border border-[#cbd5e1] checked:border-[3px] checked:border-[#2462b6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                    onChange={() =>
                      setFormState((current) => ({
                        ...current,
                        occupancyStatus: option.value,
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-3.5 pb-6">
            <InputField
              id="desired-date"
              label={isVilla ? '희망 일정' : '일정'}
              value={formState.desiredDate}
              onChange={updateField('desiredDate')}
            />
          </div>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))] pt-0">
          <Button
            type="submit"
            disabled={!canContinue || isSubmitting}
            isLoading={isSubmitting}
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            다음
          </Button>
          <p role="alert" className="mt-2 min-h-4 text-center text-[10px] text-[#ef4444]">{submitError}</p>
        </footer>
      </form>
    </UserScreenShell>
  )
}
