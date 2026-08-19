import floorPlanImage from '@/assets/user/images/floor-plan-preview.png'
import livingRoomImage from '@/assets/user/images/simulation-before.png'
import kitchenImage from '@/assets/user/images/simulation-upload-preview.png'
import bathroomImage from '@/assets/user/images/style-marble.png'
import entranceImage from '@/assets/user/images/style-modern.png'
import type {
  ContractorChatMessage,
  ContractorEstimateDraft,
  ContractorEstimateRevisionRequest,
  ContractorProject,
  ContractorNotification,
  ContractorReview,
  ContractorReviewSummary,
  ContractorSettlement,
  ContractorSentEstimate,
  ContractorRequest,
  ContractorRequestDetail,
  ContractorVisitChangeRequest,
  ContractorVisitSchedule,
} from '@/types/contractorPortal'

export const contractorRequests: readonly ContractorRequest[] = [
  {
    requestId: 'REQ-260715-012',
    customerName: '김지선',
    maskedPhone: '010-12**-****',
    property: {
      region: '광주 서구',
      address: '광주 서구 ○○아파트 101동 1203호',
      propertyType: '아파트',
      areaLabel: '84㎡',
    },
    budgetLabel: '15,000,000원',
    estimatedCostLabel: '5,650,000원~7,750,000원',
    matchScore: 92,
    desiredSchedule: '2026년 8월',
    status: 'new',
    statusLabel: '신규',
    lastActivityLabel: '20분 전',
    deadlineLabel: 'D-7',
  },
  {
    requestId: 'REQ-260715-011',
    customerName: '이수민',
    maskedPhone: '010-34**-****',
    property: {
      region: '서울 마포구',
      address: '서울 마포구 아파트',
      propertyType: '아파트',
      areaLabel: '42㎡',
    },
    budgetLabel: '5,000,000원~10,000,000원',
    estimatedCostLabel: '6,200,000원~7,800,000원',
    matchScore: 88,
    desiredSchedule: '2026년 8월',
    status: 'reviewing',
    statusLabel: '검토 중',
    lastActivityLabel: '6일 전',
    deadlineLabel: 'D-1',
  },
  {
    requestId: 'REQ-260701-008',
    customerName: '박서준',
    maskedPhone: '010-56**-****',
    property: {
      region: '경기 성남시',
      address: '경기 성남시 아파트',
      propertyType: '아파트',
      areaLabel: '59㎡',
    },
    budgetLabel: '10,000,000원 이상',
    estimatedCostLabel: '12,000,000원~15,000,000원',
    matchScore: 85,
    desiredSchedule: '2026년 9월',
    status: 'auto_canceled',
    statusLabel: '자동 취소',
    lastActivityLabel: '168시간 미활동',
    terminationReason: '168시간 미응답',
    terminationDateLabel: '자동 취소 2026.07.08 09:00',
  },
  {
    requestId: 'REQ-260710-004',
    customerName: '정민수',
    maskedPhone: '010-78**-****',
    property: {
      region: '서울 강서구',
      address: '서울 강서구 아파트',
      propertyType: '아파트',
      areaLabel: '84㎡',
    },
    budgetLabel: '10,000,000원 이상',
    estimatedCostLabel: '9,500,000원~12,000,000원',
    matchScore: 76,
    desiredSchedule: '2026년 8월',
    status: 'contractor_rejected',
    statusLabel: '시공사 거절',
    lastActivityLabel: '2026.07.11 11:20',
    terminationReason: '지역 미지원',
    terminationDateLabel: '마지막 활동 2026.07.11 11:20',
  },
  {
    requestId: 'REQ-260701-003',
    customerName: '윤서진',
    maskedPhone: '010-65**-****',
    property: {
      region: '서울 성동구',
      address: '서울 성동구 빌라',
      propertyType: '빌라',
      areaLabel: '42㎡',
    },
    budgetLabel: '협의',
    estimatedCostLabel: '분석 완료',
    matchScore: 81,
    desiredSchedule: '2026년 8월',
    status: 'auto_canceled',
    statusLabel: '자동 취소',
    lastActivityLabel: '2026.07.08 09:30',
    terminationReason: '168시간 미활동으로 자동 취소',
    terminationDateLabel: '마지막 활동 2026.07.08 09:30',
    unsuccessfulView: 'contractor_rejected',
  },
  {
    requestId: 'REQ-260710-004',
    customerName: '최은영',
    maskedPhone: '010-91**-****',
    property: {
      region: '서울 송파구',
      address: '서울 송파구 아파트',
      propertyType: '아파트',
      areaLabel: '59㎡',
    },
    budgetLabel: '5,000,000원~10,000,000원',
    estimatedCostLabel: '6,800,000원~8,200,000원',
    matchScore: 83,
    desiredSchedule: '2026년 9월',
    status: 'user_canceled',
    statusLabel: '사용자 취소',
    lastActivityLabel: '2026.07.10 14:20',
    terminationReason: '사용자 사정으로 취소',
    terminationDateLabel: '마지막 업데이트 2026.07.10 14:20',
  },
  {
    requestId: 'REQ-260706-012',
    customerName: '오현지',
    maskedPhone: '010-43**-****',
    property: {
      region: '광주 북구',
      address: '광주 북구 빌라',
      propertyType: '빌라',
      areaLabel: '42㎡',
    },
    budgetLabel: '5,000,000원~10,000,000원',
    estimatedCostLabel: '5,200,000원~7,100,000원',
    matchScore: 79,
    desiredSchedule: '2026년 8월',
    status: 'expired',
    statusLabel: '요청 만료',
    lastActivityLabel: '2026.07.13 23:59',
    terminationReason: '요청 유효기간 만료',
    terminationDateLabel: '만료 2026.07.13 23:59',
  },
  {
    requestId: 'REQ-260715-012',
    customerName: '김지선',
    maskedPhone: '계약 후 공개',
    property: {
      region: '서울 강남구',
      address: '서울 강남구 역삼동 빌라',
      propertyType: '빌라',
      areaLabel: '33㎡',
    },
    budgetLabel: '48,000,000원',
    estimatedCostLabel: '48,000,000원',
    matchScore: 92,
    desiredSchedule: '2026년 8월',
    status: 'matched',
    statusLabel: '성사',
    lastActivityLabel: '계약 완료',
    projectTitle: '역삼동 빌라 도배 및 바닥시공',
    contractSummary: '계약 ₩48,000,000 · 담당 김현수',
    progressSummary: '성사 · 계약 완료',
    detailHref: '/contractor/projects/PRJ-20260724-001',
  },
  {
    requestId: 'REQ-260710-007',
    customerName: '박서연',
    maskedPhone: '계약 후 공개',
    property: {
      region: '서울 성동구',
      address: '서울 성동구 성수동 빌라',
      propertyType: '빌라',
      areaLabel: '42㎡',
    },
    budgetLabel: '협의',
    estimatedCostLabel: '계약 진행',
    matchScore: 87,
    desiredSchedule: '2026년 8월',
    status: 'matched',
    statusLabel: '성사',
    lastActivityLabel: '견적 전환 완료',
    projectTitle: '성수동 빌라',
    contractSummary: '계약 진행',
    progressSummary: '성사 · 견적 전환 완료',
  },
]

