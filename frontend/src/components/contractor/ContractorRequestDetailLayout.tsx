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
  const isSummary = activeTab === 'summary'

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="의뢰 상세" back />
      <main className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 ${isSummary ? 'bg-white pt-4' : 'bg-[#f8fafc] pt-2'}`}>
        <p className={`text-xs text-[#64748b] ${isSummary ? 'leading-[17px]' : 'leading-5'}`}>
          {isSummary
            ? '의뢰를 승인하면 실시간 채팅방이 자동 개설됩니다. 사용자와 방문 일정을 조율하고 실제 현장을 확인한 뒤 견적을 작성할 수 있습니다.'
            : `${request.requestId} 의뢰 자료를 탭별로 확인하세요.`}
        </p>
        <ContractorSectionCard className={`${isSummary ? 'mt-3 p-[14px]' : 'mt-5 p-[13px]'} shadow-none`}>
          <p className={`${isSummary ? 'text-sm text-[#2563eb]' : 'text-[13px] text-[#64748b]'} font-bold leading-5`}>{request.requestId}</p>
          <p className={`${isSummary ? 'text-xs' : 'text-[11px]'} mt-0.5 leading-[17px] text-[#64748b]`}>{request.property.region} · {request.property.propertyType} · {request.property.areaLabel}</p>
          <p className={`${isSummary ? 'text-xs' : 'text-[11px]'} mt-0.5 leading-[17px] text-[#64748b]`}>사용자 {request.customerName} · {request.maskedPhone}</p>
          <p className={`${isSummary ? 'text-xs' : 'text-[11px]'} mt-0.5 leading-[17px] text-[#64748b]`}>희망 일정 {request.desiredSchedule} · 매칭 점수 {request.matchScore}점</p>
        </ContractorSectionCard>
        <div className="mt-3">
          <ContractorTabNavigation requestId={request.requestId} activeTab={activeTab} />
        </div>
        {statusMessage ? <p role="status" className="mt-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-xs font-semibold text-[#b91c1c]">{statusMessage}</p> : null}
        <div className="mt-3 space-y-3">{children}</div>
        <div className={isSummary ? 'mt-3' : 'mt-auto pt-6'}>{actions}</div>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
