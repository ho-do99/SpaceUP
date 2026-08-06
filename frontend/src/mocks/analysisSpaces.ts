export type SpaceOptionId =
  | 'living-room'
  | 'kitchen'
  | 'room-1'
  | 'room-2'
  | 'balcony'
  | 'bathroom'

export type SpaceIconType = 'living' | 'kitchen' | 'room' | 'balcony' | 'bathroom'

export interface AnalyzedSpaceSummary {
  id: 'rooms' | 'bathrooms' | 'balcony' | 'kitchen' | 'ceiling-height'
  label: string
  value: string
}

export interface AnalyzedSpaceOption {
  id: SpaceOptionId
  name: string
  icon: SpaceIconType
  isRecommendationSupported: boolean
}

export const analyzedSpaceSummary: ReadonlyArray<AnalyzedSpaceSummary> = [
  { id: 'rooms', label: '방 개수', value: '2개' },
  { id: 'bathrooms', label: '욕실 개수', value: '1개' },
  { id: 'balcony', label: '발코니', value: '있음' },
  { id: 'kitchen', label: '주방 형태', value: '분리형' },
  { id: 'ceiling-height', label: '층고', value: '2.3m' },
]

export const analyzedSpaceOptions: ReadonlyArray<AnalyzedSpaceOption> = [
  { id: 'living-room', name: '거실', icon: 'living', isRecommendationSupported: true },
  { id: 'kitchen', name: '주방', icon: 'kitchen', isRecommendationSupported: true },
  { id: 'room-1', name: '방1', icon: 'room', isRecommendationSupported: true },
  { id: 'room-2', name: '방2', icon: 'room', isRecommendationSupported: true },
  { id: 'balcony', name: '발코니', icon: 'balcony', isRecommendationSupported: false },
  { id: 'bathroom', name: '욕실', icon: 'bathroom', isRecommendationSupported: false },
]
