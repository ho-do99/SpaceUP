import { Link } from 'react-router-dom'
import { formatWon } from './contractorEstimateUtils'
import ContractorSettlementStatusBadge from './ContractorSettlementStatusBadge'
import type { ContractorSettlement } from '@/types/contractorPortal'

function getDateLabel(settlement: ContractorSettlement) {
  if (settlement.status === 'PAID') return `지급 완료일 ${settlement.paidDate?.replace(/-/g, '.')}`
  if (settlement.status === 'ON_HOLD') return `보류일 ${settlement.holdDate?.replace(/-/g, '.')}`
  return `지급 예정일 ${settlement.scheduledDate?.replace(/-/g, '.')}`
}

export default function ContractorSettlementCard({ settlement }: { settlement: ContractorSettlement }) {
  const amountLabel = settlement.status === 'PAID' ? '지급 금액' : settlement.status === 'ON_HOLD' ? '보류 금액' : '정산 예정 금액'

  return (
    <article className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-all text-[13px] font-bold text-[#2563eb]">{settlement.settlementId}</p>
        <ContractorSettlementStatusBadge status={settlement.status} />
      </div>
      <h2 className="mt-2 break-words text-sm font-bold leading-5 text-[#1e293b]">{settlement.projectName}</h2>
      <dl className="mt-3 space-y-1.5 text-xs leading-5">
        <div className="flex justify-between gap-4"><dt className="text-[#64748b]">고객 결제</dt><dd className="break-all text-right font-semibold text-[#0f172a]">{formatWon(settlement.breakdown.customerPaymentAmount)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-[#64748b]">플랫폼 수수료</dt><dd className="break-all text-right text-[#0f172a]">-{formatWon(settlement.breakdown.platformFeeAmount)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-[#f1f5f9] pt-2"><dt className="font-bold text-[#1e293b]">{amountLabel}</dt><dd className="break-all text-right font-bold text-[#2563eb]">{formatWon(settlement.breakdown.settlementAmount)}</dd></div>
      </dl>
      <p className="mt-2 text-[11px] leading-5 text-[#64748b]">{getDateLabel(settlement)}</p>
      {settlement.status === 'ON_HOLD' && settlement.holdReason ? <p className="mt-2 line-clamp-2 break-words rounded-lg bg-[#fef2f2] px-3 py-2 text-[11px] leading-5 text-[#b91c1c]">{settlement.holdReason}</p> : null}
      <Link aria-label={`${settlement.settlementId} 정산 상세 보기`} to={`/contractor/settlements/${settlement.settlementId}`} className="mt-3 flex h-11 items-center justify-center rounded-lg border border-[#e2e8f0] text-xs font-bold text-[#1e293b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">상세 보기</Link>
    </article>
  )
}
