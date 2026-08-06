import { useState, type FormEvent } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorCompanyTabs from '@/components/contractor/ContractorCompanyTabs'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

interface SettlementInformation {
  bank: string
  accountHolder: string
  accountNumber: string
  taxEmail: string
}

interface SettlementInformationErrors {
  bank?: string
  accountHolder?: string
  accountNumber?: string
  taxEmail?: string
}

const settlementSummary = [
  {
    label: '정산 예정 금액',
    value: '₩12,500,000',
  },
  {
    label: '정산 완료 금액',
    value: '₩38,200,000',
  },
  {
    label: '다음 정산 예정일',
    value: '2026.07.31',
  },
  {
    label: '플랫폼 수수료',
    value: '5%',
  },
] as const

function formatAccountNumber(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 14)

  if (numbers.length <= 6) {
    return numbers
  }

  if (numbers.length <= 8) {
    return `${numbers.slice(0, 6)}-${numbers.slice(6)}`
  }

  return `${numbers.slice(0, 6)}-${numbers.slice(
    6,
    8,
  )}-${numbers.slice(8)}`
}

export default function ContractorCompanySettlementPage() {
  const [settlementInformation, setSettlementInformation] =
    useState<SettlementInformation>({
      bank: '국민은행',
      accountHolder: '㈜스페이스 인테리어',
      accountNumber: '123456-78-901234',
      taxEmail: 'tax@spaceup.co.kr',
    })

  const [errors, setErrors] =
    useState<SettlementInformationErrors>({})

  const [showSavedToast, setShowSavedToast] = useState(false)

  const updateField = (
    field: keyof SettlementInformation,
    value: string,
  ) => {
    setSettlementInformation((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }))

    setShowSavedToast(false)
  }

  const handleAccountNumberChange = (value: string) => {
    updateField('accountNumber', formatAccountNumber(value))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const bank = settlementInformation.bank.trim()
    const accountHolder =
      settlementInformation.accountHolder.trim()
    const accountNumber =
      settlementInformation.accountNumber.trim()
    const taxEmail = settlementInformation.taxEmail.trim()

    const nextErrors: SettlementInformationErrors = {}

    if (!bank) {
      nextErrors.bank = '은행을 입력해 주세요.'
    }

    if (!accountHolder) {
      nextErrors.accountHolder = '예금주를 입력해 주세요.'
    }

    if (
      accountNumber.replace(/\D/g, '').length < 10
    ) {
      nextErrors.accountNumber =
        '올바른 계좌번호를 입력해 주세요.'
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(taxEmail)
    ) {
      nextErrors.taxEmail =
        '올바른 이메일 주소를 입력해 주세요.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setShowSavedToast(false)
      return
    }

    setSettlementInformation({
      bank,
      accountHolder,
      accountNumber,
      taxEmail,
    })

    setShowSavedToast(true)
  }

  const inputClassName = (hasError = false) =>
    `mt-[5px] h-12 w-full rounded-lg border bg-white px-[13px] text-xs text-[#64748b] outline-none transition-colors focus:ring-2 ${
      hasError
        ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#fee2e2]'
        : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-[#dbeafe]'
    }`

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="업체 정보" />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">
          정산 계좌와 세금계산서 정보를 관리하세요.
        </p>

        <div className="mt-2">
          <ContractorCompanyTabs activeTab="settlement" />
        </div>

        <section
          className="mt-3"
          aria-labelledby="settlement-summary-title"
        >
          <h2
            id="settlement-summary-title"
            className="text-sm font-bold text-[#1e293b]"
          >
            정산 현황
          </h2>

          <div className="mt-3 rounded-xl border border-[#e2e8f0] bg-white px-[15px] py-[13px]">
            <dl className="space-y-[14px]">
              {settlementSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4"
                >
                  <dt className="text-[11px] text-[#64748b]">
                    {item.label}
                  </dt>

                  <dd className="text-right text-xs font-bold text-[#1e293b]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <form
          className="mt-5"
          onSubmit={handleSubmit}
          noValidate
        >
          <section aria-labelledby="settlement-account-title">
            <h2
              id="settlement-account-title"
              className="text-sm font-bold text-[#1e293b]"
            >
              정산 계좌
            </h2>

            <div className="mt-3">
              <label
                htmlFor="contractor-settlement-bank"
                className="block text-[11px] font-bold text-[#1e293b]"
              >
                은행
              </label>

              <input
                id="contractor-settlement-bank"
                type="text"
                value={settlementInformation.bank}
                aria-invalid={Boolean(errors.bank)}
                aria-describedby={
                  errors.bank
                    ? 'contractor-settlement-bank-error'
                    : undefined
                }
                onChange={(event) =>
                  updateField('bank', event.target.value)
                }
                className={inputClassName(
                  Boolean(errors.bank),
                )}
              />

              {errors.bank ? (
                <p
                  id="contractor-settlement-bank-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
                >
                  {errors.bank}
                </p>
              ) : null}
            </div>

            <div className="mt-3">
              <label
                htmlFor="contractor-settlement-holder"
                className="block text-[11px] font-bold text-[#1e293b]"
              >
                예금주
              </label>

              <input
                id="contractor-settlement-holder"
                type="text"
                value={settlementInformation.accountHolder}
                aria-invalid={Boolean(
                  errors.accountHolder,
                )}
                aria-describedby={
                  errors.accountHolder
                    ? 'contractor-settlement-holder-error'
                    : undefined
                }
                onChange={(event) =>
                  updateField(
                    'accountHolder',
                    event.target.value,
                  )
                }
                className={inputClassName(
                  Boolean(errors.accountHolder),
                )}
              />

              {errors.accountHolder ? (
                <p
                  id="contractor-settlement-holder-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
                >
                  {errors.accountHolder}
                </p>
              ) : null}
            </div>

            <div className="mt-3">
              <label
                htmlFor="contractor-settlement-account-number"
                className="block text-[11px] font-bold text-[#1e293b]"
              >
                계좌번호
              </label>

              <input
                id="contractor-settlement-account-number"
                type="text"
                inputMode="numeric"
                value={settlementInformation.accountNumber}
                aria-invalid={Boolean(
                  errors.accountNumber,
                )}
                aria-describedby={
                  errors.accountNumber
                    ? 'contractor-settlement-account-number-error'
                    : undefined
                }
                onChange={(event) =>
                  handleAccountNumberChange(
                    event.target.value,
                  )
                }
                className={inputClassName(
                  Boolean(errors.accountNumber),
                )}
              />

              {errors.accountNumber ? (
                <p
                  id="contractor-settlement-account-number-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
                >
                  {errors.accountNumber}
                </p>
              ) : null}
            </div>
          </section>

          <section
            className="mt-5"
            aria-labelledby="tax-invoice-title"
          >
            <h2
              id="tax-invoice-title"
              className="text-sm font-bold text-[#1e293b]"
            >
              세금계산서
            </h2>

            <div className="mt-3">
              <label
                htmlFor="contractor-tax-email"
                className="block text-[11px] font-bold text-[#1e293b]"
              >
                세금계산서 이메일
              </label>

              <input
                id="contractor-tax-email"
                type="email"
                value={settlementInformation.taxEmail}
                aria-invalid={Boolean(errors.taxEmail)}
                aria-describedby={
                  errors.taxEmail
                    ? 'contractor-tax-email-error'
                    : undefined
                }
                onChange={(event) =>
                  updateField(
                    'taxEmail',
                    event.target.value,
                  )
                }
                className={inputClassName(
                  Boolean(errors.taxEmail),
                )}
              />

              {errors.taxEmail ? (
                <p
                  id="contractor-tax-email-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-semibold text-[#dc2626]"
                >
                  {errors.taxEmail}
                </p>
              ) : null}
            </div>

            <div className="mt-3">
              <label
                htmlFor="contractor-business-registration-number"
                className="block text-[11px] font-bold text-[#1e293b]"
              >
                사업자등록번호
              </label>

              <input
                id="contractor-business-registration-number"
                type="text"
                value="123-45-67890"
                readOnly
                aria-readonly="true"
                className={`${inputClassName()} cursor-default`}
              />
            </div>

            <p className="mt-2 text-[11px] leading-4 text-[#64748b]">
              정산 완료 후 등록된 이메일로 세금계산서가
              발송됩니다.
            </p>
          </section>

          <button
            type="submit"
            className="mt-5 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
          >
            정산 정보 저장
          </button>
        </form>
      </main>

      <ContractorBottomNavigation />

      {showSavedToast ? (
        <button
          type="button"
          role="status"
          aria-live="polite"
          aria-label="정산 정보 저장 완료 안내 닫기"
          onClick={() => setShowSavedToast(false)}
          className="absolute bottom-[76px] left-1/2 z-40 flex h-11 w-[280px] -translate-x-1/2 items-center justify-center rounded-[10px] bg-[#0f172a] px-4 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <span className="text-xs font-bold text-white">
            정산 정보가 저장되었습니다.
          </span>
        </button>
      ) : null}
    </ContractorMobileShell>
  )
}