import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import {
  contractorDefaultVisitSchedule,
  findContractorRequestDetail,
} from '@/mocks/contractorPortalMockData'

import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'

export default function ContractorEstimateReadyPage() {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()

  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)

  const {
    visitSchedule,
    visitStatus,
  } = useContractorPortalFlow()

  if (!request) {
    return <ContractorRequestNotFound />
  }

  const isCompletedView =
    searchParams.get('mode') === 'completed'

  if (
    !isCompletedView &&
    visitStatus !== 'COMPLETED'
  ) {
    return (
      <Navigate
        to={`/contractor/requests/${request.requestId}/visit`}
        replace
      />
    )
  }

  const schedule =
    visitStatus === 'COMPLETED' &&
    visitSchedule
      ? visitSchedule
      : {
          ...contractorDefaultVisitSchedule,
          address: request.property.address,
          note:
            '바닥 상태와 벽지 교체를 위한 치수를 확인했습니다.',
          completedAt: '2026-07-24 15:00',
        }

  return (
    <ContractorMobileShell>
      <ContractorAppBar
        title="견적서 작성"
        back
      />

      <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-4">
        <section className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-[#047857]">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl"
          >
            ✓
          </span>

          <h2 className="mt-3 text-base font-bold">
            현장 방문을 완료했습니다
          </h2>

          <p className="mt-1 text-xs leading-5">
            확인한 현장 정보로 견적 작성을 시작할
            수 있습니다.
          </p>
        </section>

        <ContractorSectionCard
          className="mt-4"
          title="의뢰 정보"
        >
          <p className="text-sm font-bold text-[#2563eb]">
            {request.requestId}
          </p>

          <p className="mt-2 text-xs text-[#64748b]">
            {request.customerName} ·{' '}
            {request.property.propertyType}{' '}
            {request.property.areaLabel}
          </p>

          <p className="mt-1 break-words text-xs leading-5 text-[#64748b]">
            {request.property.address}
          </p>
        </ContractorSectionCard>

        <ContractorSectionCard
          className="mt-3"
          title="현장 방문 결과"
        >
          <p className="text-xs text-[#64748b]">
            방문일{' '}
            {schedule.date.replace(/-/g, '.')} ·{' '}
            {schedule.time}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#64748b]">
            {schedule.note ||
              '현장 상태와 시공 범위를 확인했습니다.'}
          </p>
        </ContractorSectionCard>

        <p className="mt-4 rounded-lg bg-[#eff6ff] p-3 text-xs leading-5 text-[#2563eb]">
          견적 항목과 금액을 확인한 뒤 견적 작성
          단계에서 제안서를 준비할 수 있습니다.
        </p>

        <Link
          to={`/contractor/requests/${request.requestId}/estimate?mode=completed`}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
        >
          견적서 작성
        </Link>

        <Link
          to={`/contractor/requests/${request.requestId}/chat/completed`}
          className="mt-2 flex h-11 items-center justify-center rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
        >
          방문 완료 채팅으로 돌아가기
        </Link>
      </main>
    </ContractorMobileShell>
  )
}