function createContractorRequestDetail(request: ContractorRequest): ContractorRequestDetail {
  return {
    ...request,
    analysis: {
      rooms: 2,
      bathrooms: 1,
      hasBalcony: true,
      kitchenType: '분리형 주방',
      ceilingHeight: '2.3m',
    },
    selectedItems: ['바닥재', '벽지', '조명'],
    lightingNotice: '조명은 현장 실측 후 별도 협의 · 현재 견적 금액 미포함',
    floorPlanImage,
    hasLinkedFloorPlan: true,
    photos: [
      { id: 'living-room', label: '거실', image: livingRoomImage },
      { id: 'kitchen', label: '주방', image: kitchenImage },
      { id: 'bathroom', label: '욕실', image: bathroomImage },
      { id: 'entrance', label: '현관', image: entranceImage },
    ],
  }
}

export const contractorRequestDetails: readonly ContractorRequestDetail[] = [
  createContractorRequestDetail(contractorRequests[0]),
  createContractorRequestDetail(contractorRequests[1]),
  createContractorRequestDetail(contractorRequests[8]),
  createContractorRequestDetail({
    requestId: 'REQ-260718-002',
    customerName: '박민지',
    maskedPhone: '010-45**-****',
    property: {
      region: '광주 광산구',
      address: '광주 광산구 수완지구',
      propertyType: '빌라',
      areaLabel: '42㎡',
    },
    budgetLabel: '협의',
    estimatedCostLabel: '계약 진행',
    matchScore: 87,
    desiredSchedule: '2026년 8월',
    status: 'matched',
    statusLabel: '성사',
    lastActivityLabel: '방문 예정',
  }),
]

