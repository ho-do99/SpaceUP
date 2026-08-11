import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { contractorRequests } from '@/mocks/contractorPortalMockData'
import { getContractorDashboard } from '@/api/contractorApi'
import type { ContractorDashboard } from '@/types/backendContractor'

export default function ContractorDashboardPage() {
  const latestRequest = contractorRequests[0]
  const [dashboard, setDashboard] = useState<ContractorDashboard | null>(null)
  const [dashboardError, setDashboardError] = useState('')
  useEffect(() => {
    getContractorDashboard()
      .then(setDashboard)
      .catch((error) => setDashboardError(error instanceof Error ? error.message : '대시보드 조회에 실패했습니다.'))
  }, [])
  const metric = (value: number | undefined, suffix = '건') => value === undefined ? '-' : `${value}${suffix}`
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

        <Link to={`/contractor/requests/${latestRequest.requestId}`} className="block rounded-xl border border-[#e2e8f0] bg-white p-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
          <h2 className="text-sm font-bold leading-5 text-[#1e293b]">최근 수신 리드</h2>
          <p className="mt-2 text-xs leading-[17px] text-[#64748b]">{latestRequest.requestId.replace('REQ', 'LD')} · {latestRequest.property.region} · {latestRequest.budgetLabel}</p>
          <p className="mt-1 text-xs leading-[17px] text-[#64748b]">LD-260715-011 · 서울 마포구 · 3,200만원</p>
        </Link>

        <section className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
          <h2 className="text-sm font-bold leading-5 text-[#1e293b]">오늘 시공 일정</h2>
          <ul className="mt-2 space-y-1 text-xs leading-[17px] text-[#64748b]">
            <li>10:00 장실 리버뷰 현장 점검</li>
            <li>14:00 성수 오피스텔 자재 확인</li>
          </ul>
        </section>

        <Link to="/contractor/requests" className="flex h-12 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">신규 의뢰 확인</Link>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
