import { useEffect, useMemo, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSettlementCard from '@/components/contractor/ContractorSettlementCard'
import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import type { ContractorSettlement, ContractorSettlementFilter, ContractorSettlementStatus } from '@/types/contractorPortal'
import { getMySettlements } from '@/api/settlementApi'

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
  const [settlements, setSettlements] = useState<ContractorSettlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getMySettlements({ size: 100 }).then((page) => {
      if (!active) return
      setSettlements(page.content.map((item) => ({
        settlementId: String(item.id), projectName: item.transactionCode, customerName: item.partnerName,
        contractorName: item.partnerName, status: item.status === 'SETTLED' ? 'PAID' : 'SCHEDULED',
        breakdown: { customerPaymentAmount: item.transactionAmount, platformFeeRate: item.transactionAmount ? (item.commissionAmount / item.transactionAmount) * 100 : 0, platformFeeAmount: item.commissionAmount, settlementAmount: item.payoutAmount },
        statement: { bankName: '-', maskedAccountNumber: '-', taxInvoiceStatus: item.status === 'SETTLED' ? '발행 완료' : '발행 예정' },
      })))
    }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : '정산 목록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const summary = useMemo(() => ({
    totalContractAmount: settlements.reduce((sum, item) => sum + item.breakdown.customerPaymentAmount, 0),
    pendingAmount: settlements.filter((item) => item.status === 'SCHEDULED').reduce((sum, item) => sum + item.breakdown.settlementAmount, 0),
    completedAmount: settlements.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.breakdown.settlementAmount, 0),
    paidAmount: settlements.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.breakdown.settlementAmount, 0),
  }), [settlements])
  const results = useMemo(() => {
    const status = filterStatus[filter]
    return status ? settlements.filter((settlement) => settlement.status === status) : settlements
  }, [filter, settlements])

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="정산 목록" />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <p className="text-xs leading-5 text-[#64748b]">플랫폼 수수료와 지급 상태를 확인하세요.</p>
        <section aria-label="정산 현황" className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">총 계약</p><p className="mt-1 break-all text-[19px] font-bold text-[#0b2b59]">{formatWon(summary.totalContractAmount)}</p></div>
          <div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">정산 대기</p><p className="mt-1 break-all text-[19px] font-bold text-[#f05a16]">{formatWon(summary.pendingAmount)}</p></div>
          <div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">정산 완료</p><p className="mt-1 break-all text-[19px] font-bold text-[#2563eb]">{formatWon(summary.completedAmount)}</p></div>
          <div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">지급 완료</p><p className="mt-1 break-all text-[19px] font-bold text-[#0e9f6e]">{formatWon(summary.paidAmount)}</p></div>
        </section>
        <div className="mt-3 grid grid-cols-4 gap-2" aria-label="정산 상태 필터">
          {filters.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-10 rounded-full border text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${filter === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}>{item.label}</button>
          ))}
        </div>
        <div aria-live="polite" className="mt-4 space-y-3">
          {loading ? <p className="py-10 text-center text-xs text-[#64748b]">정산 목록을 불러오는 중입니다.</p> : error ? <p role="alert" className="py-10 text-center text-xs text-[#dc2626]">{error}</p> : results.length ? results.map((settlement) => <ContractorSettlementCard key={settlement.settlementId} settlement={settlement} />) : <ContractorEmptyState title="조건에 맞는 정산 내역이 없습니다" description="다른 상태 필터를 선택해 확인해 주세요." />}
        </div>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