export const contractorChatMessages: readonly ContractorChatMessage[] = [
  {
    id: 'chat-1',
    sender: 'customer',
    text: '안녕하세요. 방문 가능한 시간을 알려주세요.',
    timeLabel: '10:32',
  },
  {
    id: 'chat-2',
    sender: 'contractor',
    text: '오늘 오후 3시에 방문 가능합니다.',
    timeLabel: '10:35',
  },
]

export const contractorDefaultVisitSchedule: ContractorVisitSchedule = {
  date: '2026-07-24',
  time: '15:00',
  address: '광주 서구 ○○아파트 101동 1203호',
  managerName: '김현수',
  note: '바닥 상태와 수납 치수를 확인합니다.',
}

export const contractorVisitChangeRequest: ContractorVisitChangeRequest = {
  requestedBy: 'customer',
  previousDate: '2026-07-24',
  previousTime: '15:00',
  requestedDate: '2026-07-25',
  requestedTime: '14:00',
  reason: '사용자 일정으로 방문 날짜 변경을 요청했습니다.',
}

export const contractorDefaultEstimateDraft: ContractorEstimateDraft = {
  requestId: 'REQ-260715-012',
  measurement: {
    floorArea: 59,
    wallpaperArea: 168,
    ceilingHeight: 2.4,
    rooms: 3,
    bathrooms: 2,
    siteCondition: '기존 자재 철거 필요',
  },
  categories: [
    {
      id: 'floor',
      label: '바닥재',
      productName: 'KCC · 숲 소리순 · 내추럴 오크',
      area: 59,
      unitPrice: 32000,
      costs: [
        { id: 'material', label: '자재비', amount: 1888000 },
        { id: 'labor', label: '시공비', amount: 1200000 },
        { id: 'demolition', label: '철거비', amount: 300000 },
        { id: 'waste', label: '폐기물 처리비', amount: 100000 },
        { id: 'supplies', label: '접착제·부자재비', amount: 162000 },
        { id: 'other', label: '기타 비용', amount: 50000 },
      ],
      sectionTotal: 3700000,
    },
    {
      id: 'wallpaper',
      label: '벽지',
      productName: 'LX하우시스 · 베스띠 · 실크벽지 · 웜 화이트',
      area: 168,
      unitPrice: 9500,
      costs: [
        { id: 'material', label: '자재비', amount: 800000 },
        { id: 'labor', label: '시공비', amount: 600000 },
        { id: 'demolition', label: '철거비', amount: 150000 },
        { id: 'waste', label: '폐기물 처리비', amount: 100000 },
        { id: 'supplies', label: '접착제·부자재비', amount: 100000 },
        { id: 'other', label: '기타 비용', amount: 50000 },
      ],
      sectionTotal: 1700000,
    },
  ],
  additionalCosts: [
    { id: 'elevator', label: '엘리베이터 사용료', amount: 100000 },
    { id: 'parking', label: '주차비', amount: 50000 },
  ],
  discountAmount: 50000,
  vatIncluded: true,
  supplyAmount: 5000000,
  vatAmount: 500000,
  condition: {
    startDate: '2026-08-05',
    durationDays: 3,
    completionDate: '2026-08-07',
    validityDays: 14,
    paymentTerms: {
      depositPercent: 20,
      interimPercent: 40,
      balancePercent: 40,
    },
    warrantyLabel: '시공 완료 후 1년',
  },
  notes: '기존 바닥 철거 후 바닥 상태에 따라 일부 보수 비용이 추가될 수 있습니다.\n정확한 시공 일정은 계약 확정 후 안내드립니다.',
}

