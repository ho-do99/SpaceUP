import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

interface MyPageActionCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
}

function MyPageActionCard({
  title,
  description,
  icon,
  onClick,
  disabled = false,
}: MyPageActionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      className="flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-[#2563eb]">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#1e293b]">
          {title}
        </span>

        <span className="mt-1 block text-[11px] leading-4 text-[#64748b]">
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

export default function ContractorMyPage() {
  const navigate = useNavigate()

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="마이페이지" />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <section
          className="flex min-h-[112px] items-center gap-4 rounded-[14px] border border-[#e2e8f0] bg-white p-4"
          aria-labelledby="contractor-profile-title"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h18" />
              <path d="M6 21V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v17" />
              <path d="M15 8h3a1 1 0 0 1 1 1v12" />
              <path d="M9 7h2" />
              <path d="M9 11h2" />
              <path d="M9 15h2" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="contractor-profile-title"
              className="truncate text-[15px] font-bold text-[#1e293b]"
            >
              ㈜스페이스 인테리어
            </h2>

            <p className="mt-1 text-xs text-[#64748b]">
              김현수 담당자
            </p>

            <span className="mt-2 inline-flex h-[22px] items-center rounded-full bg-[#eff6ff] px-2 text-[10px] font-bold text-[#2563eb]">
              승인 완료
            </span>
          </div>
        </section>

        <section className="mt-5" aria-labelledby="my-info-title">
          <h2
            id="my-info-title"
            className="mb-2 text-sm font-bold text-[#1e293b]"
          >
            내 정보 관리
          </h2>

          <div className="space-y-2.5">
            <MyPageActionCard
              title="계정 설정"
              description="비밀번호와 계정 보안 설정을 관리합니다."
              onClick={() => navigate('/contractor/settings/account')}
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

            <MyPageActionCard
              title="담당자 정보"
              description="담당자 이름과 연락처를 관리합니다."
              onClick={() => navigate('/contractor/settings/manager')}
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

            <MyPageActionCard
              title="업체 공개 설정"
              description="고객에게 공개할 업체 정보를 설정합니다."
              onClick={() => navigate('/contractor/settings/visibility')}
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
          </div>
        </section>

        <section className="mt-5" aria-labelledby="portfolio-title">
          <h2
            id="portfolio-title"
            className="mb-2 text-sm font-bold text-[#1e293b]"
          >
            포트폴리오 관리
          </h2>

          <div className="space-y-2.5">
            <MyPageActionCard
              title="포트폴리오 관리·수정"
              description="등록 12건 · 공개 10건"
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
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              }
            />

            <MyPageActionCard
              title="새 포트폴리오 등록"
              description="대표 이미지와 시공 사례를 새로 등록합니다."
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
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              }
            />
          </div>
        </section>

        <section className="mt-5" aria-labelledby="review-title">
          <h2
            id="review-title"
            className="mb-2 text-sm font-bold text-[#1e293b]"
          >
            고객 리뷰
          </h2>

          <MyPageActionCard
            title="받은 리뷰"
            description="평균 4.8 · 리뷰 24건"
            onClick={() => navigate('/contractor/reviews')}
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
                <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z" />
              </svg>
            }
          />
        </section>
      </main>

      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}