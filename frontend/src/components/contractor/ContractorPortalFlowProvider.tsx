import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  contractorChatMessages,
  contractorDefaultEstimateDraft,
  contractorDefaultVisitSchedule,
  contractorEstimateRevisionRequest,
  contractorVisitChangeRequest,
} from '@/mocks/contractorPortalMockData'
import type {
  ContractorChatMessage,
  ContractorEstimateDraft,
  ContractorEstimateLifecycleStatus,
  ContractorEstimateStatus,
  ContractorEstimateSubmission,
  ContractorEstimateValidityExtension,
  ContractorVisitSchedule,
  ContractorVisitStatus,
} from '@/types/contractorPortal'
import { ContractorPortalFlowContext, type ContractorPortalFlowContextValue } from './contractorPortalFlowContext'

export default function ContractorPortalFlowProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<readonly ContractorChatMessage[]>(contractorChatMessages)
  const [visitStatus, setVisitStatus] = useState<ContractorVisitStatus>('UNSCHEDULED')
  const [visitSchedule, setVisitSchedule] = useState<ContractorVisitSchedule | null>(null)
  const [estimateDraft, setEstimateDraft] = useState<ContractorEstimateDraft | null>(null)
  const [estimateStatus, setEstimateStatus] = useState<ContractorEstimateStatus>('NOT_STARTED')
  const [estimateSubmission, setEstimateSubmission] = useState<ContractorEstimateSubmission | null>(null)
  const [estimateLifecycleStatus, setEstimateLifecycleStatus] = useState<ContractorEstimateLifecycleStatus>('SUBMITTED')
  const [estimateValidUntil, setEstimateValidUntil] = useState('2026-08-07')
  const [estimateViewedAt, setEstimateViewedAt] = useState<string | null>(null)
  const [revisionSubmittedAt, setRevisionSubmittedAt] = useState<string | null>(null)
  const [estimateAcceptedAt, setEstimateAcceptedAt] = useState<string | null>(null)
  const [validityExtension, setValidityExtension] = useState<ContractorEstimateValidityExtension | null>(null)
  const messageSequence = useRef(0)

  const value = useMemo<ContractorPortalFlowContextValue>(() => ({
    messages,
    visitStatus,
    visitSchedule,
    estimateDraft,
    estimateStatus,
    estimateSubmission,
    estimateLifecycleStatus,
    estimateValidUntil,
    estimateViewedAt,
    revisionRequest: contractorEstimateRevisionRequest,
    revisionSubmittedAt,
    estimateAcceptedAt,
    validityExtension,
    changeRequest: contractorVisitChangeRequest,
    addMessage: (text) => {
      const normalizedText = text.trim()
      if (!normalizedText) return
      messageSequence.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `local-message-${messageSequence.current}`,
          sender: 'contractor',
          text: normalizedText,
          timeLabel: '10:40',
        },
      ])
    },
    registerVisit: (schedule) => {
      setVisitSchedule(schedule)
      setVisitStatus('SCHEDULED')
    },
    showChangeRequest: () => setVisitStatus('CHANGE_REQUESTED'),
    acceptChangeRequest: () => {
      const current = visitSchedule ?? contractorDefaultVisitSchedule
      setVisitSchedule({
        ...current,
        date: contractorVisitChangeRequest.requestedDate,
        time: contractorVisitChangeRequest.requestedTime,
      })
      setVisitStatus('SCHEDULED')
    },
    proposeVisit: (schedule) => {
      setVisitSchedule(schedule)
      setVisitStatus('SCHEDULED')
    },
    rejectChangeRequest: () => {
      setVisitSchedule((current) => current ?? contractorDefaultVisitSchedule)
      setVisitStatus('SCHEDULED')
    },
    completeVisit: () => {
      const current = visitSchedule ?? contractorDefaultVisitSchedule
      setVisitSchedule({
        ...current,
        note: '바닥 상태와 벽지 교체를 위한 치수를 확인했습니다.',
        completedAt: `${current.date} ${current.time}`,
      })
      setVisitStatus('COMPLETED')
    },
    saveEstimateDraft: (draft) => {
      setEstimateDraft(draft)
      setEstimateStatus('DRAFT')
    },
    prepareEstimatePreview: (draft) => {
      setEstimateDraft(draft)
      setEstimateStatus('READY_TO_PREVIEW')
    },
    submitEstimate: () => {
      setEstimateDraft((current) => current ?? contractorDefaultEstimateDraft)
      setEstimateStatus('SUBMITTED')
      setEstimateSubmission({
        estimateNumber: 'SP-20260724-001',
        submittedDate: '2026-07-24',
        validUntil: '2026-08-07',
      })
      setEstimateLifecycleStatus('SUBMITTED')
      setEstimateValidUntil('2026-08-07')
      setEstimateViewedAt(null)
      setRevisionSubmittedAt(null)
      setEstimateAcceptedAt(null)
    },
    markEstimateViewed: () => {
      setEstimateViewedAt('2026-07-24')
      setEstimateLifecycleStatus('VIEWING')
    },
    showEstimateRevisionRequest: () => setEstimateLifecycleStatus('REVISION_REQUESTED'),
    resubmitEstimate: (draft) => {
      setEstimateDraft(draft)
      setEstimateStatus('SUBMITTED')
      setEstimateSubmission({
        estimateNumber: 'SP-20260724-001',
        submittedDate: '2026-07-24',
        validUntil: estimateValidUntil,
      })
      setRevisionSubmittedAt('2026-07-24')
      setEstimateLifecycleStatus('RESUBMITTED')
    },
    acceptEstimate: () => {
      setEstimateAcceptedAt('2026-07-24')
      setEstimateLifecycleStatus('ACCEPTED')
    },
    extendEstimateValidity: (validUntil, note) => {
      setValidityExtension({
        previousValidUntil: estimateValidUntil,
        extendedValidUntil: validUntil,
        note: note.trim(),
        extendedAt: '2026-07-24',
      })
      setEstimateValidUntil(validUntil)
      setEstimateSubmission((current) => current ? { ...current, validUntil } : current)
    },
  }), [estimateAcceptedAt, estimateDraft, estimateLifecycleStatus, estimateStatus, estimateSubmission, estimateValidUntil, estimateViewedAt, messages, revisionSubmittedAt, validityExtension, visitSchedule, visitStatus])

  return <ContractorPortalFlowContext.Provider value={value}>{children}</ContractorPortalFlowContext.Provider>
}
