import { approveRequest, rejectRequest } from '@/api/contractorApi'

const rejectReasonCodes: Readonly<Record<string, string>> = {
  '지역 미지원': 'REGION_NOT_SUPPORTED',
  '예산 범위 불일치': 'BUDGET_MISMATCH',
  '전문 분야 불일치': 'SPECIALTY_MISMATCH',
  '일정 조율 불가': 'SCHEDULE_CONFLICT',
  '기타': 'OTHER',
}

export async function approveContractorRequest(requestId: string) {
  if (/^\d+$/.test(requestId)) await approveRequest(Number(requestId))
}

export async function rejectContractorRequest(requestId: string, reason: string) {
  if (!/^\d+$/.test(requestId)) return
  const code = rejectReasonCodes[reason] ?? 'OTHER'
  await rejectRequest(Number(requestId), code, code === 'OTHER' ? reason : undefined)
}
