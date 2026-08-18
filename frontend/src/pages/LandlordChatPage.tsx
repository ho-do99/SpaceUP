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
  readChat,
  sendChatMessage,
} from '@/api/chatApi'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import useRealtime from '@/contexts/useRealtime'

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

interface StoredVisitSchedule {
  visitDate: string
  visitTime: string
  address: string
  requestMessage: string
  status?: string
}

const consultationFallbackMessages: DisplayMessage[] = [
  {
    id: 'consultation-1',
    senderType: 'CONTRACTOR',
    content:
      '안녕하세요. 공간디자인 인테리어입니다.\n요청하신 시공 상담 내용을 확인했습니다.',
    createdAt: '2026-07-21T09:42:00',
  },
  {
    id: 'consultation-2',
    senderType: 'LANDLORD',
    content:
      '안녕하세요. 정확한 견적을 받으려면\n현장 방문이 필요한가요?',
    createdAt: '2026-07-21T09:45:00',
  },
  {
    id: 'consultation-3',
    senderType: 'CONTRACTOR',
    content:
      '네. 현장에서 공간 상태와 실제 치수를 확인한 뒤\n정확한 견적서를 작성해드립니다.',
    createdAt: '2026-07-21T09:46:00',
  },
  {
    id: 'consultation-4',
    senderType: 'CONTRACTOR',
    content:
      '방문 가능한 날짜와 시간을 알려주세요.',
    createdAt: '2026-07-21T09:47:00',
  },
  {
    id: 'consultation-5',
    senderType: 'LANDLORD',
    content:
      '이번 주 토요일 오후 3시가 가능합니다.',
    createdAt: '2026-07-21T09:50:00',
  },
  {
    id: 'consultation-6',
    senderType: 'CONTRACTOR',
    content:
      '확인했습니다.\n7월 25일 토요일 오후 3시에 방문드리겠습니다.',
    createdAt: '2026-07-21T09:52:00',
  },
]

const constructionFallbackMessages: DisplayMessage[] = [
  {
    id: 'construction-1',
    senderType: 'CONTRACTOR',
    content:
      '안녕하세요. 하우스업 인테리어입니다.\n오늘 예정대로 시공을 진행하고 있습니다.',
    createdAt: '2026-07-24T09:10:00',
  },
  {
    id: 'construction-2',
    senderType: 'LANDLORD',
    content:
      '현재 진행 상황을 확인할 수 있을까요?',
    createdAt: '2026-07-24T11:25:00',
  },
  {
    id: 'construction-3',
    senderType: 'CONTRACTOR',
    content:
      '거실 장판 시공을 완료했고,\n지금은 침실 벽지 시공을 진행 중입니다.',
    createdAt: '2026-07-24T11:27:00',
  },
  {
    id: 'construction-4',
    senderType: 'CONTRACTOR',
    content:
      '전체 공정의 약 65%가 완료되었습니다.',
    createdAt: '2026-07-24T11:28:00',
  },
  {
    id: 'construction-5',
    senderType: 'LANDLORD',
    content:
      '확인했습니다. 남은 일정도 잘 부탁드립니다.',
    createdAt: '2026-07-24T11:31:00',
    emphasis: true,
  },
  {
    id: 'construction-6',
    senderType: 'CONTRACTOR',
    content:
      '내일 마감과 최종 검수를 진행한 뒤\n완료 내용을 다시 안내드리겠습니다.',
    createdAt: '2026-07-24T11:33:00',
  },
]

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

function formatMessageDate(
  value: string | undefined,
  constructionMode: boolean,
) {
  if (!value) {
    return constructionMode
      ? '2026년 7월 24일'
      : '2026년 7월 21일'
  }

  const datePart = value.slice(0, 10)
  const [year, month, day] =
    datePart.split('-')

  if (!year || !month || !day) {
    return constructionMode
      ? '2026년 7월 24일'
      : '2026년 7월 21일'
  }

  return `${Number(year)}년 ${Number(month)}월 ${Number(day)}일`
}

function formatVisitSchedule(
  date: string,
  time: string,
) {
  const [year, month, day] =
    date.split('-')

  const [hourText, minute = '00'] =
    time.split(':')

  const hour = Number(hourText)

  if (
    !year ||
    !month ||
    !day ||
    !Number.isFinite(hour)
  ) {
    return `${date} ${time}`
  }

  const period =
    hour < 12 ? '오전' : '오후'

  const displayHour =
    hour % 12 === 0 ? 12 : hour % 12

  return `${year}.${month}.${day} ${period} ${displayHour}:${minute}`
}

