import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  contractorChatMessages,
  contractorDefaultEstimateDraft,
  contractorDefaultVisitSchedule,
  contractorEstimateRevisionRequest,
  contractorProjectMocks,
  contractorVisitChangeRequest,
} from '@/mocks/contractorPortalMockData'
import type {
  ContractorChatMessage,
  ContractorEstimateDraft,
  ContractorEstimateLifecycleStatus,
  ContractorEstimateStatus,
  ContractorEstimateSubmission,
  ContractorEstimateValidityExtension,
  ContractorContractConversion,
  ContractorProject,
  ContractorProjectChangeRequest,
  ContractorProjectCompletionRequest,
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
  const [contractConversion, setContractConversion] = useState<ContractorContractConversion | null>(null)
  const [projects, setProjects] = useState<readonly ContractorProject[]>(contractorProjectMocks)
  const [projectChangeRequest, setProjectChangeRequest] = useState<ContractorProjectChangeRequest | null>(null)
  const [projectCompletionRequest, setProjectCompletionRequest] = useState<ContractorProjectCompletionRequest | null>(null)
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
    contractConversion,
    projects,
    projectChangeRequest,
    projectCompletionRequest,
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
    completeContractConversion: () => {
      setContractConversion({ estimateId: 'SP-20260724-001', requestId: 'REQ-260715-012', projectId: 'PRJ-20260724-001', convertedAt: '2026-07-24' })
      setProjects((current) => current.map((project) => project.projectId === 'PRJ-20260724-001' ? { ...project, status: 'START_SCHEDULED' } : project))
    },
    updateProjectSchedule: (projectId, startDate, completionDate, reason) => {
      setProjects((current) => current.map((project) => project.projectId === projectId ? { ...project, schedule: { ...project.schedule, startDate, completionDate } } : project))
      setProjectChangeRequest({
        previousStartDate: projects.find((project) => project.projectId === projectId)?.schedule.startDate ?? startDate,
        previousCompletionDate: projects.find((project) => project.projectId === projectId)?.schedule.completionDate ?? completionDate,
        changedStartDate: startDate,
        changedCompletionDate: completionDate,
        reason: reason.trim(),
      })
    },
    startProject: (projectId) => setProjects((current) => current.map((project) => project.projectId === projectId && project.status === 'START_SCHEDULED' ? {
      ...project,
      status: 'IN_PROGRESS',
      checklist: [
        { id: 'demolition', label: '철거 공사 완료', completed: true },
        { id: 'floor', label: '바닥재 시공 완료', completed: true },
        { id: 'wallpaper', label: '벽지 시공 진행 중', completed: true },
        { id: 'inspection', label: '최종 점검 예정', completed: false },
      ],
    } : project)),
    requestProjectCompletion: (projectId) => {
      setProjects((current) => current.map((project) => project.projectId === projectId && project.status === 'IN_PROGRESS' ? { ...project, status: 'COMPLETION_REQUESTED' } : project))
      setProjectCompletionRequest({ requestedAt: '2026-08-07', status: 'REQUESTED' })
    },
  }), [contractConversion, estimateAcceptedAt, estimateDraft, estimateLifecycleStatus, estimateStatus, estimateSubmission, estimateValidUntil, estimateViewedAt, messages, projectChangeRequest, projectCompletionRequest, projects, revisionSubmittedAt, validityExtension, visitSchedule, visitStatus])

  return <ContractorPortalFlowContext.Provider value={value}>{children}</ContractorPortalFlowContext.Provider>
}
