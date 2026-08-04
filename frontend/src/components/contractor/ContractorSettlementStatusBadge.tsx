import type { ContractorSettlementStatus } from '@/types/contractorPortal'

const statusMeta: Record<ContractorSettlementStatus, { label: string; className: string }> = {
  SCHEDULED: { label: '정산 예정', className: 'bg-[#eff6ff] text-[#2563eb]' },
  PAID: { label: '지급 완료', className: 'bg-[#ecfdf5] text-[#047857]' },
  ON_HOLD: { label: '정산 보류', className: 'bg-[#fef2f2] text-[#dc2626]' },
}

export default function ContractorSettlementStatusBadge({ status }: { status: ContractorSettlementStatus }) {
  const meta = statusMeta[status]
  return <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${meta.className}`}>{meta.label}</span>
}