export const contractorSentEstimates: readonly ContractorSentEstimate[] = [
  {
    estimateId: 'SP-20260724-001',
    requestId: 'REQ-260715-012',
    customerName: '김지선',
    contractorName: '(주)스페이스 인테리어',
    region: '광주 서구',
    propertyType: '아파트',
    areaLabel: '84㎡',
    address: '광주 서구 ○○아파트 101동 1203호',
    submittedDate: '2026-07-24',
    initialValidUntil: '2026-08-07',
    finalAmount: 5500000,
  },
]

export const contractorEstimateRevisionRequest: ContractorEstimateRevisionRequest = {
  requestedAt: '2026-07-24',
  requestedBy: '김지선',
  reason: '수납 공사 범위와 자재 브랜드를 확인해주세요.',
  items: ['시공 시작 일정 조정 요청', '추가 비용 항목 확인 요청'],
}

export const contractorProjectMocks: readonly ContractorProject[] = [
  {
    projectId: 'PRJ-20260724-001',
    estimateId: 'SP-20260724-001',
    requestId: 'REQ-260715-012',
    name: '광주 서구 ○○아파트 바닥재 및 벽지 시공',
    customerName: '김지선',
    managerName: '김현수',
    address: '광주 서구 ○○아파트 101동 1203호',
    contractAmount: 5500000,
    contractDate: '2026-07-24',
    constructionItems: ['바닥재', '벽지'],
    lightingNotice: '조명은 현장 실측 후 별도 협의 · 현재 계약 금액 미포함',
    status: 'START_SCHEDULED',
    schedule: { startDate: '2026-08-05', completionDate: '2026-08-07' },
    checklist: [
      { id: 'materials', label: '자재 준비 완료', completed: true },
      { id: 'schedule', label: '공사 일정 확정', completed: true },
      { id: 'customer-check', label: '사용자 최종 확인', completed: true },
      { id: 'site-entry', label: '현장 진입 준비', completed: true },
    ],
    customerRequest: '사용자 요청 없음',
  },
  {
    projectId: 'PRJ-20260718-002', estimateId: 'SP-20260718-002', requestId: 'REQ-260718-002',
    name: '수완지구 투룸', customerName: '박민지', managerName: '박지민',
    address: '광주 광산구 수완지구', contractAmount: 26500000, contractDate: '2026-07-18',
    constructionItems: ['바닥재', '벽지'], lightingNotice: '조명은 계약 금액 미포함', status: 'VISIT_SCHEDULED',
    schedule: { startDate: '2026-08-12', completionDate: '2026-09-05', visitDate: '2026-07-20', visitTime: '14:00' },
    checklist: [], customerRequest: '사용자 요청 없음',
  },
  {
    projectId: 'PRJ-20260715-003', estimateId: 'SP-20260715-003', requestId: 'REQ-260715-003',
    name: '광주 첨단 빌라', customerName: '이서연', managerName: '김도윤',
    address: '광주 광산구 첨단지구', contractAmount: 29000000, contractDate: '2026-07-15',
    constructionItems: ['바닥재', '벽지'], lightingNotice: '조명은 계약 금액 미포함', status: 'IN_PROGRESS',
    schedule: { startDate: '2026-07-15', completionDate: '2026-08-10' },
    checklist: [
      { id: 'demolition', label: '철거 공사 완료', completed: true },
      { id: 'floor', label: '바닥재 시공 완료', completed: true },
      { id: 'wallpaper', label: '벽지 시공 진행 중', completed: true },
      { id: 'inspection', label: '최종 점검 예정', completed: false },
    ], customerRequest: '추가 요청 없음',
  },
  {
    projectId: 'PRJ-20260710-004', estimateId: 'SP-20260710-004', requestId: 'REQ-260710-004',
    name: '수완지구 빌라', customerName: '정우진', managerName: '김현수',
    address: '광주 광산구 수완지구', contractAmount: 39500000, contractDate: '2026-07-10',
    constructionItems: ['바닥재', '벽지'], lightingNotice: '조명은 계약 금액 미포함', status: 'COMPLETED',
    schedule: { startDate: '2026-07-15', completionDate: '2026-07-18' },
    checklist: [
      { id: 'demolition', label: '철거 공사 완료', completed: true },
      { id: 'floor', label: '바닥재 시공 완료', completed: true },
      { id: 'wallpaper', label: '벽지 시공 완료', completed: true },
      { id: 'inspection', label: '최종 점검 완료', completed: true },
    ], customerRequest: '추가 요청 없음', readOnlyPaymentLabel: '결제 완료',
  },
]

