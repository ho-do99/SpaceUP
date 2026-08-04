import { Link } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import ContractorStatusBadge from '@/components/contractor/ContractorStatusBadge'
import { contractorRequests } from '@/mocks/contractorPortalMockData'

const pipeline = [
  ['신규', '12'],
  ['검토', '5'],
  ['전송', '8'],
  ['선택', '4'],
  ['계약', '3'],
] as const

export default function ContractorDashboardPage() {
  const latestRequest = contractorRequests[0]

  return (
    <ContractorMobileShell>
      <ContractorAppBar title="시공사 대시보드" />
      <main className="flex-1 space-y-4 px-4 pb-5 pt-4">
        <p className="text-xs text-[#64748b]">오늘의 영업 현황과 시공 일정을 확인하세요.</p>

        <section aria-label="오늘의 현황" className="grid grid-cols-2 gap-2">
          {[
            ['신규 리드', '12건'],
            ['검토 중', '5건'],
            ['견적 전송', '8건'],
            ['계약 대기', '3건'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-sm">
              <p className="text-[11px] text-[#64748b]">{label}</p>
              <p className="mt-1 text-lg font-bold text-[#1e293b]">{value}</p>
            </div>
          ))}
          <div className="col-span-2 rounded-xl bg-[#2563eb] p-3 text-white shadow-sm">
            <p className="text-[11px] text-white/80">정산 예정</p>
            <p className="mt-1 text-lg font-bold">₩13,680,000</p>
          </div>
        </section>

        <ContractorSectionCard title="영업 파이프라인">
          <div className="grid grid-cols-5 gap-1 text-center">
            {pipeline.map(([label, value], index) => (
              <div key={label} className="relative rounded-lg bg-[#eff6ff] px-1 py-2">
                <p className="text-base font-bold text-[#2563eb]">{value}</p>
                <p className="text-[10px] text-[#64748b]">{label}</p>
                {index < pipeline.length - 1 ? <span aria-hidden="true" className="absolute -right-1 top-1/2 z-10 -translate-y-1/2 text-[#94a3b8]">›</span> : null}
              </div>
            ))}
          </div>
        </ContractorSectionCard>

        <ContractorSectionCard title="최근 수신 리드">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#2563eb]">{latestRequest.requestId}</p>
              <p className="mt-1 text-xs text-[#64748b]">{latestRequest.property.region} · {latestRequest.property.propertyType} {latestRequest.property.areaLabel}</p>
              <p className="mt-2 text-xs font-semibold text-[#1e293b]">예상 견적 {latestRequest.estimatedCostLabel}</p>
            </div>
            <ContractorStatusBadge status={latestRequest.status} label={latestRequest.statusLabel} />
          </div>
          <Link to={`/contractor/requests/${latestRequest.requestId}`} className="mt-3 flex h-9 items-center justify-center rounded-lg border border-[#2563eb] text-xs font-bold text-[#2563eb]">상세 보기</Link>
        </ContractorSectionCard>

        <ContractorSectionCard title="오늘 시공 일정">
          <ul className="space-y-3 text-xs">
            <li className="flex gap-3"><strong className="text-[#2563eb]">10:00</strong><span>장실 리버뷰 현장 점검</span></li>
            <li className="flex gap-3"><strong className="text-[#2563eb]">14:00</strong><span>성수 오피스텔 자재 확인</span></li>
          </ul>
        </ContractorSectionCard>

        <Link to="/contractor/requests" className="flex h-12 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">신규 의뢰 확인</Link>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
