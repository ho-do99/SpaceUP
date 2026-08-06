import contractorBuildingIcon from '@/assets/user/images/contractors/contractor-building.svg'
import houseUpPortfolio from '@/assets/user/images/contractors/house-up-portfolio.png'
import spaceDesignPortfolio from '@/assets/user/images/contractors/space-design-portfolio.png'

export interface ContractorSummary {
  id: string
  companyName: string
  initial: string
  region: string
  experienceLabel: string
  rating: number
  reviewCount: number
  matchingScore: number
  similarProjectCount: number
  specialties: readonly string[]
  recommendation: string
  description: string
  budgetRangeLabel: string
  availableDateLabel: string
  responseTimeLabel: string
  recommendationReasons: readonly string[]
  iconSrc: string
  portfolioSrc: string
  portfolioAlt: string
}

export const contractors: readonly ContractorSummary[] = [
  {
    id: 'space-design-interior',
    companyName: '공간디자인 인테리어',
    initial: '공',
    region: '광주 북구',
    experienceLabel: '모던 스타일 시공 경험',
    rating: 4.8,
    reviewCount: 128,
    matchingScore: 95,
    similarProjectCount: 24,
    specialties: ['바닥재', '도배', '조명', '주방'],
    recommendation: '유사한 모던 거실 시공 사례를 보유했어요.',
    description: '소형 주택과 원룸 리모델링 경험이 풍부하며, 예산 안에서 실용적인 공간 개선안을 제안합니다.',
    budgetRangeLabel: '500만~1,500만원',
    availableDateLabel: '2025.06 이후',
    responseTimeLabel: '평균 1영업일 내 응답',
    recommendationReasons: ['광주 북구 지역 일치 · 예산 범위 적합', '원룸 리모델링 경험 다수 · 빠른 응답'],
    iconSrc: contractorBuildingIcon,
    portfolioSrc: spaceDesignPortfolio,
    portfolioAlt: '공간디자인 인테리어의 모던 거실 시공 사례',
  },
  {
    id: 'house-up-interior',
    companyName: '하우스업 인테리어',
    initial: '하',
    region: '광주 북구',
    experienceLabel: '모던 스타일 시공 경험',
    rating: 4.8,
    reviewCount: 96,
    matchingScore: 88,
    similarProjectCount: 18,
    specialties: ['바닥재', '도배', '조명', '주방'],
    recommendation: '차분한 색감의 리모델링 경험이 많아요.',
    description: '마감재 교체와 수납 개선에 강점이 있으며, 임대용 주택의 유지관리 편의성을 중시합니다.',
    budgetRangeLabel: '500만~1,500만원',
    availableDateLabel: '2025.06 이후',
    responseTimeLabel: '평균 2영업일 내 응답',
    recommendationReasons: ['예산 범위 적합 · 마감재 시공 후기 우수', '임대 주택 시공 경험 · 일정 조율 가능'],
    iconSrc: contractorBuildingIcon,
    portfolioSrc: houseUpPortfolio,
    portfolioAlt: '하우스업 인테리어의 모던 거실 시공 사례',
  },
  {
    id: 'better-home-interior',
    companyName: '더 좋은 집 인테리어',
    initial: '더',
    region: '광주 북구',
    experienceLabel: '모던 스타일 시공 경험',
    rating: 4.7,
    reviewCount: 84,
    matchingScore: 82,
    similarProjectCount: 12,
    specialties: ['조명', '도배', '주방', '바닥재'],
    recommendation: '벽지·바닥재·조명 통합 시공에 강해요.',
    description: '조명과 욕실, 수납 중심의 부분 리모델링을 합리적인 비용으로 제공하는 지역 시공사입니다.',
    budgetRangeLabel: '500만~1,500만원',
    availableDateLabel: '2025.07 이후',
    responseTimeLabel: '평균 2영업일 내 응답',
    recommendationReasons: ['부분 시공에 적합 · 지역 접근성 우수', '요청 항목 대응 가능 · 합리적인 견적'],
    iconSrc: contractorBuildingIcon,
    portfolioSrc: spaceDesignPortfolio,
    portfolioAlt: '더 좋은 집 인테리어의 모던 거실 시공 사례',
  },
]

export function getContractorById(contractorId: string | undefined) {
  return contractors.find((contractor) => contractor.id === contractorId)
}
