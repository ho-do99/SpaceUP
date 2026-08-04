import { createContext } from 'react'
import type {
  ContractorChatMessage,
  ContractorEstimateDraft,
  ContractorEstimateLifecycleStatus,
  ContractorEstimateRevisionRequest,
  ContractorEstimateStatus,
  ContractorEstimateSubmission,
  ContractorEstimateValidityExtension,
  ContractorContractConversion,
  ContractorProject,
  ContractorProjectChangeRequest,
  ContractorProjectCompletionRequest,
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
  estimateLifecycleStatus: ContractorEstimateLifecycleStatus
  estimateValidUntil: string
  estimateViewedAt: string | null
  revisionRequest: ContractorEstimateRevisionRequest
  revisionSubmittedAt: string | null
  estimateAcceptedAt: string | null
  validityExtension: ContractorEstimateValidityExtension | null
  contractConversion: ContractorContractConversion | null
  projects: readonly ContractorProject[]
  projectChangeRequest: ContractorProjectChangeRequest | null
  projectCompletionRequest: ContractorProjectCompletionRequest | null
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
  markEstimateViewed: () => void
  showEstimateRevisionRequest: () => void
  resubmitEstimate: (draft: ContractorEstimateDraft) => void
  acceptEstimate: () => void
  extendEstimateValidity: (validUntil: string, note: string) => void
  completeContractConversion: () => void
  updateProjectSchedule: (projectId: string, startDate: string, completionDate: string, reason: string) => void
  startProject: (projectId: string) => void
  requestProjectCompletion: (projectId: string) => void
}

export const ContractorPortalFlowContext = createContext<ContractorPortalFlowContextValue | null>(null)
