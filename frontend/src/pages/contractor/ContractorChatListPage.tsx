import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getChatThreads } from '@/api/chatApi'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import useRealtime from '@/contexts/useRealtime'
import { formatBrowserMonthDayTime } from '@/utils/browserDateTime'

type ChatFilter =
  | 'ALL'
  | 'UNREAD'
  | 'IN_PROGRESS'
  | 'COMPLETED'

interface ContractorChatThread {
  id: string
  requestId: string
  projectName: string
  customerName: string
  progressLabel: string
  lastMessage: string
  timeLabel: string
  unreadCount: number
  status: Exclude<ChatFilter, 'ALL' | 'UNREAD'>
  href: string | null
}

const CHAT_FILTERS: readonly {
  value: ChatFilter
  label: string
}[] = [
  {
    value: 'ALL',
    label: '전체',
  },
  {
    value: 'UNREAD',
    label: '안 읽음',
  },
  {
    value: 'IN_PROGRESS',
    label: '진행 중',
  },
  {
    value: 'COMPLETED',
    label: '완료',
  },
]

export default function ContractorChatListPage() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState<readonly ContractorChatThread[]>([])
  const [usingLiveData, setUsingLiveData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { latestEvent } = useRealtime()

  const loadThreads = useCallback(async () => {
    try {
      const liveThreads = await getChatThreads()
      setThreads(liveThreads.map((thread) => {
        const completed = thread.requestStatus === 'COMPLETED'
        return {
          id: String(thread.requestId),
          requestId: String(thread.requestId),
          projectName: thread.requestCode,
          customerName: thread.counterpartName,
          progressLabel: thread.contactable ? (completed ? '완료' : '견적 협의 중') : '채팅 종료',
          lastMessage: thread.lastMessage || '아직 메시지가 없습니다.',
          timeLabel: thread.lastMessageAt ? formatBrowserMonthDayTime(thread.lastMessageAt) : '-',
          unreadCount: thread.unreadCount,
          status: completed ? 'COMPLETED' : 'IN_PROGRESS',
          href: `/contractor/requests/${thread.requestId}/chat`,
        }
      }))
      setUsingLiveData(true)
      setLoading(false)
      setError('')
    } catch (loadError) {
      setUsingLiveData(false)
      setLoading(false)
      setError(loadError instanceof Error ? loadError.message : '채팅 목록을 불러오지 못했습니다.')
    }
  }, [])
  useEffect(() => { void loadThreads() }, [loadThreads])
  useEffect(() => {
    if (latestEvent?.type === 'CHAT_MESSAGE') void loadThreads()
  }, [latestEvent, loadThreads])

  const [searchKeyword, setSearchKeyword] =
    useState('')

  const [activeFilter, setActiveFilter] =
    useState<ChatFilter>('ALL')

  const filteredThreads = useMemo(() => {
    const normalizedKeyword =
      searchKeyword.trim().toLowerCase()

    return threads.filter((thread) => {
      const matchesKeyword =
        !normalizedKeyword ||
        thread.projectName
          .toLowerCase()
          .includes(normalizedKeyword) ||
        thread.customerName
          .toLowerCase()
          .includes(normalizedKeyword)

      if (!matchesKeyword) {
        return false
      }

      if (activeFilter === 'ALL') {
        return true
      }

      if (activeFilter === 'UNREAD') {
        return thread.unreadCount > 0
      }

      return thread.status === activeFilter
    })
  }, [activeFilter, searchKeyword, threads])

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar
        title="채팅"
        back
        actions="chat"
      />

      <main className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-4 pb-6 pt-4">
        <p className="sr-only" aria-live="polite">{usingLiveData ? '실시간 채팅 목록을 표시합니다.' : '채팅 목록을 표시합니다.'}</p>
        <label
          htmlFor="contractor-chat-search"
          className="sr-only"
        >
          프로젝트명 또는 고객명 검색
        </label>

        <input
          id="contractor-chat-search"
          type="search"
          value={searchKeyword}
          onChange={(event) =>
            setSearchKeyword(event.target.value)
          }
          placeholder="프로젝트명 또는 고객명 검색"
          className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-[13px] text-xs text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
        />

        <div
          role="group"
          aria-label="채팅 목록 필터"
          className="mt-3 grid grid-cols-4 gap-1.5"
        >
          {CHAT_FILTERS.map((filter) => {
            const isActive =
              activeFilter === filter.value

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  setActiveFilter(filter.value)
                }
                className={`flex h-[34px] items-center justify-center rounded-[17px] border text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                  isActive
                    ? 'border-[#2563eb] bg-[#2563eb] text-white'
                    : 'border-[#e2e8f0] bg-white text-[#64748b]'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <section
          aria-label="채팅방 목록"
          className="mt-4 space-y-3"
        >
          {loading ? <p className="py-10 text-center text-xs text-[#64748b]">채팅 목록을 불러오는 중입니다.</p> : null}
          {error ? <p role="alert" className="py-10 text-center text-xs text-[#dc2626]">{error}</p> : null}
          {filteredThreads.map((thread) => {
            const isUnread =
              thread.unreadCount > 0

            const isClickable =
              Boolean(thread.href)

            return (
              <button
                key={thread.id}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (thread.href) {
                    navigate(thread.href)
                  }
                }}
                aria-label={`${thread.projectName}, ${thread.customerName}, ${thread.progressLabel}`}
                className={`relative min-h-24 w-full overflow-hidden rounded-xl border border-[#e2e8f0] px-3 py-[10px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] disabled:cursor-default ${
                  isUnread
                    ? 'bg-[#eff6ff]'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2
                    className={`min-w-0 flex-1 truncate text-sm font-bold leading-[21px] ${
                      isUnread
                        ? 'text-[#2563eb]'
                        : 'text-[#1e293b]'
                    }`}
                  >
                    {thread.projectName}
                  </h2>

                  <span className="shrink-0 pt-0.5 text-[10px] leading-[15px] text-[#64748b]">
                    {thread.timeLabel}
                  </span>
                </div>

                <p className="mt-0.5 truncate pr-10 text-[11px] leading-[17px] text-[#64748b]">
                  임대인 {thread.customerName} ·{' '}
                  {thread.progressLabel}
                </p>

                <p className="mt-1 truncate pr-10 text-[11px] leading-[17px] text-[#1e293b]">
                  {thread.lastMessage}
                </p>

                {thread.unreadCount > 0 ? (
                  <span
                    aria-label={`읽지 않은 메시지 ${thread.unreadCount}개`}
                    className="absolute bottom-[11px] right-3 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[11px] font-bold text-white"
                  >
                    {thread.unreadCount}
                  </span>
                ) : null}
              </button>
            )
          })}

          {filteredThreads.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white px-5 text-center">
              <p className="text-sm font-bold text-[#1e293b]">
                조건에 맞는 채팅이 없습니다.
              </p>

              <p className="mt-2 text-xs leading-5 text-[#64748b]">
                검색어 또는 필터를 변경해주세요.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </ContractorMobileShell>
  )
}
