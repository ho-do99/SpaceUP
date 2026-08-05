import { useState, type FormEvent } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorCompanyTabs from '@/components/contractor/ContractorCompanyTabs'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

interface CompanyInformation {
  companyName: string
  representativeName: string
}

interface CompanyInformationErrors {
  companyName?: string
  representativeName?: string
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
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    setShowSavedToast(true)
  }

  const inputClassName = (hasError = false) =>
    `h-11 w-full rounded-lg border bg-white px-3 text-xs outline-none focus:ring-2 ${
      hasError
        ? 'border-[#dc2626] text-[#1e293b] focus:border-[#dc2626] focus:ring-[#fee2e2]'
        : 'border-[#e2e8f0] text-[#64748b] focus:border-[#2563eb] focus:ring-[#dbeafe]'
    }`

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
              value="123-45-67890"
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
            className="mt-3 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
          >
            정보 저장
          </button>
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
    </ContractorMobileShell>
  )
}