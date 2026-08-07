import floorPlanFallback from '@/assets/user/images/floor-plan-preview.png'
import type { AnalysisJobResponse } from '@/types/analysis'
import type { ContractorRequest, ContractorRequestDetail, ContractorRequestStatus } from '@/types/contractorPortal'
import type { RequestImageResponse, RequestResponse } from '@/types/request'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'

const won = new Intl.NumberFormat('ko-KR')

function statusOf(request: RequestResponse): ContractorRequestStatus {
  if (request.participationStatus === 'SELECTED' || request.status === 'COMPLETED') return 'matched'
  if (request.participationStatus === 'REJECTED' || request.participationStatus === 'CLOSED') return 'user_canceled'
  if (request.status === 'CANCELED') return 'auto_canceled'
  if (request.status === 'IN_PROGRESS' || request.participationStatus === 'APPROVED') return 'in_progress'
  if (request.status === 'REVIEWING' || request.status === 'QUOTE_REQUESTED') return 'reviewing'
  return 'new'
}

const labels: Record<ContractorRequestStatus, string> = {
  new: '신규', reviewing: '검토 중', in_progress: '진행 중', matched: '성사',
  user_canceled: '미성사', auto_canceled: '자동 취소', expired: '만료',
}

function budgetLabel(request: RequestResponse) {
  if (request.budgetMin != null && request.budgetMax != null) {
    return `${won.format(request.budgetMin)}~${won.format(request.budgetMax)}원`
  }
  const budget = request.budget ?? request.budgetMin ?? request.budgetMax
  return budget == null ? '협의' : `${won.format(budget)}원`
}

function quoteLabel(analysis?: AnalysisJobResponse | null) {
  if (analysis?.estimatedQuoteMin != null && analysis.estimatedQuoteMax != null) {
    return `${won.format(analysis.estimatedQuoteMin)}~${won.format(analysis.estimatedQuoteMax)}원`
  }
  return '분석 대기 중'
}

export function requestToContractorCard(request: RequestResponse): ContractorRequest {
  const status = statusOf(request)
  return {
    requestId: String(request.id),
    customerName: request.landlordName || '사용자',
    maskedPhone: '계약 전 비공개',
    property: {
      region: request.region,
      address: request.region,
      propertyType: request.propertyType.toUpperCase().includes('APART') ? '아파트' : '빌라',
      areaLabel: `${request.areaM2}㎡`,
    },
    budgetLabel: budgetLabel(request),
    estimatedCostLabel: request.acceptedQuoteAmount != null ? `${won.format(request.acceptedQuoteAmount)}원` : '분석 대기 중',
    matchScore: request.matchingScore ?? 0,
    desiredSchedule: request.desiredDate || '협의',
    status,
    statusLabel: labels[status],
    lastActivityLabel: request.lastActivityAt?.slice(0, 10) || request.createdAt?.slice(0, 10) || '-',
  }
}

export function requestToContractorDetail(
  request: RequestResponse,
  images: RequestImageResponse[] = [],
  analysis?: AnalysisJobResponse | null,
): ContractorRequestDetail {
  const card = requestToContractorCard(request)
  const floorPlan = images.find((image) => image.imageType === 'FLOOR_PLAN')
  const photos = images.filter((image) => image.imageType === 'PHOTO')
  const payback = analysis?.paybackPeriodMonthsMin != null
    ? `${analysis.paybackPeriodMonthsMin}~${analysis.paybackPeriodMonthsMax ?? analysis.paybackPeriodMonthsMin}개월`
    : '분석 대기 중'
  return {
    ...card,
    estimatedCostLabel: quoteLabel(analysis),
    analysis: {
      rooms: analysis?.roomCount ?? 0,
      bathrooms: analysis?.bathroomCount ?? 0,
      hasBalcony: analysis?.hasBalcony ?? false,
      kitchenType: analysis?.kitchenType || '분석 대기 중',
      ceilingHeight: analysis?.ceilingHeightM != null ? `${analysis.ceilingHeightM}m` : '미입력',
    },
    selectedItems: request.requestedItems?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
    lightingNotice: '조명은 현장 전기 배선 확인 후 최종 견적이 확정됩니다.',
    valueIncrease: {
      currentMonthlyRent: request.monthlyRent != null ? `${won.format(request.monthlyRent)}원` : '미입력',
      expectedMonthlyIncrease: analysis?.expectedRentIncreaseMin != null ? `${won.format(analysis.expectedRentIncreaseMin)}원` : '분석 대기',
      recoveryPeriod: payback,
    },
    floorPlanImage: floorPlan ? resolveApiAssetUrl(floorPlan.imageUrl) || floorPlanFallback : floorPlanFallback,
    photos: photos.map((photo, index) => ({
      id: String(photo.id), label: `공간 사진 ${index + 1}`,
      image: resolveApiAssetUrl(photo.imageUrl) || photo.imageUrl,
    })),
  }
}
