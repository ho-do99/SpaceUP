import type { ContractorRequestStatus } from '@/types/contractorPortal'

const styles: Record<ContractorRequestStatus, string> = {
  new: 'bg-[#dbeafe] text-[#1d4ed8]',
  reviewing: 'bg-[#fef3c7] text-[#92400e]',
  in_progress: 'bg-[#dcfce7] text-[#166534]',
  matched: 'bg-[#dcfce7] text-[#166534]',
  user_canceled: 'bg-[#fee2e2] text-[#b91c1c]',
  auto_canceled: 'bg-[#f1f5f9] text-[#475569]',
  expired: 'bg-[#f1f5f9] text-[#475569]',
}
interface ContractorStatusBadgeProps {
  status: ContractorRequestStatus
  label: string
}

export default function ContractorStatusBadge({ status, label }: ContractorStatusBadgeProps) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>{label}</span>
}
