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

export type ContractorEstimateStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'READY_TO_PREVIEW'
  | 'SUBMITTED'

export type ContractorEstimateLifecycleStatus =
  | 'SUBMITTED'
  | 'VIEWING'
  | 'REVISION_REQUESTED'
  | 'RESUBMITTED'
  | 'ACCEPTED'

export type ContractorEstimateListFilter =
  | 'all'
  | 'submitted'
  | 'viewing'
  | 'accepted'

export type ContractorEstimateCategoryId = 'floor' | 'wallpaper'

export interface ContractorEstimateMeasurement {
  floorArea: number
  wallpaperArea: number
  ceilingHeight: number
  rooms: number
  bathrooms: number
  siteCondition: string
}

export interface ContractorEstimateCostItem {
  id: 'material' | 'labor' | 'demolition' | 'waste' | 'supplies' | 'other'
  label: string
  amount: number
}

export interface ContractorEstimateCategory {
  id: ContractorEstimateCategoryId
  label: string
  productName: string
  area: number
  unitPrice: number
  costs: readonly ContractorEstimateCostItem[]
  sectionTotal: number
}

export interface ContractorEstimateAdditionalCost {
  id: string
  label: string
  amount: number
}

export interface ContractorEstimatePaymentTerms {
  depositPercent: number
  interimPercent: number
  balancePercent: number
}

export interface ContractorEstimateCondition {
  startDate: string
  durationDays: number
  completionDate: string
  validityDays: number
  paymentTerms: ContractorEstimatePaymentTerms
  warrantyLabel: string
}

export interface ContractorEstimateDraft {
  requestId: string
  measurement: ContractorEstimateMeasurement
  categories: readonly ContractorEstimateCategory[]
  additionalCosts: readonly ContractorEstimateAdditionalCost[]
  discountAmount: number
  vatIncluded: boolean
  supplyAmount: number
  vatAmount: number
  condition: ContractorEstimateCondition
  notes: string
}

export interface ContractorEstimateSubmission {
  estimateNumber: string
  submittedDate: string
  validUntil: string
}

export interface ContractorEstimateRevisionRequest {
  requestedAt: string
  requestedBy: string
  reason: string
  items: readonly string[]
}

export interface ContractorEstimateValidityExtension {
  previousValidUntil: string
  extendedValidUntil: string
  note: string
  extendedAt: string
}

export interface ContractorSentEstimate {
  estimateId: string
  requestId: string
  customerName: string
  contractorName: string
  region: string
  propertyType: string
  areaLabel: string
  address: string
  submittedDate: string
  initialValidUntil: string
  finalAmount: number
}

export type ContractorProjectStatus =
  | 'VISIT_SCHEDULED'
  | 'START_SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETION_REQUESTED'
  | 'COMPLETED'

export type ContractorProjectFilter =
  | 'all'
  | 'visit_scheduled'
  | 'start_scheduled'
  | 'in_progress'
  | 'completed'

export interface ContractorProjectSchedule {
  startDate: string
  completionDate: string
  visitDate?: string
  visitTime?: string
}

export interface ContractorProjectChecklistItem {
  id: string
  label: string
  completed: boolean
}

export interface ContractorProjectChangeRequest {
  previousStartDate: string
  previousCompletionDate: string
  changedStartDate: string
  changedCompletionDate: string
  reason: string
}

export interface ContractorProjectCompletionRequest {
  requestedAt: string
  status: 'REQUESTED'
}

export interface ContractorContractConversion {
  estimateId: string
  requestId: string
  projectId: string
  convertedAt: string
}

export interface ContractorProject {
  projectId: string
  estimateId: string
  requestId: string
  name: string
  customerName: string
  managerName: string
  address: string
  contractAmount: number
  contractDate: string
  constructionItems: readonly string[]
  lightingNotice: string
  status: ContractorProjectStatus
  schedule: ContractorProjectSchedule
  checklist: readonly ContractorProjectChecklistItem[]
  customerRequest: string
  readOnlyPaymentLabel?: string
}

export type ContractorSettlementStatus = 'SCHEDULED' | 'PAID' | 'ON_HOLD'

export type ContractorSettlementFilter = 'all' | 'scheduled' | 'paid' | 'on_hold'

export interface ContractorSettlementBreakdown {
  customerPaymentAmount: number
  platformFeeRate: number
  platformFeeAmount: number
  settlementAmount: number
}

export interface ContractorSettlementStatement {
  settlementPeriod?: string
  contractNumber?: string
  contractDate?: string
  constructionCompletedDate?: string
  bankName: string
  maskedAccountNumber: string
  accountHolder?: string
  taxInvoiceStatus: string
  taxInvoiceEmail?: string
  businessNumber?: string
  taxInvoiceIssuedDate?: string
}

export interface ContractorSettlement {
  settlementId: string
  projectId?: string
  estimateId?: string
  requestId?: string
  projectName: string
  customerName?: string
  contractorName: string
  status: ContractorSettlementStatus
  breakdown: ContractorSettlementBreakdown
  scheduledDate?: string
  paidDate?: string
  holdDate?: string
  holdReason?: string
  statement: ContractorSettlementStatement
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