function getStoredVisitSchedule(
  requestId?: string,
  contractorId?: string,
): StoredVisitSchedule | null {
  if (!requestId || !contractorId) {
    return null
  }

  const raw = sessionStorage.getItem(
    `spaceup-visit-${requestId}-${contractorId}`,
  )

  if (!raw) return null

  try {
    const parsed = JSON.parse(
      raw,
    ) as StoredVisitSchedule

    if (
      typeof parsed.visitDate !==
        'string' ||
      typeof parsed.visitTime !==
        'string'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function LandlordChatComposer({
  onSend,
  sending,
}: {
  onSend: (message: string) => void
  sending: boolean
}) {
  const [message, setMessage] =
    useState('')

  const canSend =
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
            placeholder="메시지를 입력하세요."
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

  const defaultContractorName =
    numericContractorId === 2
      ? '하우스업 인테리어'
      : numericContractorId === 3
        ? '더 좋은 집 인테리어'
        : '공간디자인 인테리어'

  const [contractorName, setContractorName] =
    useState(defaultContractorName)

  const constructionMode =
    numericContractorId === 2 ||
    contractorName.includes('하우스업')

  const [messages, setMessages] =
    useState<DisplayMessage[]>(
      numericContractorId === 2
        ? constructionFallbackMessages
        : consultationFallbackMessages,
    )

  const [error, setError] =
    useState<string | null>(null)

  const [sending, setSending] =
    useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)

  const containerRef =
    useRef<HTMLDivElement | null>(null)

  const storedVisitSchedule =
    !constructionMode
      ? getStoredVisitSchedule(
          requestId,
          contractorId,
        )
      : null

  useEffect(() => {
    if (
      !Number.isInteger(
        numericRequestId,
      ) ||
      !Number.isInteger(
        numericContractorId,
      )
    ) {
      setError(
        '잘못된 채팅방 주소입니다.',
      )
      return
    }

    let active = true

    setError(null)

    setContractorName(
      defaultContractorName,
    )

    setMessages([])
    setLoadingMessages(true)

    getChatMessages(
      numericRequestId,
      numericContractorId,
    )
      .then((chatMessages) => {
        if (!active) return

        setMessages(
            chatMessages.map(
              (message) => ({
                id: message.id,
                senderType:
                  message.senderType,
                content:
                  message.content,
                createdAt:
                  message.createdAt,
              }),
            ),
          )
        setLoadingMessages(false)

        void readChat(
          numericRequestId,
          numericContractorId,
        ).catch(
          () => undefined,
        )
      })
      .catch((loadError) => { if (active) { setLoadingMessages(false); setError(loadError instanceof Error ? loadError.message : '채팅 내용을 불러오지 못했습니다.') } })

    return () => {
      active = false
    }
  }, [
    defaultContractorName,
    numericContractorId,
    numericRequestId,
  ])

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
    } catch {
      setError(
        '메시지를 보내지 못했습니다. 시공사가 이미 확정된 의뢰인지 확인해주세요.',
      )
    } finally {
      setSending(false)
    }
  }

  const companyMeta =
    constructionMode
      ? '광주 서구 · 장판·벽지 전문'
      : '광주 북구 · 리모델링 전문'

  const dateLabel =
    formatMessageDate(
      messages[0]?.createdAt,
      constructionMode,
    )

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title={contractorName}
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
            <span className="size-[7px] rounded-full bg-[#22c55e]" />

            <span className="text-[10px] text-[#16a34a]">
              {constructionMode
                ? '시공 중'
                : '상담 가능'}
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

          {constructionMode ? (
            <article className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
              <div className="flex items-center gap-2">
                <CheckIcon />

                <h2 className="text-[16px] font-bold leading-[22px] text-[#1e293b]">
                  시공 진행 중 · 벽지 시공 단계
                </h2>
              </div>

              <p className="mt-[6px] text-[12px] leading-[18px] text-[#64748b]">
                현재 전체 공정의 65%가 완료되었습니다.
              </p>

              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#64748b]">
                  진행률
                </span>

                <strong className="text-[#2563eb]">
                  65%
                </strong>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div className="h-full w-[65%] rounded-full bg-[#2563eb]" />
              </div>

              <p className="mt-3 text-[11px] leading-[18px] text-[#64748b]">
                시공 기간&nbsp;&nbsp;
                2026.07.23 ~ 2026.07.26
              </p>

              <p className="mt-1 text-[11px] leading-[18px] text-[#334155]">
                오늘&nbsp;&nbsp;벽지 시공 중
                &nbsp;&nbsp;·&nbsp;&nbsp;
                다음&nbsp;&nbsp;마감 및 검수
              </p>
            </article>
          ) : (
            <article className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
              <div className="flex items-center gap-2">
                <CheckIcon />

                <h2 className="text-[16px] font-bold leading-[22px] text-[#1e293b]">
                  {storedVisitSchedule
                    ? '방문 일정 요청 완료 · 시공사 확인 대기'
                    : '의뢰 승인 완료 · 방문 일정 조율 중'}
                </h2>
              </div>

              <p className="mt-[6px] text-[12px] leading-[18px] text-[#64748b]">
                {storedVisitSchedule
                  ? `${formatVisitSchedule(
                      storedVisitSchedule.visitDate,
                      storedVisitSchedule.visitTime,
                    )} 방문을 요청했습니다.`
                  : '시공업체와 현장 방문 날짜와 시간을 조율해주세요.'}
              </p>
            </article>
          )}

          <button
            type="button"
            onClick={() => {
              if (constructionMode) {
                navigate(
                  `/mypage/requests/${requestId}/schedule/${contractorId}`,
                )
                return
              }

              navigate(
                `/mypage/requests/${requestId}/visit/${contractorId}`,
              )
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#2563eb] text-[14px] font-bold text-white"
          >
            <CalendarIcon />

            {constructionMode
              ? '시공 일정 확인'
              : storedVisitSchedule
                ? '방문 일정 확인 · 변경'
                : '현장 방문 일정 잡기'}
          </button>
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

          {!constructionMode &&
          storedVisitSchedule ? (
            <div className="mb-4 rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <CheckIcon />

                <p className="text-[11px] font-bold text-[#2563eb]">
                  현장 방문 일정 요청이 완료되었습니다.
                </p>
              </div>

              <p className="mt-2 text-[11px] font-bold text-[#1e293b]">
                {formatVisitSchedule(
                  storedVisitSchedule.visitDate,
                  storedVisitSchedule.visitTime,
                )}
              </p>

              <p className="mt-1 text-[10px] leading-[16px] text-[#64748b]">
                시공사 확인을 기다리고 있습니다.
              </p>
            </div>
          ) : null}

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
          onSend={(message) =>
            void send(message)
          }
        />
      </div>
    </UserScreenShell>
  )
}