export const contractorSettlementSummary = {
  totalContractAmount: 152000000,
  pendingAmount: 23500000,
  completedAmount: 68730000,
  paidAmount: 136800000,
} as const

export const contractorSettlements: readonly ContractorSettlement[] = [
  {
    settlementId: 'ST-2607-011',
    projectName: '성수동 빌라',
    customerName: '김지선',
    contractorName: '(주)스페이스 인테리어',
    status: 'SCHEDULED',
    breakdown: { customerPaymentAmount: 18000000, platformFeeRate: 10, platformFeeAmount: 1800000, settlementAmount: 16200000 },
    scheduledDate: '2026-08-12',
    statement: { bankName: '국민은행', maskedAccountNumber: '**-9021', taxInvoiceStatus: '발행 예정' },
  },
  {
    settlementId: 'ST-2607-008',
    projectId: 'PRJ-20260724-001',
    estimateId: 'SP-20260724-001',
    requestId: 'REQ-260715-012',
    projectName: '역삼동 빌라 벽지 및 장판 시공',
    customerName: '김지선',
    contractorName: '(주)스페이스 인테리어',
    status: 'PAID',
    breakdown: { customerPaymentAmount: 30000000, platformFeeRate: 10, platformFeeAmount: 3000000, settlementAmount: 27000000 },
    paidDate: '2026-08-05',
    statement: {
      settlementPeriod: '2026.07.01–2026.07.31', contractNumber: 'CT-2607-008', contractDate: '2026-07-01', constructionCompletedDate: '2026-07-28',
      bankName: '국민은행', maskedAccountNumber: '123456-**-9021', accountHolder: '㈜스페이스 인테리어', taxInvoiceStatus: '발행 완료',
      taxInvoiceEmail: 'tax@spaceup.co.kr', businessNumber: '123-45-67890', taxInvoiceIssuedDate: '2026-08-05',
    },
  },
  {
    settlementId: 'ST-2607-009',
    projectName: '수완지구 원룸',
    customerName: '정우진',
    contractorName: '(주)스페이스 인테리어',
    status: 'ON_HOLD',
    breakdown: { customerPaymentAmount: 15000000, platformFeeRate: 5, platformFeeAmount: 750000, settlementAmount: 14250000 },
    holdDate: '2026-08-07',
    holdReason: '정산 계좌 정보가 등록 정보와 일치하지 않습니다.\n업체정보의 정산 탭에서 계좌 정보를 확인한 후 다시 요청해 주세요.',
    statement: { bankName: '확인 필요', maskedAccountNumber: '확인 필요', taxInvoiceStatus: '발행 대기' },
  },
]

export function findContractorSettlement(settlementId: string | undefined) {
  return contractorSettlements.find((settlement) => settlement.settlementId === settlementId)
}

