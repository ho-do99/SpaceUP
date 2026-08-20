import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getChatMessages, getChatThreads, readChat, sendChatMessage } from '@/api/chatApi'
import { readChatContextNotifications } from '@/api/notificationApi'

import backIcon from '@/assets/user/icons/back.svg'
import ContractorChatBubble from '@/components/contractor/ContractorChatBubble'
import ContractorChatComposer from '@/components/contractor/ContractorChatComposer'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import useContractorRequest, { isLiveContractorRequestId } from '@/hooks/useContractorRequest'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import type { ContractorChatMessage } from '@/types/contractorPortal'
import type { ChatThread, SiteVisit } from '@/types/backendContractor'
import useRealtime from '@/contexts/useRealtime'
import { getVisit } from '@/api/visitApi'
import { formatBrowserTime24 } from '@/utils/browserDateTime'

import ContractorRequestNotFound from './ContractorRequestNotFound'

interface ContractorChatPageProps {
  completed?: boolean
}

export default function ContractorChatPage({
  completed = false,
}: ContractorChatPageProps) {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { latestEvent, refreshUnreadNotificationCount } = useRealtime()
  const liveRequestId = isLiveContractorRequestId(requestId)
  const numericRequestId = liveRequestId ? Number(requestId) : 0
  const liveRequest = useContractorRequest(requestId)
  const request = liveRequestId
    ? liveRequest.request
    : findContractorRequestDetail(requestId)

  const { messages: mockMessages, addMessage: addMockMessage } =
    useContractorPortalFlow()
  const [liveRoom, setLiveRoom] = useState<{ requestId: number; messages: ContractorChatMessage[]; thread: ChatThread | null }>({ requestId: 0, messages: [], thread: null })
  const [liveVisitState, setLiveVisitState] = useState<{ requestId: number; visit: SiteVisit | null; loading: boolean; error: string }>({ requestId: 0, visit: null, loading: false, error: '' })
  const [liveError, setLiveError] = useState<string | null>(null)
  const [sendingRequestId, setSendingRequestId] = useState<number | null>(null)
  const roomLoadSequence = useRef(0)
  const visitLoadSequence = useRef(0)
  const activeLiveRoom = liveRoom.requestId === numericRequestId ? liveRoom : null
  const activeLiveThread = activeLiveRoom?.thread ?? null
  const activeLiveVisitState = liveVisitState.requestId === numericRequestId ? liveVisitState : null
  const messages = liveRequestId ? activeLiveRoom?.messages ?? [] : mockMessages

  const acknowledgeLiveRoom = useCallback(async (requestId: number, contractorId: number) => {
    await Promise.allSettled([
      readChat(requestId),
      readChatContextNotifications(requestId, contractorId),
    ])
    await refreshUnreadNotificationCount()
  }, [refreshUnreadNotificationCount])

  const loadLiveRoom = useCallback((requestId: number) => {
    const sequence = ++roomLoadSequence.current
    return Promise.all([getChatMessages(requestId), getChatThreads()])
      .then(([chatMessages, threads]) => {
        if (sequence !== roomLoadSequence.current) return
        const matchingThread = threads.find((thread) => thread.requestId === requestId) ?? null
        setLiveRoom({
          requestId,
          messages: chatMessages.map((message) => ({
            id: String(message.id),
            sender: message.senderType === 'SYSTEM' ? 'system' : message.senderType === 'CONTRACTOR' ? 'contractor' : 'customer',
            text: message.content,
            timeLabel: formatBrowserTime24(message.createdAt),
          })),
          thread: matchingThread,
        })
        setLiveError(null)
        if (matchingThread) void acknowledgeLiveRoom(requestId, matchingThread.contractorId)
      })
      .catch(() => {
        if (sequence !== roomLoadSequence.current) return
        setLiveRoom({ requestId, messages: [], thread: null })
        setLiveError('채팅 내용을 불러오지 못했습니다.')
      })
  }, [acknowledgeLiveRoom])

  useEffect(() => {
    roomLoadSequence.current += 1
    if (!liveRequestId) return
    setLiveRoom({ requestId: numericRequestId, messages: [], thread: null })
    setLiveError(null)
    void loadLiveRoom(numericRequestId)
    return () => { roomLoadSequence.current += 1 }
  }, [liveRequestId, loadLiveRoom, numericRequestId])
  const loadLiveVisit = useCallback((requestId: number) => {
    const sequence = ++visitLoadSequence.current
    setLiveVisitState({ requestId, visit: null, loading: true, error: '' })
    return getVisit(requestId)
      .then((visit) => {
        if (sequence === visitLoadSequence.current) {
          setLiveVisitState({ requestId, visit, loading: false, error: '' })
        }
      })
      .catch(() => {
        if (sequence === visitLoadSequence.current) {
          setLiveVisitState({ requestId, visit: null, loading: false, error: '방문 일정을 불러오지 못했습니다.' })
        }
      })
  }, [])

  useEffect(() => {
    visitLoadSequence.current += 1
    if (!liveRequestId) return
    void loadLiveVisit(numericRequestId)
    return () => { visitLoadSequence.current += 1 }
  }, [liveRequestId, loadLiveVisit, numericRequestId])

  useEffect(() => {
    if (!liveRequestId || latestEvent?.type !== 'CHAT_MESSAGE' || latestEvent.requestId !== numericRequestId) return
    void Promise.all([loadLiveRoom(numericRequestId), loadLiveVisit(numericRequestId)])
  }, [latestEvent, liveRequestId, loadLiveRoom, loadLiveVisit, numericRequestId])

  const addMessage = async (content: string) => {
    if (!liveRequestId) {
      addMockMessage(content)
      return
    }
    if (!activeLiveThread?.contactable || sendingRequestId === numericRequestId) {
      setLiveError('종료된 채팅방에는 메시지를 보낼 수 없습니다.')
      return
    }
    const sendRequestId = numericRequestId
    setSendingRequestId(sendRequestId)
    try {
      const message = await sendChatMessage(sendRequestId, content)
      setLiveRoom((current) => {
        if (current.requestId !== sendRequestId || current.messages.some((item) => item.id === String(message.id))) return current
        return {
          ...current,
          messages: [...current.messages, {
            id: String(message.id), sender: 'contractor', text: message.content,
            timeLabel: formatBrowserTime24(message.createdAt),
          }],
        }
      })
      setLiveError(null)
    } catch (sendError) {
      setLiveError(sendError instanceof Error ? sendError.message : '메시지를 보내지 못했습니다.')
    } finally {
      setSendingRequestId((current) => current === sendRequestId ? null : current)
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

  const visitLookupError = activeLiveVisitState?.error ?? ''
  const hasCompletedVisit = liveRequestId
    ? activeLiveVisitState?.visit?.status === 'COMPLETED'
    : completed
  const visitPagePath = liveRequestId
    ? `/contractor/requests/${requestId}/visit`
    : hasCompletedVisit
      ? `/contractor/requests/${request?.requestId}/visit?mode=completed`
      : `/contractor/requests/${request?.requestId}/visit`
  const estimatePagePath = liveRequestId
    ? `/contractor/requests/${requestId}/estimate-ready`
    : `/contractor/requests/${request?.requestId}/estimate-ready?mode=completed`
  const showActions = !liveRequestId || (activeLiveThread !== null && activeLiveVisitState?.loading === false && !visitLookupError)
  const liveVisit = activeLiveVisitState?.visit
  const visitScheduleLabel = liveVisit?.visitDate
    ? `${liveVisit.visitDate.replace(/-/g, '.')} ${liveVisit.visitTime?.slice(0, 5) ?? ''}`.trim()
    : ''
  const visitHeadline = hasCompletedVisit
    ? '현장 확인 완료 · 견적 작성 가능'
    : liveVisit?.status === 'CHANGE_REQUESTED'
      ? '방문 일정 변경 요청 확인 중'
      : liveVisit?.status === 'SCHEDULED'
        ? '현장 방문 일정 확정'
        : '의뢰 승인 완료 · 실시간 채팅 중'
  const visitDescription = hasCompletedVisit
    ? `실제 현장 방문 완료${visitScheduleLabel ? ` · ${visitScheduleLabel}` : ''}`
    : liveVisit?.status === 'CHANGE_REQUESTED'
      ? `변경 희망 일정 ${liveVisit.requestedDate?.replace(/-/g, '.') ?? ''} ${liveVisit.requestedTime?.slice(0, 5) ?? ''}`.trim()
      : visitScheduleLabel || '사용자와 현장 방문 일정을 조율해 주세요.'


  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <header className="relative flex h-14 shrink-0 items-center border-b border-[#e2e8f0] bg-white px-4">
        <button type="button" aria-label="뒤로가기" onClick={() => navigate(-1)} className="mr-2 flex h-10 w-3 items-center justify-center"><img src={backIcon} alt="" className="h-5 w-5 max-w-none" /></button>
        <h1 className="text-[17px] font-bold leading-[25px] text-[#1e293b]">{liveRequestId ? activeLiveThread?.counterpartName ?? '채팅' : request?.customerName ?? '채팅'} 사용자</h1>
        <p className="ml-auto text-[10px] font-bold text-[#64748b]">{liveRequestId ? activeLiveThread?.requestCode ?? requestId : request?.requestId}</p>
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
          <h2 className="text-sm font-bold text-[#2563eb]">{visitHeadline}</h2>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">{visitDescription}</p>
        </section>
        <section className="mb-4 rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
          <h2 className="text-sm font-bold text-[#ef4444]">7일 자동 취소 안내</h2>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">마지막 활동 후 7일 동안 채팅, 방문 일정 등록 또는 견적서 작성이 없으면 의뢰가 자동으로 취소됩니다.</p>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">144시간: D-1 알림 · 168시간: 자동 취소</p>
        </section>


        <div className="space-y-3">
          {messages.map((message) => (
            <ContractorChatBubble
              key={message.id}
              message={message}
            />
          ))}
        </div>

        {liveError ? <p role="alert" className="mt-4 text-center text-xs font-bold text-[#dc2626]">{liveError}</p> : null}
        {visitLookupError ? <p role="alert" className="mt-4 text-center text-xs font-bold text-[#dc2626]">{visitLookupError}</p> : null}

        {hasCompletedVisit ? (
          <div className="mt-4 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3 text-xs leading-5 text-[#047857]">
            <p className="font-bold">
              현장 방문 완료
            </p>

            <p>
              방문일 {visitScheduleLabel || '확인 완료'} · 이제 견적서를
              작성할 수 있습니다.
            </p>
          </div>
        ) : null}
      </div>

      {showActions ? <div className="grid shrink-0 grid-cols-2 gap-2 bg-[#f8fafc] px-4 py-3">
        <Link
          to={visitPagePath}
          className="flex h-11 items-center justify-center rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
        >
          {hasCompletedVisit
            ? '방문 일정 확인'
            : '현장 방문 일정 잡기'}
        </Link>

        {hasCompletedVisit ? (
          <Link
            to={estimatePagePath}
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
        {!hasCompletedVisit ? <p className="col-span-2 text-[10px] leading-4 text-[#64748b]">실제 현장 방문 완료 처리 후 견적서를 작성할 수 있습니다.</p> : null}
      </div> : <div className="shrink-0 bg-[#f8fafc] px-4 py-2 text-center text-[10px] text-[#64748b]">현장방문·견적 작성 화면은 기존 흐름을 유지하며 다음 단계에서 연결합니다.</div>}

      <ContractorChatComposer
        onSend={(message) => void addMessage(message)}
        enabled={!liveRequestId || activeLiveThread?.contactable === true}
        sending={sendingRequestId === numericRequestId}
      />
    </ContractorMobileShell>
  )
}
