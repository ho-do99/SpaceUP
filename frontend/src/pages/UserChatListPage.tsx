import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getChatThreads } from '@/api/chatApi'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

interface UserChatListItem {
  requestId: string
  contractorId: string
  contractorName: string
  lastMessage: string
  timeLabel: string
  unreadCount: number
}

const fallbackChats: readonly UserChatListItem[] = [
  {
    requestId: '1',
    contractorId: '1',
    contractorName: '공간디자인 인테리어',
    lastMessage: '요청하신 견적서를 확인해 주세요.',
    timeLabel: '오전 10:24',
    unreadCount: 2,
  },
  {
    requestId: '2',
    contractorId: '2',
    contractorName: '하우스업 인테리어',
    lastMessage: '시공 가능 일정을 안내드립니다.',
    timeLabel: '어제',
    unreadCount: 0,
  },
  {
    requestId: '3',
    contractorId: '3',
    contractorName: '더 좋은 집 인테리어',
    lastMessage: '상담 요청을 확인했습니다.',
    timeLabel: '7월 19일',
    unreadCount: 1,
  },
]

function getStringValue(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value)
    }
  }

  return ''
}

function getNumberValue(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'number') {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim() &&
      Number.isFinite(Number(value))
    ) {
      return Number(value)
    }
  }

  return 0
}

function formatChatTime(value: string) {
  if (!value) return ''

  if (
    value === '어제' ||
    value.includes('월') ||
    value.includes('오전') ||
    value.includes('오후')
  ) {
    return value
  }

  const timeMatch = value.match(
    /(?:T|\s)(\d{2}):(\d{2})/,
  )

  if (!timeMatch) {
    return value
  }

  const hour = Number(timeMatch[1])
  const minute = timeMatch[2]
  const period = hour < 12 ? '오전' : '오후'
  const displayHour =
    hour % 12 === 0 ? 12 : hour % 12

  return `${period} ${displayHour}:${minute}`
}

function normalizeChatThread(
  thread: unknown,
  index: number,
): UserChatListItem {
  const fallback =
    fallbackChats[index] ?? fallbackChats[0]

  if (!thread || typeof thread !== 'object') {
    return fallback
  }

  const record = thread as Record<string, unknown>

  const requestId =
    getStringValue(record, [
      'requestId',
      'request_id',
      'chatRequestId',
    ]) || fallback.requestId

  const contractorId =
    getStringValue(record, [
      'contractorId',
      'contractor_id',
      'partnerId',
      'otherMemberId',
    ]) || fallback.contractorId

  const contractorName =
    getStringValue(record, [
      'contractorName',
      'companyName',
      'partnerName',
      'name',
    ]) || fallback.contractorName

  const lastMessage =
    getStringValue(record, [
      'lastMessage',
      'lastMessageContent',
      'message',
      'content',
    ]) || fallback.lastMessage

  const rawTime =
    getStringValue(record, [
      'lastMessageAt',
      'updatedAt',
      'createdAt',
      'timeLabel',
    ]) || fallback.timeLabel

  const unreadCount = getNumberValue(record, [
    'unreadCount',
    'unreadMessageCount',
    'unread',
  ])

  return {
    requestId,
    contractorId,
    contractorName,
    lastMessage,
    timeLabel: formatChatTime(rawTime),
    unreadCount,
  }
}

function CompanyIcon() {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
      <svg
        width="22"
        height="22"
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

export default function UserChatListPage() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [chats, setChats] =
    useState<readonly UserChatListItem[]>(
      fallbackChats,
    )

  useEffect(() => {
    let active = true

    getChatThreads()
      .then((threads) => {
        if (!active || !threads.length) return

        setChats(
          threads.map((thread, index) =>
            normalizeChatThread(thread, index),
          ),
        )
      })
      .catch(() => {
        // API 연결이 되지 않는 개발 환경에서는
        // Figma 확인용 예시 데이터를 유지합니다.
      })

    return () => {
      active = false
    }
  }, [])

  const filteredChats = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    if (!keyword) return chats

    return chats.filter(
      (chat) =>
        chat.contractorName
          .toLowerCase()
          .includes(keyword) ||
        chat.lastMessage
          .toLowerCase()
          .includes(keyword),
    )
  }, [chats, query])

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="채팅"
        onBack={() => navigate(-1)}
      />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white px-4 pb-8 pt-5">
        <h1 className="text-[22px] font-bold leading-[35px] text-[#1e293b]">
          최근 대화
        </h1>

        <p className="text-[12px] leading-[19px] text-[#64748b]">
          시공사와 견적 및 시공 일정을 상담하세요.
        </p>

        <label className="relative mt-[15px] block">
          <span className="sr-only">
            시공사 또는 메시지 검색
          </span>

          <span className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="#94A3B8"
                strokeWidth="2"
              />

              <path
                d="M16 16L20 20"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="시공사 또는 메시지 검색"
            className="h-11 w-full rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] pl-[38px] pr-3 text-[12px] text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb]"
          />
        </label>

        <section
          className="mt-4 space-y-[15px]"
          aria-label="최근 채팅 목록"
        >
          {filteredChats.map((chat) => (
            <Link
              key={`${chat.requestId}-${chat.contractorId}`}
              to={`/mypage/requests/${chat.requestId}/chat/${chat.contractorId}`}
              className="relative flex h-[84px] items-center rounded-[12px] border border-[#e2e8f0] bg-white px-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              <CompanyIcon />

              <div className="ml-3 min-w-0 flex-1 pr-[70px]">
                <h2 className="truncate text-[14px] font-bold leading-[22px] text-[#1e293b]">
                  {chat.contractorName}
                </h2>

                <p className="mt-[3px] truncate text-[12px] leading-[19px] text-[#64748b]">
                  {chat.lastMessage}
                </p>
              </div>

              <span className="absolute right-[14px] top-[14px] text-[10px] leading-4 text-[#94a3b8]">
                {chat.timeLabel}
              </span>

              {chat.unreadCount > 0 ? (
                <span
                  aria-label={`읽지 않은 메시지 ${chat.unreadCount}개`}
                  className="absolute right-[14px] top-[44px] flex size-[18px] items-center justify-center rounded-full bg-[#ef4444] text-[9px] font-bold text-white"
                >
                  {chat.unreadCount}
                </span>
              ) : null}
            </Link>
          ))}

          {!filteredChats.length ? (
            <p className="py-12 text-center text-[12px] text-[#94a3b8]">
              검색 결과가 없습니다.
            </p>
          ) : null}
        </section>
      </main>
    </UserScreenShell>
  )
}