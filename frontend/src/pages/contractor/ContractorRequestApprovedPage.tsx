import { Link, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'

export default function ContractorRequestApprovedPage() {
  const { requestId } = useParams()
  const request = findContractorRequestDetail(requestId)

  if (!request) return <ContractorRequestNotFound />

  return (
    <ContractorMobileShell>
      <ContractorAppBar title="의뢰 승인 완료" back />
      <main className="flex-1 space-y-4 px-4 pb-5 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">의뢰 승인과 동시에 이 의뢰 전용 실시간 채팅방이 개설됩니다.</p>
        <section className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-5 text-center">
          <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e] text-2xl font-bold text-white">✓</span>
          <h2 className="mt-3 text-base font-bold text-[#166534]">의뢰 승인 · 채팅방 개설 완료</h2>
          <p className="mt-1 text-xs text-[#15803d]">현재 상태: 사용자와 채팅 가능</p>
        </section>
        <ContractorSectionCard>
          <p className="text-sm font-bold text-[#2563eb]">{request.requestId} · {request.property.region}</p>
          <p className="mt-2 text-xs text-[#64748b]">사용자 {request.customerName} · 연락처 계약 전 마스킹</p>
        </ContractorSectionCard>
        <ContractorSectionCard title="7일 자동 취소 정책">
          <ul className="space-y-2 text-xs leading-5 text-[#64748b]">
            <li>의뢰 승인 시 마지막 활동 시간이 시작됩니다.</li>
            <li>144시간 경과 시 D-1 알림을 제공합니다.</li>
            <li>168시간 동안 활동이 없으면 자동 취소됩니다.</li>
          </ul>
          <p className="mt-3 rounded-lg bg-[#eff6ff] p-3 text-[11px] font-semibold leading-4 text-[#2563eb]">채팅에서 방문 일정을 조율하고 실제 현장 방문을 완료해야 견적서 작성이 활성화됩니다.</p>
        </ContractorSectionCard>
        <button type="button" disabled aria-disabled="true" title="실시간 채팅은 2차 개발 예정입니다" className="h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55">실시간 채팅 시작</button>
        <Link to="/contractor/requests" className="flex h-11 items-center justify-center rounded-lg border border-[#2563eb] text-sm font-bold text-[#2563eb]">의뢰 목록으로 돌아가기</Link>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
