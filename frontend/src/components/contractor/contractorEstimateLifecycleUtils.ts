import type { ContractorEstimateLifecycleStatus } from '@/types/contractorPortal'

const labels: Record<ContractorEstimateLifecycleStatus, string> = {
  SUBMITTED: '전송 완료',
  VIEWING: '사용자 확인 중',
  REVISION_REQUESTED: '수정 요청',
  RESUBMITTED: '재전송 완료',
  ACCEPTED: '견적 승인',
}

export function getEstimateLifecycleLabel(status: ContractorEstimateLifecycleStatus) {
  return labels[status]
}
