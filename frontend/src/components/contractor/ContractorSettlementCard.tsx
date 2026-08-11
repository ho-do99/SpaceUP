import { Link } from 'react-router-dom'
import { formatWon } from './contractorEstimateUtils'
import type { ContractorSettlement } from '@/types/contractorPortal'

function getDateLabel(settlement: ContractorSettlement) {
  if (settlement.status === 'PAID') return `지급 완료일 ${settlement.paidDate?.replace(/-/g, '.')}`
  if (settlement.status === 'ON_HOLD') return `보류일 ${settlement.holdDate?.replace(/-/g, '.')}`
  return `지급 예정일 ${settlement.scheduledDate?.replace(/-/g, '.')}`
}

export default function ContractorSettlementCard({ settlement }: { settlement: ContractorSettlement }) {
  return (
    <article>
      <div className="rounded-xl border border-[#dbe3ef] bg-white p-[14px]">
        <p className={`min-w-0 break-all text-sm font-bold ${settlement.status === 'PAID' ? 'text-[#2563eb]' : 'text-[#0f172a]'}`}>{settlement.settlementId} · {settlement.status === 'PAID' ? '지급 완료' : settlement.status === 'ON_HOLD' ? '보류' : '정산 예정'}</p>
        <p className="mt-1 text-xs leading-[17px] text-[#64748b]">{settlement.projectName} · {settlement.status === 'PAID' ? `지급 ${formatWon(settlement.breakdown.settlementAmount)}` : `고객 결제 ${formatWon(settlement.breakdown.customerPaymentAmount)}`}</p>
        {settlement.status === 'PAID' ? <p className="text-xs leading-[17px] text-[#64748b]">플랫폼 수수료 {formatWon(settlement.breakdown.platformFeeAmount)} · 최종 정산 {formatWon(settlement.breakdown.settlementAmount)}</p> : null}
        <p className="text-xs leading-[17px] text-[#64748b]">{getDateLabel(settlement)}</p>
        {settlement.status === 'ON_HOLD' && settlement.holdReason ? <p className="mt-2 line-clamp-2 break-words text-[11px] leading-5 text-[#b91c1c]">{settlement.holdReason}</p> : null}
      </div>
      <Link aria-label={`${settlement.settlementId} 정산 상세 보기`} to={`/contractor/settlements/${settlement.settlementId}`} className="mt-3 flex h-12 items-center justify-center rounded-lg border border-[#dbe3ef] bg-white text-sm font-bold text-[#0b2b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">정산 상세</Link>
    </article>
  )
}
