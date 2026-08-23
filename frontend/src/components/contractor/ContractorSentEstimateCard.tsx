import { Link } from 'react-router-dom'
import { formatWon } from './contractorEstimateUtils'
import ContractorEstimateLifecycleBadge from './ContractorEstimateLifecycleBadge'
import type { ContractorEstimateLifecycleStatus, ContractorSentEstimate } from '@/types/contractorPortal'

interface ContractorSentEstimateCardProps {
  estimate: ContractorSentEstimate
  status: ContractorEstimateLifecycleStatus
  validUntil: string
}

export default function ContractorSentEstimateCard({ estimate, status, validUntil }: ContractorSentEstimateCardProps) {
  return (
    <article className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-words text-[13px] font-bold text-[#64748b]">{estimate.customerName}</p>
        <ContractorEstimateLifecycleBadge status={status} />
      </div>
      <p className="mt-2 break-words text-[11px] leading-5 text-[#64748b]">{estimate.region} · {estimate.propertyType} {estimate.areaLabel}</p>
      <p className="text-[11px] leading-5 text-[#64748b]">최종 견적 {formatWon(estimate.finalAmount)}</p>
      <p className="text-[11px] leading-5 text-[#64748b]">전송 {estimate.submittedDate.replace(/-/g, '.')} · 유효 {validUntil.replace(/-/g, '.')}</p>
      <Link to={`/contractor/estimates/${estimate.estimateId}`} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-[#e2e8f0] text-xs font-bold text-[#1e293b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">견적 상세</Link>
    </article>
  )
}
