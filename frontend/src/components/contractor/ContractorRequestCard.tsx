import { Link } from 'react-router-dom'
import type { ContractorRequest } from '@/types/contractorPortal'
import ContractorStatusBadge from './ContractorStatusBadge'

interface ContractorRequestCardProps {
  request: ContractorRequest
}
export default function ContractorRequestCard({ request }: ContractorRequestCardProps) {
  return (
    <article className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#2563eb]">{request.requestId}</p>
          <p className="mt-1 text-xs text-[#64748b]">{request.property.region} · {request.property.propertyType} {request.property.areaLabel}</p>
        </div>
        <ContractorStatusBadge status={request.status} label={request.statusLabel} />
      </div>
      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-[#64748b]">사용자 입력 예산</dt>
          <dd className="text-right font-semibold text-[#1e293b]">{request.budgetLabel}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-[#64748b]">SpaceUP 예상 견적</dt>
          <dd className="text-right font-bold text-[#2563eb]">{request.estimatedCostLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#64748b]">매칭 점수</dt>
          <dd className="font-bold text-[#2563eb]">{request.matchScore}점</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-[#e2e8f0] pt-3 text-[11px] text-[#64748b]">
        <span>{request.lastActivityLabel}{request.deadlineLabel ? ` · ${request.deadlineLabel}` : ''}</span>
        <Link to={`/contractor/requests/${request.requestId}`} className="rounded-lg border border-[#2563eb] px-3 py-2 font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">상세 보기</Link>
      </div>
    </article>
  )
}
