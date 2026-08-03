import { Link, useLocation, useNavigate } from 'react-router-dom'
import requestCompleteIcon from '@/assets/user/icons/request-complete.svg'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

interface RequestCompleteNavigationState {
  contractorId: string
  contractorName: string
  budget: string
  preferredDate: string
}

function getCompleteNavigationState(state: unknown): RequestCompleteNavigationState | null {
  if (!state || typeof state !== 'object') return null

  const candidate = state as Record<string, unknown>
  if (
    typeof candidate.contractorId !== 'string' ||
    typeof candidate.contractorName !== 'string' ||
    typeof candidate.budget !== 'string' ||
    typeof candidate.preferredDate !== 'string'
  ) {
    return null
  }

  return {
    contractorId: candidate.contractorId,
    contractorName: candidate.contractorName,
    budget: candidate.budget,
    preferredDate: candidate.preferredDate,
  }
}

export default function EstimateRequestCompletePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const submittedRequest = getCompleteNavigationState(location.state as unknown)

  const details = [
    ['시공사', submittedRequest?.contractorName ?? '공간디자인 인테리어'],
    ['요청 항목', '10 견적 요청 완료'],
    ['예산', submittedRequest?.budget ?? '1,500만원'],
    ['희망 일정', submittedRequest?.preferredDate || '2025-07-15'],
    ['요청 일시', '2025-05-20 14:30'],
  ] as const

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="견적 요청 완료" onBack={() => navigate('/estimate/request')} />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px] pb-8 pt-4">
          <div className="mx-auto flex size-[72px] items-center justify-center rounded-full bg-[#e8f1ff]">
            <img src={requestCompleteIcon} alt="" className="size-[42px]" />
          </div>

          <section className="pt-7 text-center" aria-labelledby="request-complete-title">
            <h1 id="request-complete-title" className="text-[18px] font-bold leading-[22px] text-[#15284c]">
              견적 요청이 완료되었습니다!
            </h1>
            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              선택한 시공사에 견적 요청이 정상적으로 전달되었습니다. 빠른 시일 내에 연락드릴 예정입니다.
            </p>
          </section>

          <section className="mt-12 rounded-[7px] border border-[#d5dfed] bg-[#fbfcfe] p-4">
            <h2 className="text-[11px] font-bold leading-[13px] text-[#15284c]">요청 정보</h2>
            <dl className="mt-[9px] text-[10px] leading-[25px]">
              {details.map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-3">
                  <dt className="text-[#657187]">{label}</dt>
                  <dd className="min-w-0 break-words text-right text-[#17233a]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </main>

        <footer className="grid shrink-0 grid-cols-2 gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Link
            to="/"
            className="flex h-[45px] items-center justify-center rounded-[5px] border border-[#2563eb] bg-white text-[12px] font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            메인으로 이동
          </Link>
          <Link
            to="/mypage/requests"
            className="flex h-[45px] items-center justify-center rounded-[5px] border border-[#2563eb] bg-[#2563eb] text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            요청 내역 보기
          </Link>
        </footer>
      </div>
    </UserScreenShell>
  )
}
