export type ContractorRequestStatus =
  | 'new'
  | 'reviewing'
  | 'in_progress'
  | 'matched'
  | 'user_canceled'
  | 'auto_canceled'
  | 'expired'

export type ContractorRequestFilter = 'all' | 'in_progress' | 'matched' | 'unmatched'

export type ContractorRequestDetailTab = 'summary' | 'floor-plan' | 'photos' | 'analysis'

export type ContractorChatSender = 'customer' | 'contractor' | 'system'

export type ContractorVisitStatus =
  | 'UNSCHEDULED'
  | 'SCHEDULED'
  | 'CHANGE_REQUESTED'
  | 'COMPLETED'

export interface ContractorChatMessage {
  id: string
  sender: ContractorChatSender
  text: string
  timeLabel: string
}

export interface ContractorVisitSchedule {
  date: string
  time: string
  address: string
  managerName: string
  note: string
  completedAt?: string
}

export interface ContractorVisitChangeRequest {
  requestedBy: 'customer'
  previousDate: string
  previousTime: string
  requestedDate: string
  requestedTime: string
  reason: string
}

export interface PropertySummary {
  region: string
  address: string
  propertyType: '아파트' | '빌라'
  areaLabel: string
}
export interface AnalysisSummary {
  rooms: number
  bathrooms: number
  hasBalcony: boolean
  kitchenType: string
  ceilingHeight: string
}

export interface ValueIncreaseSummary {
  currentMonthlyRent: string
  expectedMonthlyIncrease: string
  recoveryPeriod: string
}

export interface ContractorRequest {
  requestId: string
  customerName: string
  maskedPhone: string
  property: PropertySummary
  budgetLabel: string
  estimatedCostLabel: string
  matchScore: number
  desiredSchedule: string
  status: ContractorRequestStatus
  statusLabel: string
  lastActivityLabel: string
  deadlineLabel?: string
}

export interface ContractorRequestDetail extends ContractorRequest {
  analysis: AnalysisSummary
  selectedItems: readonly string[]
  lightingNotice: string
  valueIncrease: ValueIncreaseSummary
  floorPlanImage: string
  photos: readonly {
    id: string
    label: string
    image: string
  }[]
}

export interface ContractorNavigationItem {
  id: 'home' | 'requests' | 'quotes' | 'schedule' | 'settlement'
  label: string
  destination?: string
  icon: string
}
