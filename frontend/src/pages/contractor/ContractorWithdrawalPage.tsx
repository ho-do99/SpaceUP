import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorWithdrawalConfirmDialog from '@/components/contractor/ContractorWithdrawalConfirmDialog'
import { deleteMember } from '@/api/memberApi'
import { clearAuthSession, getMemberId } from '@/utils/authSession'

const withdrawalReasons = [
  '더 이상 서비스를 이용하지 않아요',
  '원하는 의뢰가 충분하지 않아요',
  '서비스 이용이 불편해요',
  '알림이나 연락이 너무 많아요',
  '기타',
] as const

type WithdrawalReason =
  (typeof withdrawalReasons)[number]

const withdrawalChecklist = [
  {
    title: '진행 중 계약',
    description: '0건',
    status: '탈퇴 가능',
    statusType: 'available',
  },
  {
    title: '정산 대기',
    description: '0건',
    status: '탈퇴 가능',
    statusType: 'available',
  },
  {
    title: '등록 포트폴리오',
    description: '12건',
    status: '탈퇴 후 비공개',
    statusType: 'neutral',
  },
  {
    title: '리뷰 및 거래 기록',
    description: 'SpaceUP 운영 정책 적용',
    status: '정책에 따라 보관',
    statusType: 'neutral',
  },
] as const

