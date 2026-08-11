import { Link } from 'react-router-dom'
import type { ContractorRequest } from '@/types/contractorPortal'

interface ContractorRequestCardProps {
  request: ContractorRequest
  variant?: 'default' | 'in-progress' | 'matched' | 'unsuccessful'
}
export default function ContractorRequestCard({ request, variant = 'default' }: ContractorRequestCardProps) {
  const urgent = request.deadlineLabel?.includes('D-') && !request.deadlineLabel.includes('매칭')

  if (variant === 'unsuccessful') {
    if (request.status === 'contractor_rejected' || request.unsuccessfulView === 'contractor_rejected') {
      return (
        <article className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
          <p className="text-sm font-bold leading-5 text-[#1e293b]">{request.requestId}</p>
          <p className="text-[11px] leading-4 text-[#64748b]">{request.property.region} · {request.property.propertyType}</p>
          <p className="text-[11px] leading-4 text-[#64748b]">{request.status === 'contractor_rejected' ? `거절 사유: ${request.terminationReason}` : request.terminationReason}</p>
          <p className="text-[11px] leading-4 text-[#64748b]">{request.terminationDateLabel}</p>
          <span className="mt-2 flex h-[30px] w-[100px] items-center justify-center rounded-full bg-[#fdedee] text-[11px] font-bold text-[#e5484d]">{request.statusLabel}</span>
        </article>
      )
    }
    return (
      <article className="min-h-[132px] rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
        <p className="text-[13px] font-bold leading-[19px] text-[#1e293b]">{request.requestId}</p>
        <p className="mt-[5px] text-[11px] font-bold leading-[17px] text-[#e5484d]">{request.statusLabel}</p>
        <p className="mt-[7px] text-[11px] leading-[17px] text-[#64748a]">사유: {request.terminationReason}</p>
        <p className="mt-[7px] text-[11px] leading-[17px] text-[#64748a]">{request.terminationDateLabel}</p>
      </article>
    )
  }

  if (variant === 'in-progress') {
    return (
      <article className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
        <p className="text-[13px] font-bold leading-[19px] text-[#1e293b]">{request.requestId}</p>
        <p className="mt-1 text-[11px] leading-[17px] text-[#64748a]">{request.property.region} · {request.property.propertyType} {request.property.areaLabel}</p>
        <p className="mt-1 text-[11px] leading-[17px] text-[#64748a]">매칭 점수 {request.matchScore}점{request.customerName ? ` · ${request.customerName} 사용자` : ''}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-[#2563eb]">진행중 · {request.statusLabel}</p>
          <Link to={request.detailHref ?? `/contractor/requests/${request.requestId}`} className="flex h-10 items-center justify-center rounded-lg border border-[#e2e8f0] px-4 text-[11px] font-bold text-[#0b2b59]">상세</Link>
        </div>
      </article>
    )
  }

  if (variant === 'matched') {
    return (
      <article className="rounded-xl border border-[#e2e8f0] bg-white p-[14px]">
        <p className="text-[13px] font-bold leading-[19px] text-[#1e293b]">{request.requestId}</p>
        <p className="mt-1 text-xs font-bold leading-[18px] text-[#1e293b]">{request.projectTitle}</p>
        <p className="mt-1 text-[11px] leading-[17px] text-[#64748a]">{request.contractSummary}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-[#16a34a]">{request.progressSummary}</p>
          <Link to={request.detailHref ?? `/contractor/requests/${request.requestId}`} className="flex h-10 items-center justify-center rounded-lg border border-[#e2e8f0] px-4 text-[11px] font-bold text-[#0b2b59]">상세</Link>
        </div>
      </article>
    )
  }

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
