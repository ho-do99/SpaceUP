import { useMemo, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSentEstimateCard from '@/components/contractor/ContractorSentEstimateCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import { contractorSentEstimates } from '@/mocks/contractorPortalMockData'
import type { ContractorEstimateListFilter, ContractorEstimateLifecycleStatus } from '@/types/contractorPortal'

const filters: readonly { id: ContractorEstimateListFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'submitted', label: '전송 완료' },
  { id: 'viewing', label: '사용자 확인 중' },
  { id: 'accepted', label: '견적 승인' },
]

function matchesFilter(filter: ContractorEstimateListFilter, status: ContractorEstimateLifecycleStatus) {
  if (filter === 'all') return true
  if (filter === 'submitted') return status === 'SUBMITTED'
  if (filter === 'viewing') return status === 'VIEWING' || status === 'RESUBMITTED'
  return status === 'ACCEPTED'
}

export default function ContractorEstimateListPage() {
  const { estimateLifecycleStatus, estimateValidUntil } = useContractorPortalFlow()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ContractorEstimateListFilter>('all')
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return contractorSentEstimates.filter((estimate) => {
      const haystack = [estimate.estimateId, estimate.requestId, estimate.customerName, estimate.region].join(' ').toLowerCase()
      return (!normalized || haystack.includes(normalized)) && matchesFilter(filter, estimateLifecycleStatus)
    })
  }, [estimateLifecycleStatus, filter, query])

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="보낸 견적" />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <p className="text-xs leading-5 text-[#64748b]">전송한 견적의 확인과 승인 상태를 관리하세요.</p>
        <div className="mt-3 grid grid-cols-4 gap-2" aria-label="견적 상태 필터">
          {filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-10 min-w-0 whitespace-nowrap rounded-full border px-1 text-[10px] font-bold ${filter === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}>{item.label}</button>)}
        </div>
        <label className="mt-3 block text-[11px] font-bold text-[#1e293b]">검색
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="견적 번호 또는 사용자 현장" className="mt-2 h-12 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs outline-none focus:border-[#2563eb]" />
        </label>
        <div className="mt-4 space-y-3">
          {results.length ? results.map((estimate) => <ContractorSentEstimateCard key={estimate.estimateId} estimate={estimate} status={estimateLifecycleStatus} validUntil={estimateValidUntil} />) : <ContractorEmptyState title="조건에 맞는 견적이 없습니다" description="검색어나 상태 필터를 변경해 다시 확인해 주세요." />}
        </div>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
