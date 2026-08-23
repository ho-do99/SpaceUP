import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/components/user/NotificationCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import {
  notificationFilters,
  type NotificationFilter,
  type UserNotification,
} from '@/mocks/notifications'
import { getNotifications, readAllNotifications, readNotification } from '@/api/notificationApi'
import { getChatThreads } from '@/api/chatApi'
import { getQuotesByRequest } from '@/api/estimateApi'
import { mapNotification, notificationContextFor } from './notificationMapper'
import useRealtime from '@/contexts/useRealtime'

export default function NotificationCenterPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all')
  const [notifications, setNotifications] = useState<readonly UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { latestEvent, refreshUnreadNotificationCount } = useRealtime()

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [page, threads] = await Promise.all([
        getNotifications({ size: 50 }),
        getChatThreads().catch(() => []),
      ])
      const quoteRequestIds = [...new Set(page.content
        .filter((notification) => notification.type === 'QUOTE')
        .map((notification) => notificationContextFor(notification, threads).requestId)
        .filter((requestId): requestId is number => typeof requestId === 'number'))]
      const quotes = (await Promise.all(quoteRequestIds.map((requestId) =>
        getQuotesByRequest(requestId).catch(() => []),
      ))).flat()
      setNotifications(page.content.map((notification) =>
        mapNotification(notification, new Date(), threads, quotes)))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '알림을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadNotifications() }, [loadNotifications])
  useEffect(() => {
    if (latestEvent?.type === 'NOTIFICATION_CHANGED') void loadNotifications()
  }, [latestEvent, loadNotifications])

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => activeFilter === 'all' || notification.category === activeFilter,
      ),
    [activeFilter, notifications],
  )

  const todayNotifications = visibleNotifications.filter((notification) => notification.group === 'today')
  const previousNotifications = visibleNotifications.filter(
    (notification) => notification.group === 'previous',
  )

  const markAllAsRead = async () => {
    try {
      await readAllNotifications()
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
      await refreshUnreadNotificationCount()
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : '읽음 처리에 실패했습니다.')
    }
  }

  const handleSelect = async (selected: UserNotification) => {
    if (!selected.isRead) {
      try {
        await readNotification(Number(selected.id))
        await refreshUnreadNotificationCount()
      } catch (readError) {
        setError(readError instanceof Error ? readError.message : '읽음 처리에 실패했습니다.')
        return
      }
    }
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === selected.id ? { ...notification, isRead: true } : notification,
      ),
    )

    if (selected.destination) {
      navigate(selected.destination)
    }
  }

  return (
    <UserScreenShell className="h-dvh bg-[#f8fafc]">
      <UserHeader variant="detail" title="알림" onBack={() => navigate(-1)} />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] px-4 pb-6 pt-4">
        <div className="flex h-8 items-center justify-between gap-2">
          <p className="min-w-0 flex-1 text-[11px] leading-[17px] text-[#64748b]">
            견적, 일정, 채팅 관련 새로운 소식을 확인하세요.
          </p>
          <button
            type="button"
            onClick={markAllAsRead}
            className="h-8 shrink-0 rounded-lg border border-[#e2e8f0] bg-white px-3.5 text-[11px] text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            모두 읽음
          </button>
        </div>

        <div className="scrollbar-hide mt-3 flex h-9 gap-2 overflow-x-auto" role="tablist" aria-label="알림 유형">
          {notificationFilters.map((filter) => {
            const isActive = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(filter.id)}
                className={`h-8 shrink-0 rounded-2xl px-3.5 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
                  isActive
                    ? 'bg-[#2563eb] text-white'
                    : 'border border-[#e2e8f0] bg-white text-[#64748b]'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {loading ? <p className="mt-8 text-center text-sm text-[#64748b]">알림을 불러오는 중입니다.</p> : null}
        {error ? (
          <div className="mt-6 text-center text-sm text-red-600">
            <p>{error}</p>
            <button type="button" onClick={() => void loadNotifications()} className="mt-3 rounded-lg border px-3 py-2 text-[#2563eb]">다시 시도</button>
          </div>
        ) : null}
        {!loading && !error && visibleNotifications.length === 0 ? <p className="mt-8 text-center text-sm text-[#64748b]">알림이 없습니다.</p> : null}

        {todayNotifications.length > 0 ? (
          <section className="mt-3" aria-labelledby="today-notifications-heading">
            <h1 id="today-notifications-heading" className="text-[12px] font-bold leading-[19px] text-[#1e293b]">
              오늘
            </h1>
            <div className="mt-3 space-y-2.5">
              {todayNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} onSelect={handleSelect} />
              ))}
            </div>
          </section>
        ) : null}

        {previousNotifications.length > 0 ? (
          <section className="mt-3" aria-labelledby="previous-notifications-heading">
            <h2 id="previous-notifications-heading" className="text-[12px] font-bold leading-[19px] text-[#1e293b]">
              이전 알림
            </h2>
            <div className="mt-3 space-y-2.5">
              {previousNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} onSelect={handleSelect} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </UserScreenShell>
  )
}
