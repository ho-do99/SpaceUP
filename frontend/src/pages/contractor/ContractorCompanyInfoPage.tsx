import { useEffect, useState, type FormEvent } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorCompanyTabs from '@/components/contractor/ContractorCompanyTabs'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { getMyContractorProfile, updateMyContractorProfile, updateMyContractorServiceInfo } from '@/api/contractorApi'

interface CompanyInformation {
  companyName: string
  representativeName: string
}

interface CompanyInformationErrors {
  companyName?: string
  representativeName?: string
}

interface ServiceInformation {
  estimateMin: string
  estimateMax: string
  availableFromDate: string
}

interface ServiceInformationErrors {
  estimateMin?: string
  estimateMax?: string
  availableFromDate?: string
}

export default function ContractorCompanyInfoPage() {
  const [companyInformation, setCompanyInformation] =
    useState<CompanyInformation>({
      companyName: '(주)스페이스 인테리어',
      representativeName: '김스페이스',
    })

  const [errors, setErrors] =
    useState<CompanyInformationErrors>({})

  const [showSavedToast, setShowSavedToast] = useState(false)
  const [businessNumber, setBusinessNumber] = useState('123-45-67890')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [serviceInformation, setServiceInformation] = useState<ServiceInformation>({ estimateMin: '', estimateMax: '', availableFromDate: '' })
  const [serviceErrors, setServiceErrors] = useState<ServiceInformationErrors>({})
  const [savingService, setSavingService] = useState(false)
  const [serviceSaveError, setServiceSaveError] = useState('')
  const [showServiceSavedToast, setShowServiceSavedToast] = useState(false)

  useEffect(() => {
    getMyContractorProfile().then((profile) => {
      setCompanyInformation((current) => ({ companyName: profile.companyName || current.companyName, representativeName: profile.memberName || current.representativeName }))
      setBusinessNumber(profile.businessRegistrationNumber || '')
      setServiceInformation({
        estimateMin: profile.estimateMin == null ? '' : String(profile.estimateMin),
        estimateMax: profile.estimateMax == null ? '' : String(profile.estimateMax),
        availableFromDate: profile.availableFromDate || '',
      })
    }).catch(() => undefined)
  }, [])

  const updateField = (
    field: keyof CompanyInformation,
    value: string,
  ) => {
    setCompanyInformation((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }))

    setShowSavedToast(false)
    setShowServiceSavedToast(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const companyName = companyInformation.companyName.trim()
    const representativeName =
      companyInformation.representativeName.trim()

    const nextErrors: CompanyInformationErrors = {}

    if (!companyName) {
      nextErrors.companyName = '업체명을 입력해 주세요.'
    }

    if (!representativeName) {
      nextErrors.representativeName = '대표자명을 입력해 주세요.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setShowSavedToast(false)
      return
    }

    setCompanyInformation({
      companyName,
      representativeName,
    })

    setSaving(true)
    setSaveError('')
    try {
      await updateMyContractorProfile({ companyName })
      setShowSavedToast(true)
    } catch (error) {
      setShowSavedToast(false)
      setSaveError(error instanceof Error ? error.message : '업체 정보 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const inputClassName = (hasError = false) =>
    `h-11 w-full rounded-lg border bg-white px-3 text-xs outline-none focus:ring-2 ${
      hasError
        ? 'border-[#dc2626] text-[#1e293b] focus:border-[#dc2626] focus:ring-[#fee2e2]'
        : 'border-[#e2e8f0] text-[#64748b] focus:border-[#2563eb] focus:ring-[#dbeafe]'
    }`

  const updateServiceField = (field: keyof ServiceInformation, value: string) => {
    setServiceInformation((current) => ({ ...current, [field]: value }))
    setServiceErrors((current) => ({ ...current, [field]: undefined }))
    setServiceSaveError('')
    setShowServiceSavedToast(false)
  }

  const handleServiceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const estimateMin = Number(serviceInformation.estimateMin.replace(/,/g, ''))
    const estimateMax = Number(serviceInformation.estimateMax.replace(/,/g, ''))
    const nextErrors: ServiceInformationErrors = {}
    if (!serviceInformation.estimateMin.trim() || !Number.isFinite(estimateMin) || estimateMin < 0) nextErrors.estimateMin = '최소 견적 금액을 확인해 주세요.'
    if (!serviceInformation.estimateMax.trim() || !Number.isFinite(estimateMax) || estimateMax < estimateMin) nextErrors.estimateMax = '최대 견적 금액은 최소 견적 금액 이상이어야 합니다.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceInformation.availableFromDate)) nextErrors.availableFromDate = '시공 가능 시작일을 선택해 주세요.'
    setServiceErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSavingService(true)
    setServiceSaveError('')
    setShowSavedToast(false)
    try {
      await updateMyContractorServiceInfo({ estimateMin, estimateMax, availableFromDate: serviceInformation.availableFromDate })
      setShowServiceSavedToast(true)
    } catch (error) {
      setServiceSaveError(error instanceof Error ? error.message : '시공 서비스 정보 저장에 실패했습니다.')
    } finally {
      setSavingService(false)
    }
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="업체 정보" />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">
          시공사 공개 정보와 운영 정보를 관리하세요.
        </p>

        <div className="mt-2">
          <ContractorCompanyTabs activeTab="basic" />
        </div>

        <form className="mt-3" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="contractor-company-name"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              업체명
            </label>

            <input
              id="contractor-company-name"
              type="text"
              value={companyInformation.companyName}
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={
                errors.companyName
                  ? 'contractor-company-name-error'
                  : undefined
              }
              onChange={(event) =>
                updateField('companyName', event.target.value)
              }
              className={`mt-[5px] ${inputClassName(
                Boolean(errors.companyName),
              )}`}
            />

            {errors.companyName ? (
              <p
                id="contractor-company-name-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
              >
                {errors.companyName}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            <label
              htmlFor="contractor-business-number"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              사업자등록번호
            </label>

            <input
              id="contractor-business-number"
              type="text"
              value={businessNumber}
              readOnly
              aria-readonly="true"
              className={`mt-[5px] cursor-default ${inputClassName()}`}
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="contractor-representative-name"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              대표자명
            </label>

            <input
              id="contractor-representative-name"
              type="text"
              value={companyInformation.representativeName}
              aria-invalid={Boolean(errors.representativeName)}
              aria-describedby={
                errors.representativeName
                  ? 'contractor-representative-name-error'
                  : undefined
              }
              onChange={(event) =>
                updateField(
                  'representativeName',
                  event.target.value,
                )
              }
              className={`mt-[5px] ${inputClassName(
                Boolean(errors.representativeName),
              )}`}
            />

            {errors.representativeName ? (
              <p
                id="contractor-representative-name-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
              >
                {errors.representativeName}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            <label
              htmlFor="contractor-manager-contact"
              className="block text-[11px] font-bold text-[#1e293b]"
            >
              담당자 · 연락처
            </label>

            <input
              id="contractor-manager-contact"
              type="text"
              value="김현수 · 010-1234-5678"
              readOnly
              aria-readonly="true"
              className={`mt-[5px] cursor-default ${inputClassName()}`}
            />
          </div>

          <section
            className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-[14px]"
            aria-labelledby="company-portfolio-title"
          >
            <h2
              id="company-portfolio-title"
              className="text-sm font-bold text-[#2563eb]"
            >
              포트폴리오 관리
            </h2>

            <p className="mt-1 text-xs text-[#64748b]">
              등록 12건 · 공개 10건
            </p>

            <p className="mt-1 text-xs leading-5 text-[#64748b]">
              승인 후 시공 사례를 별도로 등록하고 관리합니다.
            </p>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-[#eff6ff]/50 text-xs font-bold text-[#2563eb] disabled:cursor-not-allowed"
            >
              포트폴리오 관리로 이동
            </button>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="mt-3 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
          >
            {saving ? '저장 중...' : '정보 저장'}
          </button>
          {saveError ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{saveError}</p> : null}
        </form>

        <form className="mt-5 border-t border-[#e2e8f0] pt-5" onSubmit={handleServiceSubmit} noValidate>
          <h2 className="text-sm font-bold text-[#1e293b]">시공 서비스 정보</h2>
          <p className="mt-1 text-xs leading-5 text-[#64748b]">시공 가능한 견적 범위와 시공 가능 일정을 설정하세요.</p>

          <div className="mt-3">
            <label htmlFor="contractor-estimate-min" className="block text-[11px] font-bold text-[#1e293b]">최소 견적 금액</label>
            <input id="contractor-estimate-min" inputMode="numeric" value={serviceInformation.estimateMin} placeholder="1,000,000원" onChange={(event) => updateServiceField('estimateMin', event.target.value.replace(/[^0-9,]/g, ''))} className={`mt-[5px] ${inputClassName(Boolean(serviceErrors.estimateMin))}`} />
            {serviceErrors.estimateMin ? <p role="alert" className="mt-1.5 text-[11px] font-semibold text-[#dc2626]">{serviceErrors.estimateMin}</p> : null}
          </div>

          <div className="mt-3">
            <label htmlFor="contractor-estimate-max" className="block text-[11px] font-bold text-[#1e293b]">최대 견적 금액</label>
            <input id="contractor-estimate-max" inputMode="numeric" value={serviceInformation.estimateMax} placeholder="5,000,000원" onChange={(event) => updateServiceField('estimateMax', event.target.value.replace(/[^0-9,]/g, ''))} className={`mt-[5px] ${inputClassName(Boolean(serviceErrors.estimateMax))}`} />
            {serviceErrors.estimateMax ? <p role="alert" className="mt-1.5 text-[11px] font-semibold text-[#dc2626]">{serviceErrors.estimateMax}</p> : null}
          </div>

          <div className="mt-3">
            <label htmlFor="contractor-available-date" className="block text-[11px] font-bold text-[#1e293b]">시공 가능 시작일</label>
            <input id="contractor-available-date" type="date" value={serviceInformation.availableFromDate} onChange={(event) => updateServiceField('availableFromDate', event.target.value)} className={`mt-[5px] ${inputClassName(Boolean(serviceErrors.availableFromDate))}`} />
            {serviceErrors.availableFromDate ? <p role="alert" className="mt-1.5 text-[11px] font-semibold text-[#dc2626]">{serviceErrors.availableFromDate}</p> : null}
          </div>

          <button type="submit" disabled={savingService} className="mt-3 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:bg-[#93b4f5]">{savingService ? '저장 중...' : '시공 서비스 정보 저장'}</button>
          {serviceSaveError ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{serviceSaveError}</p> : null}
        </form>
      </main>

      <ContractorBottomNavigation />

      {showSavedToast ? (
        <button
          type="button"
          role="status"
          aria-live="polite"
          aria-label="업체 정보 저장 완료 안내 닫기"
          onClick={() => setShowSavedToast(false)}
          className="absolute bottom-[76px] left-1/2 z-40 flex h-11 w-[280px] -translate-x-1/2 items-center justify-center rounded-[10px] bg-[#0f172a] px-4 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <span className="text-xs font-bold text-white">
            업체 정보가 저장되었습니다.
          </span>
        </button>
      ) : null}

      {showServiceSavedToast ? (
        <button type="button" role="status" aria-live="polite" aria-label="시공 서비스 정보 저장 완료 안내 닫기" onClick={() => setShowServiceSavedToast(false)} className="absolute bottom-[76px] left-1/2 z-40 flex h-11 w-[280px] -translate-x-1/2 items-center justify-center rounded-[10px] bg-[#0f172a] px-4 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <span className="text-xs font-bold text-white">시공 서비스 정보가 저장되었습니다.</span>
        </button>
      ) : null}
    </ContractorMobileShell>
  )
}
