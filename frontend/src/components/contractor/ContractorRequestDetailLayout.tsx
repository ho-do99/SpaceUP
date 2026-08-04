import type { ReactNode } from 'react'
import ContractorAppBar from './ContractorAppBar'
import ContractorBottomNavigation from './ContractorBottomNavigation'
import ContractorMobileShell from './ContractorMobileShell'
import ContractorSectionCard from './ContractorSectionCard'
import ContractorTabNavigation from './ContractorTabNavigation'
import type { ContractorRequestDetail, ContractorRequestDetailTab } from '@/types/contractorPortal'

interface ContractorRequestDetailLayoutProps {
  request: ContractorRequestDetail
  activeTab: ContractorRequestDetailTab
  children: ReactNode
  actions: ReactNode
  statusMessage?: string
}
export default function ContractorRequestDetailLayout({ request, activeTab, children, actions, statusMessage }: ContractorRequestDetailLayoutProps) {
  return (
    <ContractorMobileShell>
      <ContractorAppBar title="의뢰 상세" back />
      <main className="flex-1 px-4 pb-4 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">의뢰를 승인하면 실시간 채팅방이 자동 개설됩니다. 사용자와 방문 일정을 조율하고 실제 현장을 확인한 뒤 견적을 작성할 수 있습니다.</p>
        <ContractorSectionCard className="mt-3">
          <p className="text-sm font-bold text-[#2563eb]">{request.requestId}</p>
          <p className="mt-1 text-xs text-[#64748b]">{request.property.region} · {request.property.propertyType} · {request.property.areaLabel}</p>
          <p className="mt-1 text-xs text-[#64748b]">사용자 {request.customerName} · {request.maskedPhone}</p>
          <p className="mt-1 text-xs text-[#64748b]">희망 일정 {request.desiredSchedule} · 매칭 점수 {request.matchScore}점</p>
        </ContractorSectionCard>
        <div className="mt-3">
          <ContractorTabNavigation requestId={request.requestId} activeTab={activeTab} />
        </div>
        {statusMessage ? <p role="status" className="mt-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-xs font-semibold text-[#b91c1c]">{statusMessage}</p> : null}
        <div className="mt-4 space-y-3">{children}</div>
      </main>
      {actions}
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
