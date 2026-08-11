import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmailChangeDialog from '@/components/contractor/ContractorEmailChangeDialog'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { getMember } from '@/api/memberApi'
import { getMemberId } from '@/utils/authSession'

interface AccountInformationRowProps {
  label: string
  value: string
  actionLabel?: string
  actionDisabled?: boolean
  onAction?: () => void
}

function AccountInformationRow({
  label,
  value,
  actionLabel,
  actionDisabled = false,
  onAction,
}: AccountInformationRowProps) {
  return (
    <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[#e2e8f0] py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-[#64748b]">
          {label}
        </p>

        <p className="mt-1 break-all text-[13px] font-bold text-[#1e293b]">
          {value}
        </p>
      </div>

      {actionLabel ? (
        <button
          type="button"
          disabled={actionDisabled}
          aria-disabled={actionDisabled}
          onClick={onAction}
          className="shrink-0 rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-[11px] font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export default function ContractorAccountSettingsPage() {
  const [loginEmail, setLoginEmail] = useState(
    'contractor@spaceup.co.kr',
  )
  const [phoneNumber, setPhoneNumber] = useState('010-1234-5678')
  const [accountError, setAccountError] = useState('')
  const [newDeviceLoginAlert, setNewDeviceLoginAlert] =
    useState(true)
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const [showEmailChangedMessage, setShowEmailChangedMessage] =
    useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] =
    useState(false)

  const handleCloseEmailDialog = useCallback(() => {
    setIsEmailDialogOpen(false)
  }, [])

  useEffect(() => {
    const memberId = getMemberId()
    if (!memberId) {
      setAccountError('로그인 정보가 없습니다.')
      return
    }

    getMember(memberId).then((member) => {
      setLoginEmail(member.email)
      setPhoneNumber(member.phoneNumber)
    }).catch((error) => {
      setAccountError(error instanceof Error ? error.message : '계정 정보를 불러오지 못했습니다.')
    })
  }, [])

  const handleEmailChangeComplete = useCallback(
    async (email: string) => {
      void email
      throw new Error('이메일 인증 API 계약이 없어 변경을 진행할 수 없습니다.')
    },
    [],
  )

  const handleToggleNewDeviceAlert = () => {
    setNewDeviceLoginAlert((current) => !current)
    setShowSavedMessage(false)
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="계정 설정" back />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">
          로그인 정보와 계정 보안 설정을 관리하세요.
        </p>

        <ContractorSectionCard
          className="mt-4"
          title="로그인 정보"
        >
          <AccountInformationRow
            label="로그인 이메일"
            value={loginEmail}
            actionLabel="이메일 변경"
            onAction={() => {
              setShowEmailChangedMessage(false)
              setIsEmailDialogOpen(true)
            }}
          />

          <AccountInformationRow
            label="휴대폰 번호"
            value={phoneNumber}
          />

          <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#f0fdf4] px-3 py-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-[#16a34a]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>

            <p className="text-[11px] font-semibold text-[#15803d]">
              휴대폰 인증이 완료되었습니다.
            </p>
          </div>
        </ContractorSectionCard>

        {accountError ? <p role="alert" className="mt-3 text-xs font-semibold text-[#dc2626]">{accountError}</p> : null}

        <ContractorSectionCard
          className="mt-3"
          title="비밀번호"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#1e293b]">
                비밀번호 변경
              </p>

              <p className="mt-1 text-[11px] leading-4 text-[#64748b]">
                마지막 변경일 2026.07.01
              </p>
            </div>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="shrink-0 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[11px] font-bold text-[#94a3b8] disabled:cursor-not-allowed"
            >
              변경
            </button>
          </div>
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-3"
          title="보안 알림"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#1e293b]">
                새로운 기기 로그인 알림
              </p>

              <p className="mt-1 break-words text-[11px] leading-4 text-[#64748b]">
                새로운 기기에서 로그인하면 알림으로 안내합니다.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={newDeviceLoginAlert}
              aria-label="새로운 기기 로그인 알림"
              onClick={handleToggleNewDeviceAlert}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                newDeviceLoginAlert
                  ? 'bg-[#2563eb]'
                  : 'bg-[#cbd5e1]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  newDeviceLoginAlert
                    ? 'translate-x-[22px]'
                    : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <p
            className="mt-3 text-[11px] font-semibold text-[#64748b]"
            aria-live="polite"
          >
            현재 상태:{' '}
            {newDeviceLoginAlert ? '사용 중' : '사용 안 함'}
          </p>
        </ContractorSectionCard>

        {showSavedMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-2.5"
          >
            <p className="text-xs font-semibold text-[#1d4ed8]">
              계정 설정을 저장했습니다.
            </p>

            <button
              type="button"
              aria-label="저장 안내 닫기"
              onClick={() => setShowSavedMessage(false)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
            >
              닫기
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setShowSavedMessage(true)
            setShowEmailChangedMessage(false)
          }}
          className="mt-4 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
        >
          설정 저장
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="mt-3 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white text-sm font-bold text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-70"
        >
          로그아웃
        </button>

        <Link
          to="/contractor/settings/withdrawal"
          className="mt-3 flex h-12 w-full items-center justify-center rounded-lg border border-[#e5484d] bg-white text-sm font-bold text-[#e5484d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5484d]"
        >
          회원 탈퇴
        </Link>
      </main>

      <ContractorBottomNavigation />

      {showEmailChangedMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-[76px] left-4 right-4 z-40 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#1e293b] px-4 py-3 shadow-lg"
        >
          <p className="text-xs font-semibold text-white">
            로그인 이메일이 변경되었습니다.
          </p>

          <button
            type="button"
            aria-label="이메일 변경 완료 안내 닫기"
            onClick={() => setShowEmailChangedMessage(false)}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            닫기
          </button>
        </div>
      ) : null}

      <ContractorEmailChangeDialog
        isOpen={isEmailDialogOpen}
        currentEmail={loginEmail}
        onClose={handleCloseEmailDialog}
        onComplete={handleEmailChangeComplete}
      />
    </ContractorMobileShell>
  )
}
