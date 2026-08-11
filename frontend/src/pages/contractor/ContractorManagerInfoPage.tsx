import { useEffect, useState, type FormEvent } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { getMyContractorProfile, updateMyContractorManager } from '@/api/contractorApi'

interface ManagerFormState {
  managerName: string
  position: string
  phoneNumber: string
  email: string
  consultationHours: string
}

interface ManagerFormErrors {
  managerName?: string
  position?: string
  phoneNumber?: string
  email?: string
  consultationHours?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PHONE_PATTERN = /^010-\d{4}-\d{4}$/

export default function ContractorManagerInfoPage() {
  const [form, setForm] = useState<ManagerFormState>({
    managerName: '김현수',
    position: '영업 담당자',
    phoneNumber: '010-1234-5678',
    email: 'manager@spaceup.co.kr',
    consultationHours: '평일 09:00–18:00',
  })

  const [errors, setErrors] = useState<ManagerFormErrors>({})
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    getMyContractorProfile().then((profile) => setForm((current) => ({ ...current, position: profile.managerPosition || current.position, consultationHours: profile.consultationHours || current.consultationHours }))).catch(() => undefined)
  }, [])

  const updateField = (
    field: keyof ManagerFormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }))

    setShowSavedToast(false)
  }

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)

    let formattedPhone = numbers

    if (numbers.length > 7) {
      formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(
        3,
        7,
      )}-${numbers.slice(7)}`
    } else if (numbers.length > 3) {
      formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    }

    updateField('phoneNumber', formattedPhone)
  }

  const validateForm = () => {
    const nextErrors: ManagerFormErrors = {}

    const trimmedManagerName = form.managerName.trim()
    const trimmedPosition = form.position.trim()
    const trimmedPhoneNumber = form.phoneNumber.trim()
    const trimmedEmail = form.email.trim()
    const trimmedConsultationHours = form.consultationHours.trim()

    if (!trimmedManagerName) {
      nextErrors.managerName = '담당자명을 입력해 주세요.'
    }

    if (!trimmedPosition) {
      nextErrors.position = '직책을 입력해 주세요.'
    }

    if (!trimmedPhoneNumber) {
      nextErrors.phoneNumber = '휴대폰 번호를 입력해 주세요.'
    } else if (!PHONE_PATTERN.test(trimmedPhoneNumber)) {
      nextErrors.phoneNumber =
        '휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요.'
    }

    if (!trimmedEmail) {
      nextErrors.email = '이메일을 입력해 주세요.'
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = '올바른 이메일 형식을 입력해 주세요.'
    }

    if (!trimmedConsultationHours) {
      nextErrors.consultationHours =
        '상담 가능 시간을 입력해 주세요.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return false
    }

    setForm({
      managerName: trimmedManagerName,
      position: trimmedPosition,
      phoneNumber: trimmedPhoneNumber,
      email: trimmedEmail,
      consultationHours: trimmedConsultationHours,
    })

    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateForm()) {
      setShowSavedToast(false)
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      await updateMyContractorManager({ managerPosition: form.position, consultationHours: form.consultationHours })
      setShowSavedToast(true)
    } catch (error) {
      setShowSavedToast(false)
      setSaveError(error instanceof Error ? error.message : '담당자 정보 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const inputClassName = (hasError: boolean) =>
    `mt-2 h-12 w-full rounded-lg border bg-white px-3 text-xs text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:ring-2 ${
      hasError
        ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#fee2e2]'
        : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-[#dbeafe]'
    }`

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="담당자 정보" back />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-5">
        <p className="text-xs leading-5 text-[#64748b]">
          고객 상담과 계약 안내에 사용할 담당자 정보를 관리하세요.
        </p>

        <form className="mt-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="contractor-manager-name"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              담당자명
            </label>

            <input
              id="contractor-manager-name"
              type="text"
              value={form.managerName}
              autoComplete="name"
              aria-required="true"
              aria-invalid={Boolean(errors.managerName)}
              aria-describedby={
                errors.managerName
                  ? 'contractor-manager-name-error'
                  : undefined
              }
              onChange={(event) =>
                updateField('managerName', event.target.value)
              }
              className={inputClassName(Boolean(errors.managerName))}
            />

            {errors.managerName ? (
              <p
                id="contractor-manager-name-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
              >
                {errors.managerName}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            <label
              htmlFor="contractor-manager-position"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              직책
            </label>

            <input
              id="contractor-manager-position"
              type="text"
              value={form.position}
              aria-required="true"
              aria-invalid={Boolean(errors.position)}
              aria-describedby={
                errors.position
                  ? 'contractor-manager-position-error'
                  : undefined
              }
              onChange={(event) =>
                updateField('position', event.target.value)
              }
              className={inputClassName(Boolean(errors.position))}
            />

            {errors.position ? (
              <p
                id="contractor-manager-position-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
              >
                {errors.position}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            <label
              htmlFor="contractor-manager-phone"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              휴대폰 번호
            </label>

            <input
              id="contractor-manager-phone"
              type="tel"
              inputMode="numeric"
              value={form.phoneNumber}
              autoComplete="tel"
              aria-required="true"
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={
                errors.phoneNumber
                  ? 'contractor-manager-phone-error'
                  : undefined
              }
              onChange={(event) =>
                handlePhoneChange(event.target.value)
              }
              className={inputClassName(Boolean(errors.phoneNumber))}
            />

            {errors.phoneNumber ? (
              <p
                id="contractor-manager-phone-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
              >
                {errors.phoneNumber}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            <label
              htmlFor="contractor-manager-email"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              이메일
            </label>

            <input
              id="contractor-manager-email"
              type="email"
              value={form.email}
              autoComplete="email"
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email
                  ? 'contractor-manager-email-error'
                  : undefined
              }
              onChange={(event) =>
                updateField('email', event.target.value)
              }
              className={inputClassName(Boolean(errors.email))}
            />

            {errors.email ? (
              <p
                id="contractor-manager-email-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            <label
              htmlFor="contractor-manager-consultation-hours"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              상담 가능 시간
            </label>

            <input
              id="contractor-manager-consultation-hours"
              type="text"
              value={form.consultationHours}
              aria-required="true"
              aria-invalid={Boolean(errors.consultationHours)}
              aria-describedby={
                errors.consultationHours
                  ? 'contractor-manager-consultation-hours-error'
                  : undefined
              }
              onChange={(event) =>
                updateField(
                  'consultationHours',
                  event.target.value,
                )
              }
              className={inputClassName(
                Boolean(errors.consultationHours),
              )}
            />

            {errors.consultationHours ? (
              <p
                id="contractor-manager-consultation-hours-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
              >
                {errors.consultationHours}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
          >
            {saving ? '저장 중...' : '담당자 정보 저장'}
          </button>
          {saveError ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{saveError}</p> : null}
        </form>
      </main>

      {showSavedToast ? (
        <button
          type="button"
          role="status"
          aria-live="polite"
          aria-label="담당자 정보 저장 완료 안내 닫기"
          onClick={() => setShowSavedToast(false)}
          className="absolute bottom-6 left-1/2 z-40 flex h-11 w-[280px] -translate-x-1/2 items-center justify-center rounded-[10px] bg-[#0f172a] px-4 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <span className="text-xs font-bold text-white">
            담당자 정보가 저장되었습니다.
          </span>
        </button>
      ) : null}
    </ContractorMobileShell>
  )
}
