import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { getAssignedRequests, getContractorDashboard } from '@/api/contractorApi'
import { getVisit } from '@/api/visitApi'
import useRealtime from '@/contexts/useRealtime'
import type { ContractorDashboard, SiteVisit } from '@/types/backendContractor'
import type { ContractorRequest } from '@/types/contractorPortal'
import { requestToContractorCard } from '@/utils/contractorRequestAdapter'

export default function ContractorDashboardPage() {
  const [dashboard, setDashboard] = useState<ContractorDashboard | null>(null)
  const [requests, setRequests] = useState<readonly ContractorRequest[]>([])
  const [todayVisits, setTodayVisits] = useState<readonly SiteVisit[]>([])
  const [dashboardError, setDashboardError] = useState('')
  const { latestEvent } = useRealtime()

  const loadDashboard = useCallback(async () => {
    try {
      const [nextDashboard, page] = await Promise.all([
        getContractorDashboard(),
        getAssignedRequests({ size: 20 }),
      ])
      const assignedRequests = page.content.map(requestToContractorCard)
      const visits = await Promise.all(assignedRequests.map(async (request) => {
        try { return await getVisit(Number(request.requestId)) } catch { return null }
      }))
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
      setDashboard(nextDashboard)
      setRequests(assignedRequests)
      setTodayVisits(visits.filter((visit): visit is SiteVisit => visit?.status === 'SCHEDULED' && visit.visitDate === today))
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : '대시보드 조회에 실패했습니다.')
    }
  }, [])

  useEffect(() => { void loadDashboard() }, [loadDashboard])
  useEffect(() => {
    if (latestEvent?.type === 'NOTIFICATION_CHANGED') void loadDashboard()
  }, [latestEvent, loadDashboard])

  const metric = (value: number | undefined, suffix = '건') => value === undefined ? '-' : `${value}${suffix}`
  const latestRequest = requests[0]

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="시공사 대시보드" />
      <main className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-4 pb-6 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">오늘의 영업 현황과 시공 일정을 확인하세요.</p>
        <section aria-label="오늘의 현황" className="grid grid-cols-2 gap-[10px]">
          {[
            ['신규 리드', metric(dashboard?.newLeadsCount)],
            ['검토 중', metric(dashboard?.quoteRequestedCount)],
            ['견적 전송', metric(dashboard?.quoteSentCount)],
            ['계약 대기', metric(dashboard?.contractPendingCount)],
          ].map(([label, value]) => (
            <div key={label} className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3">
              <p className="text-[11px] leading-4 text-[#64748b]">{label}</p>
              <p className={`mt-1 text-[19px] font-bold leading-7 ${label === '신규 리드' ? 'text-[#2563eb]' : 'text-[#0b2b59]'}`}>{value}</p>
            </div>
          ))}
          <div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3">
            <p className="text-[11px] leading-4 text-[#64748b]">정산 예정</p>
            <p className="mt-1 text-[19px] font-bold leading-7 text-[#f05a16]">{dashboard ? `₩${dashboard.pendingSettlementAmount.toLocaleString('ko-KR')}` : '-'}</p>
          </div>
        </section>
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
          <h2 className="text-sm font-bold leading-5 text-[#1e293b]">영업 파이프라인</h2>
          <p className="mt-2 text-xs leading-[17px] text-[#64748b]">{dashboard ? `신규 ${dashboard.newLeadsCount} → 검토 ${dashboard.quoteRequestedCount} → 전송 ${dashboard.quoteSentCount} → 계약 ${dashboard.contractPendingCount}` : '대시보드 데이터를 불러오는 중입니다.'}</p>
        </section>
        {dashboardError ? <p role="alert" className="rounded-lg bg-[#fef2f2] px-3 py-2 text-xs font-semibold text-[#b91c1c]">{dashboardError}</p> : null}
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
          <h2 className="text-sm font-bold leading-5 text-[#1e293b]">최근 수신 리드</h2>
          {latestRequest ? <Link to={`/contractor/requests/${latestRequest.requestId}`} className="mt-2 block text-xs leading-[17px] text-[#64748b]">{latestRequest.customerName} · {latestRequest.property.region} · {latestRequest.budgetLabel}</Link> : <p className="mt-2 text-xs leading-[17px] text-[#64748b]">수신한 의뢰가 없습니다.</p>}
        </section>
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
          <h2 className="text-sm font-bold leading-5 text-[#1e293b]">오늘 시공 일정</h2>
          {todayVisits.length ? todayVisits.map((visit) => <Link key={visit.id} to={`/contractor/requests/${visit.requestId}/visit`} className="mt-2 block text-xs leading-[17px] text-[#64748b]">{visit.visitTime?.slice(0, 5)} {visit.address ?? '현장 방문'}</Link>) : <p className="mt-2 text-xs leading-[17px] text-[#64748b]">등록된 오늘 일정이 없습니다.</p>}
        </section>
        <Link to="/contractor/requests" className="flex h-12 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">신규 의뢰 확인</Link>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
