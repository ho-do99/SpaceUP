import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiClientError } from '@/api/axiosInstance'
import { getMember, resubmitMemberApplication } from '@/api/memberApi'
import { SignupAppBar, SignupPage, SignupStepper, signupPrimaryButtonClass } from '@/components/signup/SignupUi'
import type { MemberResponse } from '@/types/member'
import { getMemberId } from '@/utils/authSession'

const steps = [
  { label: '계정' }, { label: '휴대폰' }, { label: '업체/시공' },
  { label: '사업자' }, { label: '심사' }, { label: '완료' },
]

function formatDateTime(value: string | null) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16).replace(/-/g, '.')
}

export function ContractorSignupStatusView({
  member,
  isResubmitting = false,
  errorMessage = '',
  onBack,
  onEdit,
  onResubmit,
  onStart,
}: {
  member: MemberResponse
  isResubmitting?: boolean
  errorMessage?: string
  onBack: () => void
  onEdit: () => void
  onResubmit: () => void
  onStart: () => void
}) {
  if (member.approvalStatus === 'APPROVED') {
    return (
      <SignupPage>
        <SignupAppBar title="승인 완료" showBack={false} />
        <section className="flex min-h-[796px] flex-col gap-3 overflow-y-auto bg-white px-4 pb-6 pt-4">
          <p className="text-xs leading-[17px] text-[#64748b]">SpaceUP 시공사 파트너 등록이 완료되었습니다.</p>
          <SignupStepper steps={steps} current={6} completed={[1, 2, 3, 4, 5]} />
          <div className="mt-1 flex min-h-[180px] flex-col items-center justify-center rounded-xl bg-[#eaf8f1] text-center">
            <span className="text-5xl text-[#16a36f]">✓</span>
            <h2 className="mt-5 text-[18px] font-bold leading-7 text-[#0b2b59]">파트너 승인이 완료되었습니다</h2>
            <p className="mt-2 text-xs text-[#64748b]">이제 신규 의뢰 확인과 견적 제안이 가능합니다.</p>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 text-xs leading-[17px] text-[#64748b]">
            <h3 className="text-sm font-bold text-[#16a36f]">승인 정보</h3>
            <p>승인번호 {member.approvalNumber || '-'}</p>
            <p>승인일 {formatDateTime(member.createdAt).slice(0, 10)}</p>
            <p>영업 상태 · 정상</p>
          </div>
          <button type="button" className={signupPrimaryButtonClass} onClick={onStart}>대시보드 시작</button>
        </section>
      </SignupPage>
    )
  }

  if (member.approvalStatus === 'NEEDS_REVISION') {
    return (
      <SignupPage>
        <SignupAppBar title="보완 요청" onBack={onBack} />
        <section className="flex min-h-[796px] flex-col gap-3 overflow-y-auto bg-white px-4 pb-6 pt-4">
          <p className="text-xs leading-[17px] text-[#64748b]">심사 담당자가 요청한 내용을 수정해 주세요.</p>
          <SignupStepper steps={steps} current={5} completed={[]} />
          <div className="mt-1 flex min-h-[150px] flex-col items-center justify-center rounded-xl bg-[#fff6e3] text-center">
            <span className="text-5xl font-bold text-[#f59e0b]">!</span>
            <h2 className="mt-5 text-[18px] font-bold leading-7 text-[#0b2b59]">심사 단계에서 보완이 필요합니다</h2>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 text-xs leading-[17px] text-[#64748b]">
            <h3 className="text-sm font-bold text-[#ef4444]">보완 요청 사항</h3>
            <p className="whitespace-pre-wrap">{member.revisionMessage || '보완 요청 내용을 확인해 주세요.'}</p>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 text-xs leading-[17px] text-[#64748b]">
            <h3 className="text-sm font-bold text-[#f59e0b]">제출 기한</h3>
            <p>{formatDateTime(member.revisionDeadline)}까지</p>
          </div>
          {errorMessage && <p role="alert" className="text-xs text-[#ef4444]">{errorMessage}</p>}
          <button type="button" className="h-12 rounded-lg border border-[#e2e8f0] bg-white text-sm font-bold text-[#0b2b59]" onClick={onEdit}>신청 정보 수정</button>
          <button type="button" disabled={isResubmitting} className={signupPrimaryButtonClass} onClick={onResubmit}>{isResubmitting ? '재제출 중...' : '보완 자료 재제출'}</button>
        </section>
      </SignupPage>
    )
  }

  return (
    <SignupPage>
      <SignupAppBar title="심사 대기" onBack={onBack} />
      <section className="flex min-h-[796px] flex-col gap-3 overflow-y-auto bg-white px-4 pb-6 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">제출한 입점 신청을 검토하고 있습니다.</p>
        <SignupStepper steps={steps} current={5} completed={[]} />
        <div className="mt-1 flex min-h-[150px] flex-col items-center justify-center rounded-xl bg-[#eff6ff] text-center">
          <span className="text-5xl text-[#2563eb]">◷</span>
          <h2 className="mt-5 text-[18px] font-bold leading-7 text-[#0b2b59]">입점 심사 중입니다</h2>
        </div>
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 text-xs leading-[17px] text-[#64748b]">
          <h3 className="text-sm font-bold text-[#0b2b59]">신청 정보</h3>
          <p>신청번호 {member.applicationNumber || '-'}</p>
          <p>제출 {formatDateTime(member.createdAt)}</p>
          <p>예상 처리 2~3영업일</p>
        </div>
        <div className="rounded-xl border border-[#f4d99a] bg-[#fff6e3] p-3.5 text-xs leading-[17px] text-[#64748b]">
          <h3 className="text-sm font-bold text-[#f59e0b]">심사 상태</h3>
          <p>작성 중 → 제출 완료 → 심사 중</p>
        </div>
      </section>
    </SignupPage>
  )
}

export default function ContractorSignupStatusPage() {
  const navigate = useNavigate()
  const [member, setMember] = useState<MemberResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isResubmitting, setIsResubmitting] = useState(false)

  useEffect(() => {
    const memberId = getMemberId()
    if (!memberId) {
      setErrorMessage('회원 정보를 확인하려면 로그인해 주세요.')
      return
    }
    getMember(memberId).then(setMember).catch((error: unknown) => {
      setErrorMessage(error instanceof ApiClientError ? error.message : '심사 상태를 불러오지 못했습니다.')
    })
  }, [])

  const handleResubmit = async () => {
    if (isResubmitting) return
    setIsResubmitting(true)
    setErrorMessage('')
    try {
      await resubmitMemberApplication()
      const memberId = getMemberId()
      if (memberId) setMember(await getMember(memberId))
    } catch (error: unknown) {
      setErrorMessage(error instanceof ApiClientError ? error.message : '보완 자료 재제출에 실패했습니다.')
    } finally {
      setIsResubmitting(false)
    }
  }

  if (!member) {
    return (
      <SignupPage>
        <SignupAppBar title="심사 상태" onBack={() => navigate('/login')} />
        <div className="px-4 py-6 text-center text-xs text-[#64748b]" role={errorMessage ? 'alert' : 'status'}>{errorMessage || '심사 상태를 불러오고 있습니다.'}</div>
      </SignupPage>
    )
  }

  return <ContractorSignupStatusView member={member} errorMessage={errorMessage} isResubmitting={isResubmitting} onBack={() => navigate('/login')} onEdit={() => navigate('/signup/contractor')} onResubmit={handleResubmit} onStart={() => navigate('/contractor')} />
}
