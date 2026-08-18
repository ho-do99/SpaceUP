import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChatMessages, getChatThreads, readChat, sendChatMessage } from '@/api/chatApi'

import backIcon from '@/assets/user/icons/back.svg'
import ContractorChatBubble from '@/components/contractor/ContractorChatBubble'
import ContractorChatComposer from '@/components/contractor/ContractorChatComposer'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import type { ContractorChatMessage } from '@/types/contractorPortal'
import type { ChatThread } from '@/types/backendContractor'
import useRealtime from '@/contexts/useRealtime'

import ContractorRequestNotFound from './ContractorRequestNotFound'

interface ContractorChatPageProps {
  completed?: boolean
}

export default function ContractorChatPage({
  completed = false,
}: ContractorChatPageProps) {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { latestEvent } = useRealtime()
  const numericRequestId = Number(requestId)
  const liveRequestId = Number.isInteger(numericRequestId) && numericRequestId > 0

  const request =
    findContractorRequestDetail(requestId)

  const { messages: mockMessages, addMessage: addMockMessage } =
    useContractorPortalFlow()
  const [liveMessages, setLiveMessages] = useState<ContractorChatMessage[]>([])
  const [liveThread, setLiveThread] = useState<ChatThread | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
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
        void readChat(numericRequestId).catch(() => undefined)
      })
      .catch(() => {
        if (active) setLiveError('채팅 내용을 불러오지 못했습니다.')
      })
    return () => { active = false }
  }, [liveRequestId, numericRequestId])

  useEffect(() => {
    if (!liveRequestId || latestEvent?.type !== 'CHAT_MESSAGE' || latestEvent.requestId !== numericRequestId) return
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
        void readChat(numericRequestId).catch(() => undefined)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [latestEvent, liveRequestId, numericRequestId])

  const addMessage = async (content: string) => {
    if (!liveRequestId) {
      addMockMessage(content)
      return
    }
    if (!liveThread?.contactable || sending) {
      setLiveError('종료된 채팅방에는 메시지를 보낼 수 없습니다.')
      return
    }
    setSending(true)
    try {
      const message = await sendChatMessage(numericRequestId, content)
      setLiveMessages((current) => current.some((item) => item.id === String(message.id)) ? current : [...current, {
        id: String(message.id), sender: 'contractor', text: message.content,
        timeLabel: message.createdAt?.slice(11, 16) || '',
      }])
      setLiveError(null)
    } catch (sendError) {
      setLiveError(sendError instanceof Error ? sendError.message : '메시지를 보내지 못했습니다.')
    } finally {
      setSending(false)
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
      <header className="relative flex h-14 shrink-0 items-center border-b border-[#e2e8f0] bg-white px-4">
        <button type="button" aria-label="뒤로가기" onClick={() => navigate(-1)} className="mr-2 flex h-10 w-3 items-center justify-center"><img src={backIcon} alt="" className="h-5 w-5 max-w-none" /></button>
        <h1 className="text-[17px] font-bold leading-[25px] text-[#1e293b]">{request?.customerName ?? liveThread?.counterpartName ?? '채팅'} 사용자</h1>
        <p className="ml-auto text-[10px] font-bold text-[#64748b]">{request?.requestId ?? liveThread?.requestCode ?? requestId}</p>
      </header>

      <div
        ref={messagesRef}
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        <section className="mb-3 rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
          <h2 className="text-sm font-bold text-[#0b2b59]">안전한 거래 안내</h2>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">안전한 거래와 개인정보 보호를 위해 사용자와의 소통은 이 채팅 안에서 진행해 주세요.</p>
        </section>
        <section className="mb-3 rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
          <h2 className="text-sm font-bold text-[#2563eb]">{completed ? '현장 확인 완료 · 견적 작성 가능' : '의뢰 승인 완료 · 실시간 채팅 중'}</h2>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">{completed ? '실제 현장 방문 완료 · 2026.07.24 15:40' : '사용자와 현장 방문 일정을 조율해 주세요.'}</p>
        </section>
        <section className="mb-4 rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
          <h2 className="text-sm font-bold text-[#ef4444]">7일 자동 취소 안내</h2>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">마지막 활동 후 7일 동안 채팅, 방문 일정 등록 또는 견적서 작성이 없으면 의뢰가 자동으로 취소됩니다.</p>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">144시간: D-1 알림 · 168시간: 자동 취소</p>
        </section>

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
        {!completed ? <p className="col-span-2 text-[10px] leading-4 text-[#64748b]">실제 현장 방문 완료 처리 후 견적서를 작성할 수 있습니다.</p> : null}
      </div> : <div className="shrink-0 bg-[#f8fafc] px-4 py-2 text-center text-[10px] text-[#64748b]">현장방문·견적 작성 화면은 기존 흐름을 유지하며 다음 단계에서 연결합니다.</div>}

      <ContractorChatComposer
        onSend={(message) => void addMessage(message)}
        enabled={!liveRequestId || liveThread?.contactable === true}
        sending={sending}
      />
    </ContractorMobileShell>
  )
}
