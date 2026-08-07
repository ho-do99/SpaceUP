import featureFloorplanIcon from '@/assets/user/home/feature-floorplan.svg'
import feature3DIcon from '@/assets/user/home/feature-3d.svg'
import featureEstimateIcon from '@/assets/user/home/feature-estimate.svg'
import featureContractorIcon from '@/assets/user/home/feature-contractor.svg'
import featureAiIcon from '@/assets/user/home/feature-ai.svg'

import flowHomeIcon from '@/assets/user/home/flow-home.svg'
import flowFloorplanIcon from '@/assets/user/home/flow-floorplan.svg'
import flowSpaceIcon from '@/assets/user/home/flow-space.svg'
import flowEstimateIcon from '@/assets/user/home/flow-estimate.svg'
import flowContractorIcon from '@/assets/user/home/flow-contractor.svg'

export interface HomeFeature {
  title: string
  description: string
  icon: string
}

export interface HomeFlowStep {
  step: number
  title: string
  icon: string
}

export const homeFeatures: ReadonlyArray<HomeFeature> = [
  {
    title: '평면도 분석',
    description: 'AI가 공간명과\n면적을 분석해요',
    icon: featureFloorplanIcon,
  },
  {
    title: '3D 공간 확인',
    description: '공간 구조를\n직관적으로 확인해요',
    icon: feature3DIcon,
  },
  {
    title: '예상 견적',
    description: '자재와 시공비를\n미리 확인해요',
    icon: featureEstimateIcon,
  },
  {
    title: '시공사 추천',
    description: '조건에 맞는\n시공사를 연결해요',
    icon: featureContractorIcon,
  },
  {
    title: 'AI 스타일 시뮬레이션',
    description: 'Before·After 이미지를 생성해요',
    icon: featureAiIcon,
  },
]

export const homeFlowSteps: ReadonlyArray<HomeFlowStep> = [
  {
    step: 1,
    title: '주택 선택',
    icon: flowHomeIcon,
  },
  {
    step: 2,
    title: '평면도 분석',
    icon: flowFloorplanIcon,
  },
  {
    step: 3,
    title: '공간 확인',
    icon: flowSpaceIcon,
  },
  {
    step: 4,
    title: '예상 견적',
    icon: flowEstimateIcon,
  },
  {
    step: 5,
    title: '시공사 연결',
    icon: flowContractorIcon,
  },
]

export const homeRecommendations: ReadonlyArray<string> = [
  '인테리어를 처음 준비하는 분',
  '예산에 맞는 시공 계획이 필요한 분',
  '여러 시공사를 쉽게 비교하고 싶은 분',
]