export const contractorNotificationMocks: readonly ContractorNotification[] = [
  {
    notificationId: 'NOTI-260724-001',
    type: 'REQUEST',
    title: '새로운 의뢰가 도착했습니다.',
    message: 'REQ-260715-012 · 광주 서구 아파트 의뢰를 확인하세요.',
    createdAtLabel: '5분 전',
    section: 'TODAY',
    isRead: false,
    destination: '/contractor/requests/REQ-260715-012',
  },
  {
    notificationId: 'NOTI-260724-002',
    type: 'ESTIMATE',
    title: '사용자가 견적을 확인했습니다.',
    message: 'SP-20260724-001 견적을 사용자가 확인했습니다.',
    createdAtLabel: '1시간 전',
    section: 'TODAY',
    isRead: false,
    destination: '/contractor/estimates/SP-20260724-001',
  },
  {
    notificationId: 'NOTI-260724-003',
    type: 'VISIT',
    title: '현장 방문 일정이 예정되어 있습니다.',
    message: '광주 서구 ○○아파트 · 2026.07.24 15:00',
    createdAtLabel: '오늘',
    section: 'TODAY',
    isRead: false,
    destination: '/contractor/requests/REQ-260715-012/visit',
  },
  {
    notificationId: 'NOTI-260716-004',
    type: 'SETTLEMENT',
    title: '정산 처리가 완료되었습니다.',
    message: 'ST-2607-008 정산 금액이 지급되었습니다.',
    createdAtLabel: '07.16',
    section: 'PREVIOUS',
    isRead: true,
    destination: '/contractor/settlements/ST-2607-008',
  },
]

export const contractorReviewSummary: ContractorReviewSummary = {
  contractorName: '(주)스페이스 인테리어',
  averageRating: 4.8,
  totalCount: 24,
  ratingCounts: { 5: 20, 4: 3, 3: 1, 2: 0, 1: 0 },
}

export const contractorReviewMocks: readonly ContractorReview[] = [
  {
    reviewId: 'REV-260723-001',
    userName: '홍*동',
    rating: 5,
    createdAt: '2026.07.23',
    projectName: '장판·벽지 시공',
    projectStatusLabel: '완료 2026.07.21',
    constructionItem: '장판·벽지 시공',
    region: '광주 북구',
    constructionPeriod: '2026.07.18 ~ 2026.07.21',
    completedAt: '2026.07.21',
    satisfactionLabel: '매우 만족해요',
    excerpt: '상담부터 시공 완료까지 안내가 친절했고,',
    content: '상담부터 시공 완료까지 안내가 친절했고,\n약속한 일정에 맞춰 깔끔하게 시공해주셨습니다.\n장판과 벽지 마감 상태도 만족스럽습니다.',
    keywords: ['일정을 잘 지켰어요', '마감이 깔끔해요'],
  },
  {
    reviewId: 'REV-260718-002',
    userName: '김*영',
    rating: 4,
    createdAt: '2026.07.18',
    projectName: '거실 장판 시공',
    projectStatusLabel: '완료 2026.07.16',
    constructionItem: '거실 장판 시공',
    completedAt: '2026.07.16',
    satisfactionLabel: '만족해요',
    excerpt: '현장 확인부터 견적 안내까지 설명이 자세했고,',
    content: '현장 확인부터 견적 안내까지 설명이 자세했고,\n문의할 때마다 빠르게 답변해주셨습니다.',
    keywords: ['상담이 자세해요', '소통이 빨라요'],
  },
]

export function findContractorReview(reviewId: string | undefined) {
  return contractorReviewMocks.find((review) => review.reviewId === reviewId)
}

export function findContractorProject(projectId: string | undefined) {
  return contractorProjectMocks.find((project) => project.projectId === projectId)
}

export function findContractorProjectByRequestId(requestId: string | undefined) {
  return contractorProjectMocks.find((project) => project.requestId === requestId)
}

export function findContractorRequest(requestId: string | undefined) {
  return contractorRequests.find((request) => request.requestId === requestId)
}
export function findContractorRequestDetail(requestId: string | undefined) {
  return contractorRequestDetails.find((request) => request.requestId === requestId)
}
export function findContractorSentEstimate(estimateId: string | undefined) {
  return contractorSentEstimates.find((estimate) => estimate.estimateId === estimateId)
}
