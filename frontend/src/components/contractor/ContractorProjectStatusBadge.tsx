import type { ContractorProjectStatus } from '@/types/contractorPortal'

const labels: Record<ContractorProjectStatus, string> = {
  VISIT_SCHEDULED: '방문 예정', START_SCHEDULED: '착수 예정', IN_PROGRESS: '시공 중',
  COMPLETION_REQUESTED: '완료 확인 요청', COMPLETED: '완료',
}
const tones: Record<ContractorProjectStatus, string> = {
  VISIT_SCHEDULED: 'bg-[#eff6ff] text-[#2563eb]', START_SCHEDULED: 'bg-[#fff7ed] text-[#c2410c]',
  IN_PROGRESS: 'bg-[#ecfdf5] text-[#047857]', COMPLETION_REQUESTED: 'bg-[#fefce8] text-[#a16207]',
  COMPLETED: 'bg-[#f1f5f9] text-[#475569]',
}

export default function ContractorProjectStatusBadge({ status }: { status: ContractorProjectStatus }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[status]}`}>{labels[status]}</span>
}
