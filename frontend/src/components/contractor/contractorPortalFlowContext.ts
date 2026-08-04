import { createContext } from 'react'
import type {
  ContractorChatMessage,
  ContractorEstimateDraft,
  ContractorEstimateStatus,
  ContractorEstimateSubmission,
  ContractorVisitChangeRequest,
  ContractorVisitSchedule,
  ContractorVisitStatus,
} from '@/types/contractorPortal'

export interface ContractorPortalFlowContextValue {
  messages: readonly ContractorChatMessage[]
  visitStatus: ContractorVisitStatus
  visitSchedule: ContractorVisitSchedule | null
  estimateDraft: ContractorEstimateDraft | null
  estimateStatus: ContractorEstimateStatus
  estimateSubmission: ContractorEstimateSubmission | null
  changeRequest: ContractorVisitChangeRequest
  addMessage: (text: string) => void
  registerVisit: (schedule: ContractorVisitSchedule) => void
  showChangeRequest: () => void
  acceptChangeRequest: () => void
  proposeVisit: (schedule: ContractorVisitSchedule) => void
  rejectChangeRequest: () => void
  completeVisit: () => void
  saveEstimateDraft: (draft: ContractorEstimateDraft) => void
  prepareEstimatePreview: (draft: ContractorEstimateDraft) => void
  submitEstimate: () => void
}

export const ContractorPortalFlowContext = createContext<ContractorPortalFlowContextValue | null>(null)
