import { Link } from 'react-router-dom'
import type { ContractorRequest } from '@/types/contractorPortal'

interface ContractorRequestCardProps {
  request: ContractorRequest
}
export default function ContractorRequestCard({ request }: ContractorRequestCardProps) {
  const urgent = request.deadlineLabel?.includes('D-') && !request.deadlineLabel.includes('매칭')

  return (
    <article className="rounded-xl border border-[#dbe3ef] bg-white p-[14px]">
      <p className={`text-sm font-bold leading-[17px] ${request.status === 'auto_canceled' ? 'text-[#ef4444]' : 'text-[#2563eb]'}`}>{request.requestId}</p>
      <p className="text-xs leading-[17px] text-[#64748b]">{request.property.region} · {request.property.propertyType} {request.property.areaLabel}</p>
      <p className="text-xs leading-[17px] text-[#64748b]">사용자 입력 예산 {request.budgetLabel.replace('사용자 예산 ', '')}</p>
      <p className="text-xs leading-[17px] text-[#64748b]">SpaceUP 예상 견적 {request.estimatedCostLabel}</p>
      <p className="text-xs leading-[17px] text-[#64748b]">매칭 점수 {request.matchScore}점</p>
      <div className="mt-[7px] flex min-h-11 items-center gap-2">
        <span className={`flex h-[30px] min-w-[90px] items-center justify-center rounded-full px-3 text-[11px] font-bold ${request.status === 'auto_canceled' ? 'bg-[#fee2e2] text-[#ef4444]' : 'bg-[#eff6ff] text-[#2563eb]'}`}>{request.statusLabel}</span>
        <Link to={`/contractor/requests/${request.requestId}`} className="flex h-10 items-center justify-center rounded-lg border border-[#dbe3ef] px-4 text-[11px] font-bold text-[#0b2b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">상세</Link>
        <span className={`ml-auto text-right text-[10px] font-bold leading-[15px] ${urgent ? 'text-[#ef4444]' : 'text-[#64748b]'}`}>{request.lastActivityLabel}{request.deadlineLabel ? ` · ${request.deadlineLabel}` : ''}</span>
      </div>
    </article>
  )
}
