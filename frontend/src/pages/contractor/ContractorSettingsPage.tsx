import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorLogoutDialog from '@/components/contractor/ContractorLogoutDialog'
import { clearAuthSession } from '@/utils/authSession'
import { clearRequestFlow } from '@/utils/requestFlow'

interface SettingsMenuCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
}

function SettingsMenuCard({
  title,
  description,
  icon,
  onClick,
  disabled = false,
}: SettingsMenuCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      className="flex min-h-[68px] w-full items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-[#2563eb]">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#1e293b]">
          {title}
        </span>

        <span className="mt-1 block break-words text-[11px] leading-4 text-[#64748b]">
          {description}
        </span>
      </span>

      {!disabled ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-[#94a3b8]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      ) : null}
    </button>
  )
}

export default function ContractorSettingsPage() {
  const navigate = useNavigate()

  const [showSavedMessage, setShowSavedMessage] =
    useState(false)

  const [logoutDialogOpen, setLogoutDialogOpen] =
    useState(false)

  const handleLogout = () => {
    setLogoutDialogOpen(false)
    clearAuthSession()
    clearRequestFlow()
    navigate('/login', { replace: true })
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="설정" />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">
          계정과 알림, 업체 공개 설정을 관리하세요.
        </p>

        <section
          className="mt-4 space-y-2.5"
          aria-label="설정 메뉴"
        >
          <SettingsMenuCard
            title="계정 설정"
            description="로그인 이메일 · 비밀번호 변경"
            onClick={() =>
              navigate(
                '/contractor/settings/account',
              )
            }
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            }
          />

          <SettingsMenuCard
            title="담당자 정보"
            description="담당자명 · 연락처 · 이메일"
            onClick={() =>
              navigate(
                '/contractor/settings/manager',
              )
            }
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="8" r="4" />
                <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
                <path d="M19 8v6" />
                <path d="M16 11h6" />
              </svg>
            }
          />

          <SettingsMenuCard
            title="알림 설정"
            description="신규 의뢰 · 견적 상태 · 계약 · 일정 · 정산"
            disabled
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            }
          />

          <SettingsMenuCard
            title="이메일 수신 설정"
            description="운영 요약 메일 · 마케팅 수신"
            disabled
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                />
                <path d="m3 7 9 6 9-6" />
              </svg>
            }
          />

          <SettingsMenuCard
            title="업체 공개 설정"
            description="프로필 공개 · 포트폴리오 공개 · 리뷰 공개"
            onClick={() =>
              navigate(
                '/contractor/settings/visibility',
              )
            }
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          />
        </section>

        {showSavedMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-2.5"
          >
            <p className="text-xs font-semibold text-[#1d4ed8]">
              설정을 저장했습니다.
            </p>

            <button
              type="button"
              aria-label="저장 안내 닫기"
              onClick={() =>
                setShowSavedMessage(false)
              }
              className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
            >
              닫기
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() =>
            setShowSavedMessage(true)
          }
          className="mt-4 h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
        >
          설정 저장
        </button>

        <button
          type="button"
          onClick={() =>
            setLogoutDialogOpen(true)
          }
          className="mt-3 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white text-sm font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
        >
          로그아웃
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              '/contractor/settings/withdrawal',
            )
          }
          className="mt-3 h-12 w-full rounded-lg border border-[#e5484d] bg-white text-sm font-bold text-[#e5484d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e5484d]"
        >
          회원 탈퇴
        </button>
      </main>

      <ContractorBottomNavigation />

      <ContractorLogoutDialog
        open={logoutDialogOpen}
        onCancel={() =>
          setLogoutDialogOpen(false)
        }
        onConfirm={handleLogout}
      />
    </ContractorMobileShell>
  )
}
