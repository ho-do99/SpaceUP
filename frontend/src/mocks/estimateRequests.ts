export type EstimateRequestStatus = 'requested' | 'reviewing'

export interface EstimateRequestSummary {
  id: string
  contractorId: string
  contractorName: string
  regionAndSpecialty: string
  requestedAtLabel: string
  itemCountLabel: string
  status: EstimateRequestStatus
  statusLabel: string
  progressLabel: string
  budgetLabel: string
  preferredDateLabel: string
  requestMessage: string
  selectedItems: readonly string[]
  responseStatusLabel: string
}

export const estimateRequests: readonly EstimateRequestSummary[] = [
  {
    id: 'request-space-design',
    contractorId: 'space-design-interior',
    contractorName: '공간디자인 인테리어',
    regionAndSpecialty: '광주 북구 · 리모델링 전문',
    requestedAtLabel: '2025-05-20',
    itemCountLabel: '2개 항목',
    status: 'requested',
    statusLabel: '요청 완료',
    progressLabel: '견적 요청 접수 완료 · 시공사 답변 확인 가능',
    budgetLabel: '700만원',
    preferredDateLabel: '2025-07-15',
    requestMessage: '부분 리모델링 견적 요청',
    selectedItems: ['주방', '조명'],
    responseStatusLabel: '견적 요청 접수 완료 · 시공사 답변 확인 가능',
  },
  {
    id: 'request-house-up',
    contractorId: 'house-up-interior',
    contractorName: '하우스업 인테리어',
    regionAndSpecialty: '광주 북구 · 리모델링 전문',
    requestedAtLabel: '2025-05-18',
    itemCountLabel: '2개 항목',
    status: 'reviewing',
    statusLabel: '검토 중',
    progressLabel: '시공사 검토 중 · 답변 대기',
    budgetLabel: '800만원',
    preferredDateLabel: '2025-07-20',
    requestMessage: '노후 마감재 교체 견적 요청',
    selectedItems: ['바닥재', '벽지'],
    responseStatusLabel: '시공사 검토 중 · 답변 대기',
  },
]

export function getEstimateRequestById(requestId: string | undefined) {
  return estimateRequests.find((request) => request.id === requestId)
}
