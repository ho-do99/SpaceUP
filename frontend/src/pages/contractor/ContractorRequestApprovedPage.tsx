import { Link, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'

export default function ContractorRequestApprovedPage() {
  const { requestId } = useParams()
  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)

  if (!request) return <ContractorRequestNotFound />

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="의뢰 승인 완료" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">의뢰 승인과 동시에 이 의뢰 전용 실시간 채팅방이 개설됩니다.</p>
        <section className="mt-3 rounded-xl bg-[#eaf8f1] p-[14px]">
          <span aria-hidden="true" className="text-[30px] leading-[34px] text-[#12a66a]">✓</span>
          <h2 className="mt-2 text-[17px] font-bold leading-6 text-[#0b2b59]">의뢰 승인 · 채팅방 개설 완료</h2>
          <p className="mt-1 text-xs font-bold text-[#12a66a]">현재 상태: 사용자와 채팅 가능</p>
        </section>
        <ContractorSectionCard className="mt-3 p-[14px] shadow-none" title="의뢰 정보">
          <p className="text-[11px] leading-[17px] text-[#64748b]">{request.customerName} · {request.property.region}</p>
          <p className="text-[11px] leading-[17px] text-[#64748b]">연락처 계약 전 마스킹</p>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3 border-[#d6e5f8] bg-[#eff6ff] p-[14px] shadow-none" title="7일 자동 취소 정책">
          <ul className="text-[11px] leading-[17px] text-[#64748b]">
            <li>의뢰 승인 시 lastActivityAt을 시작합니다.</li>
            <li>마지막 활동 후 144시간: D-1 알림</li>
            <li>마지막 활동 후 168시간: 자동 취소</li>
          </ul>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">채팅에서 방문 일정을 조율하고 실제 현장 방문을 완료해야 견적서 작성이 활성화됩니다.</p>
        </ContractorSectionCard>
        <Link to={`/contractor/requests/${request.requestId}/chat`} className="mt-3 flex h-12 w-full items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white">실시간 채팅 시작</Link>
      </main>
    </ContractorMobileShell>
  )
}
