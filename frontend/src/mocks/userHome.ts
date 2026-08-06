import customRecommendationIcon from '@/assets/user/icons/custom-recommendation.svg'
import investmentAnalysisIcon from '@/assets/user/icons/investment-analysis.svg'
import spaceAnalysisIcon from '@/assets/user/icons/space-analysis.svg'

export interface HomeFeature {
  title: string
  description: string
  icon: string
}

export const homeFeatures: ReadonlyArray<HomeFeature> = [
  {
    title: '공간 분석',
    description: '평면도 기반 공간 정보를 분석해요',
    icon: spaceAnalysisIcon,
  },
  {
    title: '맞춤 추천',
    description: '월세 상승을 위한 리모델링을 추천해요',
    icon: customRecommendationIcon,
  },
  {
    title: '투자 분석',
    description: '주택 가치 상승 리포트로 수익성을 확인해요',
    icon: investmentAnalysisIcon,
  },
]

export const homeRecommendations: ReadonlyArray<string> = [
  '리모델링 후 주택 가치 상승 수익과 효과를 알고 싶은분',
  '공실로 고민하고 있는 임대인',
  '효율적인 인테리어 투자가 필요한 분',
]
