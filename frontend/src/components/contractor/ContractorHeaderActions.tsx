import bellIcon from '@/assets/user/icons/bell.svg'
import messageIcon from '@/assets/user/icons/message-circle.svg'
import userIcon from '@/assets/user/icons/user-round.svg'
import {
  Link,
  useLocation,
} from 'react-router-dom'

import useContractorPortalFlow from './useContractorPortalFlow'

export default function ContractorHeaderActions() {
  const { notifications } =
    useContractorPortalFlow()

  const location = useLocation()

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length

  const isChatActive =
    location.pathname === '/contractor/chats' ||
    /^\/contractor\/requests\/[^/]+\/chat(?:\/completed)?$/.test(
      location.pathname,
    )

  const isMyPageActive =
    location.pathname === '/contractor/mypage' ||
    location.pathname.startsWith(
      '/contractor/settings',
    ) ||
    location.pathname.startsWith(
      '/contractor/company',
    ) ||
    location.pathname.startsWith(
      '/contractor/portfolio',
    )

  const isNotificationActive =
    location.pathname ===
    '/contractor/notifications'

  return (
    <div className="flex shrink-0 items-center gap-3">
      <Link
        to="/contractor/chats"
        aria-label="채팅"
        aria-current={
          isChatActive ? 'page' : undefined
        }
        className={`rounded-[10px] p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
          isChatActive ? 'bg-[#eff6ff]' : ''
        }`}
      >
        <img
          src={messageIcon}
          alt=""
          className="h-5 w-5"
        />
      </Link>

      <Link
        to="/contractor/mypage"
        aria-label="마이페이지"
        aria-current={
          isMyPageActive ? 'page' : undefined
        }
        className={`rounded-[10px] p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
          isMyPageActive ? 'bg-[#eff6ff]' : ''
        }`}
      >
        <img
          src={userIcon}
          alt=""
          className="h-5 w-5"
        />
      </Link>

      <Link
        to="/contractor/notifications"
        aria-label={`알림${
          unreadCount
            ? `, 읽지 않은 알림 ${unreadCount}개`
            : ''
        }`}
        aria-current={
          isNotificationActive
            ? 'page'
            : undefined
        }
        className={`relative rounded-[10px] p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
          isNotificationActive
            ? 'bg-[#eff6ff]'
            : ''
        }`}
      >
        <img
          src={bellIcon}
          alt=""
          className="h-5 w-5"
        />

        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white"
          >
            {unreadCount}
          </span>
        ) : null}
      </Link>
    </div>
  )
}