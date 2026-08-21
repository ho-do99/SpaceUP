import contractorBuildingIcon from '@/assets/user/images/contractors/contractor-building.svg'
import spaceDesignPortfolio from '@/assets/user/images/contractors/space-design-portfolio.png'
import type { ContractorProfile, RecommendedContractor } from '@/types/backendContractor'
import type { ContractorSummary } from '@/mocks/contractors'

const won = new Intl.NumberFormat('ko-KR')

function budgetLabel(min?: number | null, max?: number | null) {
  if (min == null && max == null) return '업체 문의'
  if (min != null && max != null) return `${won.format(min)}~${won.format(max)}원`
  return `${won.format(min ?? max ?? 0)}원부터`
}

export function recommendationToSummary(item: RecommendedContractor): ContractorSummary {
  const reviewScore = Math.round(item.reviewScore ?? 0)
  const priceScore = Math.round(item.priceScore ?? 0)
  const responseSpeedScore = Math.round(item.scheduleScore ?? 0)

  return {
    id: String(item.contractorId),
    companyName: item.companyName || `시공사 #${item.contractorId}`,
    initial: (item.companyName || '시').slice(0, 1),
    region: '요청 지역 시공 가능',
    experienceLabel: 'SpaceUP 추천 시공사',
    rating: item.rating ?? 0,
    reviewCount: item.reviewCount ?? 0,
    matchingScore: Math.round(item.matchScore ?? 0),
    reviewScore,
    priceScore,
    responseSpeedScore,
    similarProjectCount: 0,
    specialties: ['바닥재', '도배', '조명'],
    recommendation: `리뷰 ${reviewScore}점 · 가격 ${priceScore}점 · 응답속도 ${responseSpeedScore}점`,
    description: '리뷰 평가, 예상 견적 적합도, 응답속도를 종합해 추천된 시공사입니다.',
    budgetRangeLabel: budgetLabel(item.estimateMin, item.estimateMax),
    availableDateLabel: item.availableDate ? `${item.availableDate} 이후` : '일정 협의',
    responseTimeLabel: '빠른 응답 가능',
    recommendationReasons: [
      `리뷰 ${reviewScore}점 · 평점 ${Number(item.rating ?? 0).toFixed(1)} / 후기 ${item.reviewCount ?? 0}건`,
      `가격 ${priceScore}점 · 요청 예산과 업체 견적 범위 반영`,
      `응답속도 ${responseSpeedScore}점 · 상담 응답 기준 반영`,
    ],
    iconSrc: contractorBuildingIcon,
    portfolioSrc: spaceDesignPortfolio,
    portfolioAlt: `${item.companyName} 포트폴리오`,
  }
}

export function profileToSummary(profile: ContractorProfile): ContractorSummary {
  const name = profile.companyName || profile.memberName || `시공사 #${profile.memberId}`
  return {
    id: String(profile.memberId),
    companyName: name,
    initial: name.slice(0, 1),
    region: profile.activityRegions || '활동 지역 미등록',
    experienceLabel: '시공사 프로필',
    rating: profile.rating ?? 0,
    reviewCount: profile.reviewCount ?? 0,
    matchingScore: 0,
    similarProjectCount: profile.completedProjectCount ?? 0,
    specialties: profile.specialties?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
    recommendation: profile.introduction || '등록된 업체 소개가 없습니다.',
    description: profile.introduction || '등록된 업체 소개가 없습니다.',
    budgetRangeLabel: budgetLabel(profile.estimateMin, profile.estimateMax),
    availableDateLabel: profile.availableFromDate ? `${profile.availableFromDate} 이후` : '일정 협의',
    responseTimeLabel: '채팅으로 확인',
    recommendationReasons: ['SpaceUP 등록 시공사', '요청 조건은 견적 전 확인 필요'],
    iconSrc: contractorBuildingIcon,
    portfolioSrc: profile.portfolioUrl || spaceDesignPortfolio,
    portfolioAlt: `${name} 포트폴리오`,
  }
}
