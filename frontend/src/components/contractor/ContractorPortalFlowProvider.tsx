import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  contractorChatMessages,
  contractorDefaultVisitSchedule,
  contractorVisitChangeRequest,
} from '@/mocks/contractorPortalMockData'
import type { ContractorChatMessage, ContractorVisitSchedule, ContractorVisitStatus } from '@/types/contractorPortal'
import { ContractorPortalFlowContext, type ContractorPortalFlowContextValue } from './contractorPortalFlowContext'

export default function ContractorPortalFlowProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<readonly ContractorChatMessage[]>(contractorChatMessages)
  const [visitStatus, setVisitStatus] = useState<ContractorVisitStatus>('UNSCHEDULED')
  const [visitSchedule, setVisitSchedule] = useState<ContractorVisitSchedule | null>(null)
  const messageSequence = useRef(0)

  const value = useMemo<ContractorPortalFlowContextValue>(() => ({
    messages,
    visitStatus,
    visitSchedule,
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
  }), [messages, visitSchedule, visitStatus])

  return <ContractorPortalFlowContext.Provider value={value}>{children}</ContractorPortalFlowContext.Provider>
}
