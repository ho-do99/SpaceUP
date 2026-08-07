import { useEffect, useMemo, useState } from 'react'
import { getAssignedRequests } from '@/api/contractorApi'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorRequestCard from '@/components/contractor/ContractorRequestCard'
import { contractorRequests } from '@/mocks/contractorPortalMockData'
import type { ContractorRequestFilter } from '@/types/contractorPortal'
import type { ContractorRequest } from '@/types/contractorPortal'
import { requestToContractorCard } from '@/utils/contractorRequestAdapter'

const filters: readonly { id: ContractorRequestFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'in_progress', label: '진행중' },
  { id: 'matched', label: '성사' },
  { id: 'unmatched', label: '미성사' },
]

export default function ContractorRequestListPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ContractorRequestFilter>('all')
  const [requests, setRequests] = useState<readonly ContractorRequest[]>(contractorRequests)
  const [loadNotice, setLoadNotice] = useState('')

  useEffect(() => {
    getAssignedRequests({ size: 100 }).then((page) => {
      const content = Array.isArray(page) ? page : page.content
      setRequests(content.map(requestToContractorCard))
    }).catch(() => setLoadNotice('실제 의뢰를 불러오지 못해 예시 데이터를 표시합니다.'))
  }, [])

  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR').replace(/\s+/g, '')

    return requests.filter((request) => {
      const searchable = `${request.requestId}${request.property.region}${request.property.propertyType}`.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')
      const matchesSearch = !normalizedQuery || searchable.includes(normalizedQuery)
      const matchesFilter = filter === 'all'
        || (filter === 'in_progress' && ['new', 'reviewing', 'in_progress'].includes(request.status))
        || (filter === 'matched' && request.status === 'matched')
        || (filter === 'unmatched' && ['user_canceled', 'auto_canceled', 'expired'].includes(request.status))

      return matchesSearch && matchesFilter
    })
  }, [filter, query, requests])

  return (
    <ContractorMobileShell>
      <ContractorAppBar title="의뢰 목록" />
      <main className="flex-1 px-4 pb-5 pt-4">
        <p className="text-xs text-[#64748b]">사용자의 리모델링 의뢰를 상태별로 확인하세요.</p>
        <label className="mt-4 block">
          <span className="sr-only">통합 검색</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="의뢰번호, 지역, 주택 유형 검색" className="h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]" />
        </label>
        <div role="group" aria-label="의뢰 상태 필터" className="mt-3 grid grid-cols-4 gap-2">
          {filters.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-9 rounded-full border text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${filter === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#cbd5e1] bg-white text-[#64748b]'}`}>{item.label}</button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {visibleRequests.length ? visibleRequests.map((request) => <ContractorRequestCard key={request.requestId} request={request} />) : <ContractorEmptyState title="검색 결과가 없습니다" description="검색어나 상태 필터를 변경해 다시 확인해 주세요." />}
        </div>
        <p role="status" className="mt-3 text-center text-[10px] text-[#64748b]">{loadNotice}</p>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
