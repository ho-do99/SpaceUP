import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  getChatMessages,
  getChatThreads,
  readChat,
  sendChatMessage,
} from '@/api/chatApi'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import useRealtime from '@/contexts/useRealtime'
import type { ChatThread } from '@/types/backendContractor'

interface DisplayMessage {
  id: string | number
  senderType:
    | 'LANDLORD'
    | 'CONTRACTOR'
    | 'SYSTEM'
  content: string
  createdAt?: string
  emphasis?: boolean
}

function CompanyIcon({
  size = 36,
}: {
  size?: number
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#eff6ff]"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="5.5"
          y="3.5"
          width="13"
          height="17"
          rx="1.5"
          stroke="#2563EB"
          strokeWidth="1.7"
        />

        <path
          d="M9 7H11M13 7H15M9 11H11M13 11H15M9 15H11M13 15H15"
          stroke="#2563EB"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        <path
          d="M10 20V17H14V20"
          stroke="#2563EB"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11C19 15.6 16.2 19.3 12 21C7.8 19.3 5 15.6 5 11V6L12 3Z"
        stroke="#2563EB"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9.5 12L11.2 13.7L14.8 10.1"
        stroke="#2563EB"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="#2563EB"
        strokeWidth="1.7"
      />

      <path
        d="M8.5 12L10.8 14.3L15.5 9.6"
        stroke="#2563EB"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="6"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 3V8M16 3V8M4 10H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function formatMessageTime(value?: string) {
  if (!value) return ''

  const match = value.match(
    /(?:T|\s)(\d{2}):(\d{2})/,
  )

  if (!match) {
    return value.slice(11, 16)
  }

  const hour = Number(match[1])
  const minute = match[2]
  const period =
    hour < 12 ? '오전' : '오후'
  const displayHour =
    hour % 12 === 0 ? 12 : hour % 12

  return `${period} ${displayHour}:${minute}`
}

function formatMessageDate(value?: string) {
  if (!value) return '오늘'

  const datePart = value.slice(0, 10)
  const [year, month, day] = datePart.split('-')

  if (!year || !month || !day) return '오늘'

  return `${Number(year)}년 ${Number(month)}월 ${Number(day)}일`
}

function LandlordChatComposer({
  onSend,
  sending,
  enabled,
}: {
  onSend: (message: string) => void
  sending: boolean
  enabled: boolean
}) {
  const [message, setMessage] =
    useState('')

  const canSend =
    enabled &&
    message.trim().length > 0 &&
    !sending

  const send = () => {
    const content = message.trim()

    if (!content || sending) return

    onSend(content)
    setMessage('')
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="h-16 shrink-0 border-t border-[#e2e8f0] bg-white px-3 py-3">
      <div className="flex h-10 items-center gap-2">
        <button
          type="button"
          aria-label="파일 첨부"
          className="flex h-10 w-9 shrink-0 items-center justify-center text-[#64748b]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <label className="min-w-0 flex-1">
          <span className="sr-only">
            채팅 메시지
          </span>

          <textarea
            rows={1}
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={!enabled}
            placeholder={enabled ? '메시지를 입력하세요.' : '종료된 채팅방입니다.'}
            className="h-10 w-full resize-none overflow-hidden rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[13px] py-[9px] text-[12px] leading-5 text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb]"
          />
        </label>

        <button
          type="button"
          disabled={!canSend}
          aria-label="메시지 전송"
          onClick={send}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white disabled:bg-[#93b4f5]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21 3L10 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M21 3L14 21L10 14L3 10L21 3Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function LandlordChatPage() {
  const navigate = useNavigate()
  const { latestEvent } = useRealtime()

  const {
    requestId,
    contractorId,
  } = useParams<{
    requestId: string
    contractorId: string
  }>()

  const numericRequestId =
    Number(requestId)

  const numericContractorId =
    Number(contractorId)

  const [thread, setThread] = useState<ChatThread | null>(null)
  const [contractorName, setContractorName] = useState('')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)

  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!Number.isInteger(numericRequestId) || !Number.isInteger(numericContractorId)) {
      setError('잘못된 채팅방 주소입니다.')
      return
    }

    let active = true
    setError(null)
    setThread(null)
    setContractorName('')
    setMessages([])
    setLoadingMessages(true)

    Promise.all([
      getChatMessages(numericRequestId, numericContractorId),
      getChatThreads(),
    ])
      .then(([chatMessages, threads]) => {
        if (!active) return
        const matchingThread = threads.find((item) =>
          item.requestId === numericRequestId && item.contractorId === numericContractorId,
        )
        if (!matchingThread) {
          throw new Error('해당 시공사와 연결된 채팅방을 찾을 수 없습니다.')
        }
        setThread(matchingThread)
        setContractorName(matchingThread.counterpartName)
        setMessages(chatMessages.map((message) => ({
          id: message.id,
          senderType: message.senderType,
          content: message.content,
          createdAt: message.createdAt,
        })))
        setLoadingMessages(false)
        void readChat(numericRequestId, numericContractorId).catch(() => undefined)
      })
      .catch((loadError) => {
        if (!active) return
        setLoadingMessages(false)
        setError(loadError instanceof Error ? loadError.message : '채팅 내용을 불러오지 못했습니다.')
      })

    return () => { active = false }
  }, [numericContractorId, numericRequestId])
  useEffect(() => {
    if (
      latestEvent?.type !== 'CHAT_MESSAGE' ||
      latestEvent.requestId !== numericRequestId ||
      latestEvent.contractorId !== numericContractorId
    ) return

    let active = true
    getChatMessages(numericRequestId, numericContractorId)
      .then((chatMessages) => {
        if (!active) return
        setMessages(chatMessages.map((message) => ({
          id: message.id,
          senderType: message.senderType,
          content: message.content,
          createdAt: message.createdAt,
        })))
        void readChat(numericRequestId, numericContractorId).catch(() => undefined)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [latestEvent, numericContractorId, numericRequestId])

  const send = async (
    content: string,
  ) => {
    if (sending) return

    setSending(true)
    setError(null)

    try {
      const message =
        await sendChatMessage(
          numericRequestId,
          content,
          numericContractorId,
        )

      setMessages((current) => current.some((item) => item.id === message.id) ? current : [
        ...current, {
          id: message.id,
          senderType:
            message.senderType,
          content: message.content,
          createdAt:
            message.createdAt,
        },
      ])

      requestAnimationFrame(() => {
        const container =
          containerRef.current

        if (!container) return

        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      })
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '메시지를 보내지 못했습니다.')
    } finally {
      setSending(false)
    }
  }

  const companyMeta = thread?.contactable ? '견적 의뢰 채팅' : '종료된 채팅방'
  const dateLabel = formatMessageDate(messages[0]?.createdAt)
  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title={contractorName || '채팅'}
        onBack={() =>
          navigate('/chats')
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {/* 업체 정보 */}
        <section className="flex h-14 shrink-0 items-center border-b border-[#e2e8f0] bg-white px-4">
          <CompanyIcon />

          <div className="ml-[10px] min-w-0 flex-1">
            <h1 className="truncate text-[13px] font-bold leading-[21px] text-[#1e293b]">
              {contractorName}
            </h1>

            <p className="truncate text-[10px] leading-4 text-[#64748b]">
              {companyMeta}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className={`size-[7px] rounded-full ${thread?.contactable ? 'bg-[#22c55e]' : 'bg-[#94a3b8]'}`} />

            <span className={`text-[10px] ${thread?.contactable ? 'text-[#16a34a]' : 'text-[#64748b]'}`}>
              {thread?.contactable ? '채팅 가능' : '채팅 종료'}
            </span>
          </div>
        </section>

        {/* 상단 안내 */}
        <section className="shrink-0 space-y-3 bg-[#f8fafc] px-4 py-3">
          <article className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="flex items-center gap-2">
              <ShieldIcon />

              <h2 className="text-[16px] font-bold leading-[22px] text-[#1e293b]">
                안전한 거래 안내
              </h2>
            </div>

            <p className="mt-[6px] text-[12px] leading-[18px] text-[#64748b]">
              안전한 거래와 개인정보 보호를 위해
              <br />
              시공업체와의 소통은 이 채팅 안에서 진행해주세요.
            </p>
          </article>

          <article className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckIcon />
              <h2 className="text-[16px] font-bold leading-[22px] text-[#1e293b]">
                {thread?.contactable ? '방문 일정 조율 중' : '채팅이 종료되었습니다'}
              </h2>
            </div>
            <p className="mt-[6px] text-[12px] leading-[18px] text-[#64748b]">
              {thread?.contactable ? '시공업체와 현장 방문 날짜와 시간을 조율해주세요.' : '최종 선택되지 않은 시공사와의 채팅은 종료됩니다.'}
            </p>
          </article>

          {thread?.contactable ? <button
            type="button"
            onClick={() => navigate(`/mypage/requests/${requestId}/visit/${contractorId}`)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#2563eb] text-[14px] font-bold text-white"
          >
            <CalendarIcon />
            현장 방문 일정 잡기
          </button> : null}
        </section>
        {/* 메시지 영역 */}
        <main
          ref={containerRef}
          className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] px-4 pb-4"
        >
          <div className="flex justify-center py-4">
            <span className="rounded-full bg-[#f1f5f9] px-5 py-[5px] text-[10px] text-[#94a3b8]">
              {dateLabel}
            </span>
          </div>

          <div className="space-y-[5px]">
            {loadingMessages ? <p className="py-10 text-center text-xs text-[#64748b]">메시지를 불러오는 중입니다.</p> : null}
            {messages.map((message) => {
              const outgoing =
                message.senderType ===
                'LANDLORD'

              const system =
                message.senderType ===
                'SYSTEM'

              if (system) {
                return (
                  <p
                    key={message.id}
                    className="mx-auto my-3 w-fit rounded-full bg-[#e2e8f0] px-3 py-1 text-[10px] text-[#64748b]"
                  >
                    {message.content}
                  </p>
                )
              }

              const outgoingBubbleClass =
                message.emphasis
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#dbeafe] text-[#1e293b]'

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    outgoing
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[270px] whitespace-pre-line break-words rounded-[12px] px-3 py-[9px] text-[12px] leading-[18px] ${
                      outgoing
                        ? outgoingBubbleClass
                        : 'border border-[#e2e8f0] bg-white text-[#1e293b]'
                    }`}
                  >
                    {message.content}
                  </div>

                  <span className="mt-[3px] text-[9px] leading-[14px] text-[#94a3b8]">
                    {formatMessageTime(
                      message.createdAt,
                    )}
                  </span>
                </div>
              )
            })}
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-3 text-center text-[10px] text-[#dc2626]"
            >
              {error}
            </p>
          ) : null}
        </main>

        <LandlordChatComposer
          sending={sending}
          enabled={thread?.contactable === true}
          onSend={(message) =>
            void send(message)
          }
        />
      </div>
    </UserScreenShell>
  )
}
