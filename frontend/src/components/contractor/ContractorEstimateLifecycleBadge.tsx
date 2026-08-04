import { getEstimateLifecycleLabel } from './contractorEstimateLifecycleUtils'
import type { ContractorEstimateLifecycleStatus } from '@/types/contractorPortal'

const tones: Record<ContractorEstimateLifecycleStatus, string> = {
  SUBMITTED: 'bg-[#eff6ff] text-[#2563eb]',
  VIEWING: 'bg-[#fff7ed] text-[#c2410c]',
  REVISION_REQUESTED: 'bg-[#fef2f2] text-[#dc2626]',
  RESUBMITTED: 'bg-[#eff6ff] text-[#2563eb]',
  ACCEPTED: 'bg-[#ecfdf5] text-[#059669]',
}

export default function ContractorEstimateLifecycleBadge({ status }: { status: ContractorEstimateLifecycleStatus }) {
  return <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${tones[status]}`}>{getEstimateLifecycleLabel(status)}</span>
}
