import { createContext } from 'react'
import type {
  ContractorChatMessage,
  ContractorVisitChangeRequest,
  ContractorVisitSchedule,
  ContractorVisitStatus,
} from '@/types/contractorPortal'

export interface ContractorPortalFlowContextValue {
  messages: readonly ContractorChatMessage[]
  visitStatus: ContractorVisitStatus
  visitSchedule: ContractorVisitSchedule | null
  changeRequest: ContractorVisitChangeRequest
  addMessage: (text: string) => void
  registerVisit: (schedule: ContractorVisitSchedule) => void
  showChangeRequest: () => void
  acceptChangeRequest: () => void
  proposeVisit: (schedule: ContractorVisitSchedule) => void
  rejectChangeRequest: () => void
  completeVisit: () => void
}

export const ContractorPortalFlowContext = createContext<ContractorPortalFlowContextValue | null>(null)
