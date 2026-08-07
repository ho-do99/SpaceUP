import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getChatMessages, getChatThreads, sendChatMessage } from '@/api/chatApi'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorChatBubble from '@/components/contractor/ContractorChatBubble'
import ContractorChatComposer from '@/components/contractor/ContractorChatComposer'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import type { ContractorChatMessage } from '@/types/contractorPortal'
import type { ChatThread } from '@/types/backendContractor'

import ContractorRequestNotFound from './ContractorRequestNotFound'

interface ContractorChatPageProps {
  completed?: boolean
}

export default function ContractorChatPage({
  completed = false,
}: ContractorChatPageProps) {
  const { requestId } = useParams()
  const numericRequestId = Number(requestId)
  const liveRequestId = Number.isInteger(numericRequestId) && numericRequestId > 0

  const request =
    findContractorRequestDetail(requestId)

  const { messages: mockMessages, addMessage: addMockMessage } =
    useContractorPortalFlow()
  const [liveMessages, setLiveMessages] = useState<ContractorChatMessage[]>([])
  const [liveThread, setLiveThread] = useState<ChatThread | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)
  const messages = liveRequestId ? liveMessages : mockMessages

  useEffect(() => {
    if (!liveRequestId) return
    let active = true
    Promise.all([getChatMessages(numericRequestId), getChatThreads()])
      .then(([chatMessages, threads]) => {
        if (!active) return
        setLiveMessages(chatMessages.map((message) => ({
          id: String(message.id),
          sender: message.senderType === 'SYSTEM' ? 'system' : message.senderType === 'CONTRACTOR' ? 'contractor' : 'customer',
          text: message.content,
          timeLabel: message.createdAt?.slice(11, 16) || '',
        })))
        setLiveThread(threads.find((thread) => thread.requestId === numericRequestId) ?? null)
      })
      .catch(() => {
        if (active) setLiveError('채팅 내용을 불러오지 못했습니다.')
      })
    return () => { active = false }
  }, [liveRequestId, numericRequestId])

  const addMessage = async (content: string) => {
    if (!liveRequestId) {
      addMockMessage(content)
      return
    }
    try {
      const message = await sendChatMessage(numericRequestId, content)
      setLiveMessages((current) => [...current, {
        id: String(message.id), sender: 'contractor', text: message.content,
        timeLabel: message.createdAt?.slice(11, 16) || '',
      }])
      setLiveError(null)
    } catch {
      setLiveError('메시지를 보내지 못했습니다. 종료된 채팅방인지 확인해주세요.')
    }
  }

  const messagesRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesRef.current

    if (container) {
      container.scrollTop =
        container.scrollHeight
    }
  }, [messages.length])

  if (!request && !liveRequestId) {
    return <ContractorRequestNotFound />
  }

  const visitPagePath = completed
    ? `/contractor/requests/${request?.requestId}/visit?mode=completed`
    : `/contractor/requests/${request?.requestId}/visit`

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar
        title={request?.customerName ?? liveThread?.counterpartName ?? '채팅'}
        back
      />

      <section
        className={`shrink-0 border-b px-4 py-2 text-[11px] font-semibold ${
          completed
            ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]'
            : 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'
        }`}
      >
        <p>{request?.requestId ?? liveThread?.requestCode ?? requestId}</p>

        <p>
          {completed
            ? '현장 확인 완료 · 견적 작성 가능'
            : '의뢰 승인 완료 · 실시간 채팅 중'}
        </p>
      </section>

      <div
        ref={messagesRef}
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        <p className="mx-auto mb-4 max-w-[300px] rounded-lg bg-[#f1f5f9] px-3 py-2 text-center text-[10px] leading-4 text-[#64748b]">
          개인정보 보호를 위해 연락처와 외부 결제
          요청에 주의해 주세요.
        </p>

        <p className="mb-3 text-center text-[10px] text-[#94a3b8]">
          2026년 7월 24일
        </p>

        <div className="space-y-3">
          {messages.map((message) => (
            <ContractorChatBubble
              key={message.id}
              message={message}
            />
          ))}
        </div>

        {liveError ? <p role="alert" className="mt-4 text-center text-xs font-bold text-[#dc2626]">{liveError}</p> : null}

        {completed ? (
          <div className="mt-4 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3 text-xs leading-5 text-[#047857]">
            <p className="font-bold">
              현장 방문 완료
            </p>

            <p>
              방문일 2026.07.24 · 이제 견적서를
              작성할 수 있습니다.
            </p>
          </div>
        ) : null}
      </div>

      {!liveRequestId ? <div className="grid shrink-0 grid-cols-2 gap-2 bg-[#f8fafc] px-4 py-3">
        <Link
          to={visitPagePath}
          className="flex h-11 items-center justify-center rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
        >
          {completed
            ? '방문 일정 확인'
            : '현장 방문 일정 잡기'}
        </Link>

        {completed ? (
          <Link
            to={`/contractor/requests/${request?.requestId}/estimate-ready?mode=completed`}
            className="flex h-11 items-center justify-center rounded-lg bg-[#2563eb] text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
          >
            견적서 작성
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="h-11 rounded-lg bg-[#cbd5e1] text-xs font-bold text-white disabled:cursor-not-allowed"
          >
            견적서 작성
          </button>
        )}
      </div> : <div className="shrink-0 bg-[#f8fafc] px-4 py-2 text-center text-[10px] text-[#64748b]">현장방문·견적 작성 화면은 기존 흐름을 유지하며 다음 단계에서 연결합니다.</div>}

      <ContractorChatComposer
        onSend={(message) => void addMessage(message)}
      />
    </ContractorMobileShell>
  )
}
