import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getAssignedRequests } from '@/api/contractorApi'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorRequestCard from '@/components/contractor/ContractorRequestCard'
import { contractorRequests } from '@/mocks/contractorPortalMockData'
import type { ContractorRequestFilter, ContractorUnsuccessfulReason } from '@/types/contractorPortal'
import type { ContractorRequest } from '@/types/contractorPortal'
import { requestToContractorCard } from '@/utils/contractorRequestAdapter'

const filters: readonly { id: ContractorRequestFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'in_progress', label: '진행중' },
  { id: 'matched', label: '성사' },
  { id: 'unmatched', label: '미성사' },
]

const unsuccessfulReasons: readonly { id: ContractorUnsuccessfulReason; label: string }[] = [
  { id: 'contractor_rejected', label: '시공사 거절' },
  { id: 'user_canceled', label: '사용자 취소' },
  { id: 'auto_canceled', label: '자동 취소' },
  { id: 'expired', label: '요청 만료' },
]

export default function ContractorRequestListPage() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const initialFilter = (location.state as { filter?: ContractorRequestFilter } | null)?.filter
  const [filter, setFilter] = useState<ContractorRequestFilter>(initialFilter ?? 'all')
  const [unsuccessfulReason, setUnsuccessfulReason] = useState<ContractorUnsuccessfulReason>('contractor_rejected')
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
        || (filter === 'unmatched' && (request.unsuccessfulView ?? request.status) === unsuccessfulReason)

      return matchesSearch && matchesFilter
    })
  }, [filter, query, requests, unsuccessfulReason])

  const showUnsuccessful = filter === 'unmatched'
  const cardVariant = showUnsuccessful ? 'unsuccessful' : filter === 'in_progress' ? 'in-progress' : filter === 'matched' ? 'matched' : 'default'

  return (
    <ContractorMobileShell>
      <ContractorAppBar title={showUnsuccessful ? '미성사 의뢰' : '의뢰 목록'} back={showUnsuccessful} onBack={() => setFilter('all')} />
      <main className="flex-1 px-4 pb-6 pt-4">
        <p className="text-xs text-[#64748b]">{showUnsuccessful ? unsuccessfulReason === 'contractor_rejected' ? '거절·취소·만료된 의뢰를 확인하세요.' : '미성사 의뢰의 종료 사유를 확인하세요.' : '사용자의 리모델링 의뢰를 상태별로 확인하세요.'}</p>
        {showUnsuccessful ? null : <label className="mt-2 block text-[11px] font-bold leading-4 text-[#1e293b]">
          <span>통합 검색</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="의뢰번호, 지역, 주택 유형 검색" className="mt-1 block h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]" />
        </label>}
        <div role="group" aria-label="의뢰 상태 필터" className="mt-3 grid grid-cols-4 gap-[10px] px-[3px]">
          {filters.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-9 rounded-full border text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${filter === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#cbd5e1] bg-white text-[#64748b]'}`}>{showUnsuccessful && unsuccessfulReason === 'contractor_rejected' && item.id === 'in_progress' ? '진행 중' : item.label}</button>
          ))}
        </div>
        {showUnsuccessful ? (
          <div role="group" aria-label="미성사 종료 사유" className="mt-3 grid grid-cols-4 gap-2">
            {unsuccessfulReasons.map((item) => (
              <button key={item.id} type="button" aria-pressed={unsuccessfulReason === item.id} onClick={() => setUnsuccessfulReason(item.id)} className={`h-[34px] min-w-0 rounded-full border text-[11px] font-bold ${unsuccessfulReason === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748a]'}`}>{item.label}</button>
            ))}
          </div>
        ) : null}
        <div className="mt-3 space-y-3">
          {visibleRequests.length ? visibleRequests.map((request) => <ContractorRequestCard key={`${request.requestId}-${request.status}`} request={request} variant={cardVariant} />) : <ContractorEmptyState title="검색 결과가 없습니다" description="검색어나 상태 필터를 변경해 다시 확인해 주세요." />}
        </div>
        {showUnsuccessful ? <button type="button" onClick={() => setFilter('in_progress')} className="mt-4 h-12 w-full rounded-lg bg-[#2563eb] text-[13px] font-bold text-white">진행 중 의뢰 보기</button> : null}
        <p role="status" className="mt-3 text-center text-[10px] text-[#64748b]">{loadNotice}</p>
      </main>
      {showUnsuccessful ? null : <ContractorBottomNavigation />}
    </ContractorMobileShell>
  )
}
