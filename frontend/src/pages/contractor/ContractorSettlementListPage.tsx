import { useMemo, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSettlementCard from '@/components/contractor/ContractorSettlementCard'
import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import { contractorSettlements, contractorSettlementSummary } from '@/mocks/contractorPortalMockData'
import type { ContractorSettlementFilter, ContractorSettlementStatus } from '@/types/contractorPortal'

const filters: readonly { id: ContractorSettlementFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'scheduled', label: '예정' },
  { id: 'paid', label: '완료' },
  { id: 'on_hold', label: '보류' },
]

const filterStatus: Partial<Record<ContractorSettlementFilter, ContractorSettlementStatus>> = {
  scheduled: 'SCHEDULED',
  paid: 'PAID',
  on_hold: 'ON_HOLD',
}

export default function ContractorSettlementListPage() {
  const [filter, setFilter] = useState<ContractorSettlementFilter>('all')
  const results = useMemo(() => {
    const status = filterStatus[filter]
    return status ? contractorSettlements.filter((settlement) => settlement.status === status) : contractorSettlements
  }, [filter])

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="정산 목록" />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <p className="text-xs leading-5 text-[#64748b]">플랫폼 수수료와 지급 상태를 확인하세요.</p>
        <section aria-label="정산 현황" className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">총 계약</p><p className="mt-1 break-all text-sm font-bold text-[#1e293b]">{formatWon(contractorSettlementSummary.totalContractAmount)}</p></div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">정산 대기</p><p className="mt-1 break-all text-sm font-bold text-[#2563eb]">{formatWon(contractorSettlementSummary.pendingAmount)}</p></div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">정산 완료</p><p className="mt-1 break-all text-sm font-bold text-[#047857]">{formatWon(contractorSettlementSummary.completedAmount)}</p></div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">지급 완료</p><p className="mt-1 break-all text-sm font-bold text-[#1e293b]">{formatWon(contractorSettlementSummary.paidAmount)}</p></div>
        </section>
        <div className="mt-3 grid grid-cols-4 gap-2" aria-label="정산 상태 필터">
          {filters.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-10 rounded-full border text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${filter === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}>{item.label}</button>
          ))}
        </div>
        <div aria-live="polite" className="mt-4 space-y-3">
          {results.length ? results.map((settlement) => <ContractorSettlementCard key={settlement.settlementId} settlement={settlement} />) : <ContractorEmptyState title="조건에 맞는 정산 내역이 없습니다" description="다른 상태 필터를 선택해 확인해 주세요." />}
        </div>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
