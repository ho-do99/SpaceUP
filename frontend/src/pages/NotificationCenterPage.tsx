import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationCard from '@/components/user/NotificationCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import {
  notificationFilters,
  type NotificationFilter,
  type UserNotification,
  userNotifications,
} from '@/mocks/notifications'

export default function NotificationCenterPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all')
  const [notifications, setNotifications] = useState<readonly UserNotification[]>(userNotifications)

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

  const markAllAsRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
  }

  const handleSelect = (selected: UserNotification) => {
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