export default function ContractorWithdrawalPage() {
  const navigate = useNavigate()

  const scrollContainerRef =
    useRef<HTMLElement>(null)

  const [selectedReason, setSelectedReason] =
    useState<WithdrawalReason>(
      '더 이상 서비스를 이용하지 않아요',
    )

  const [currentPassword, setCurrentPassword] =
    useState('1234567890')

  const [showPassword, setShowPassword] =
    useState(false)

  const [agreed, setAgreed] = useState(true)

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  useEffect(() => {
    const previousBodyOverflow =
      document.body.style.overflow

    const previousHtmlOverflow =
      document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })

    return () => {
      document.body.style.overflow =
        previousBodyOverflow

      document.documentElement.style.overflow =
        previousHtmlOverflow
    }
  }, [])

  const isWithdrawalDisabled =
    currentPassword.trim().length === 0 ||
    !agreed ||
    isSubmitting

  const handleReasonSelect = (
    reason: WithdrawalReason,
  ) => {
    const currentScrollTop =
      scrollContainerRef.current?.scrollTop ?? 0

    setSelectedReason(reason)

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          currentScrollTop
      }
    })
  }

  const handleConfirmWithdrawal = async () => {
    if (isSubmitting) return

    const memberId = getMemberId()
    if (!memberId) {
      setDialogOpen(false)
      setSubmitError('로그인이 만료되었습니다. 다시 로그인해 주세요.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await deleteMember(memberId)
      clearAuthSession()
      setDialogOpen(false)
      navigate('/contractor/settings/withdrawal/completed')
    } catch (error) {
      setDialogOpen(false)
      setSubmitError(
        error instanceof Error
          ? error.message
          : '회원탈퇴에 실패했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0 overflow-hidden">
      <ContractorAppBar
        title="회원탈퇴"
        back
      />

      <main
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-5"
      >
        <section>
          <h1 className="text-[22px] font-bold leading-8 text-[#1e293b]">
            회원탈퇴
          </h1>

          <p className="mt-1.5 text-xs leading-5 text-[#64748b]">
            탈퇴 전 아래 내용을 반드시
            확인해주세요.
          </p>
        </section>

        <section className="mt-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4">
          <div className="flex items-center gap-[10px]">
            <span
              aria-hidden="true"
              className="text-[22px] leading-6 text-[#ef4444]"
            >
              ⚠
            </span>

            <h2 className="text-[15px] font-bold leading-[22px] text-[#b91c1c]">
              탈퇴한 계정은 복구할 수
              없습니다.
            </h2>
          </div>

          <p className="mt-[10px] text-xs leading-5 text-[#7f1d1d]">
            회원탈퇴가 완료되면 업체 정보와 계정
            접근이 제한되며, 다시 로그인할 수
            없습니다.
          </p>
        </section>

        <section
          className="mt-4"
          aria-labelledby="withdrawal-checklist-title"
        >
          <h2
            id="withdrawal-checklist-title"
            className="text-[15px] font-bold leading-6 text-[#1e293b]"
          >
            탈퇴 전 확인
          </h2>

          <div className="mt-2 rounded-xl border border-[#e2e8f0] bg-white px-4">
            {withdrawalChecklist.map(
              (item, index) => (
                <div
                  key={item.title}
                  className={`flex min-h-[53px] items-center justify-between gap-2 ${
                    index <
                    withdrawalChecklist.length - 1
                      ? 'border-b border-[#e2e8f0]'
                      : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-5 text-[#1e293b]">
                      {item.title}
                    </p>

                    <p className="mt-0.5 text-[11px] leading-[18px] text-[#64748b]">
                      {item.description}
                    </p>
                  </div>

                  <span
                    className={`flex h-6 min-w-[123px] shrink-0 items-center justify-center rounded-full px-3 text-[10px] font-medium ${
                      item.statusType ===
                      'available'
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : 'bg-[#f8fafc] text-[#64748b]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ),
            )}
          </div>

          <p className="mt-2 text-[11px] leading-[19px] text-[#64748b]">
            탈퇴 후 업체 정보와 포트폴리오는
            비공개 처리됩니다.
            <br />
            계약·정산·리뷰 등 거래 관련 기록은
            SpaceUP 운영 정책에 따라 일정 기간
            보관될 수 있습니다.
          </p>

          <p className="mt-2 text-[10px] leading-[18px] text-[#64748b]">
            ※ 진행 중 계약 또는 정산 대기가 있으면
            탈퇴할 수 없습니다.
            <br />
            계약·정산 처리를 완료한 뒤 다시
            시도해주세요.
          </p>
        </section>

        <section
          className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-4"
          aria-labelledby="withdrawal-reason-title"
        >
          <h2
            id="withdrawal-reason-title"
            className="text-[15px] font-bold leading-6 text-[#1e293b]"
          >
            탈퇴 사유
          </h2>

          <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
            더 나은 서비스 개선을 위해 탈퇴
            사유를 선택해주세요.
          </p>

          <div
            className="mt-2"
            role="radiogroup"
            aria-labelledby="withdrawal-reason-title"
          >
            {withdrawalReasons.map((reason) => {
              const isSelected =
                selectedReason === reason

              return (
                <button
                  key={reason}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    handleReasonSelect(reason)
                  }
                  className="flex h-11 w-full items-center gap-[10px] rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-[#2563eb]'
                        : 'border-[#cbd5e1]'
                    }`}
                  >
                    {isSelected ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                    ) : null}
                  </span>

                  <span className="text-xs leading-5 text-[#334155]">
                    {reason}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section
          className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-4"
          aria-labelledby="withdrawal-password-title"
        >
          <h2
            id="withdrawal-password-title"
            className="text-[15px] font-bold leading-6 text-[#1e293b]"
          >
            비밀번호 확인
          </h2>

          <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
            본인 확인을 위해 현재 비밀번호를
            입력해주세요.
          </p>

          <div className="relative mt-2">
            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
              aria-label="현재 비밀번호"
              className="h-[52px] w-full rounded-[10px] border border-[#cbd5e1] bg-white px-[13px] pr-12 text-sm text-[#1e293b] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
            />

            <button
              type="button"
              aria-label={
                showPassword
                  ? '비밀번호 숨기기'
                  : '비밀번호 표시하기'
              }
              onClick={() =>
                setShowPassword(
                  (current) => !current,
                )
              }
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-base text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
            >
              ◉
            </button>
          </div>
        </section>

        <button
          type="button"
          role="checkbox"
          aria-checked={agreed}
          onClick={() =>
            setAgreed((current) => !current)
          }
          className="mt-4 flex min-h-[72px] w-full items-center gap-[10px] rounded-xl border border-[#e2e8f0] bg-white px-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
        >
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
              agreed
                ? 'bg-[#2563eb] text-white'
                : 'border border-[#cbd5e1] bg-white text-transparent'
            }`}
          >
            ✓
          </span>

          <span className="text-xs leading-5 text-[#334155]">
            위 내용을 모두 확인했으며 회원탈퇴에
            동의합니다.
          </span>
        </button>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-20 h-[67px] border-t border-[#e2e8f0] bg-white px-4 pt-[9px]">
        {submitError ? (
          <p role="alert" className="absolute bottom-full left-4 right-4 mb-2 rounded-lg bg-[#fef2f2] px-3 py-2 text-xs font-semibold text-[#b91c1c]">
            {submitError}
          </p>
        ) : null}
        <button
          type="button"
          disabled={isWithdrawalDisabled}
          onClick={() => setDialogOpen(true)}
          className="h-12 w-full rounded-[10px] bg-[#ef4444] text-[15px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dc2626] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? '처리 중...' : '회원탈퇴'}
        </button>
      </footer>

      <ContractorWithdrawalConfirmDialog
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        onConfirm={handleConfirmWithdrawal}
      />
    </ContractorMobileShell>
  )
}
