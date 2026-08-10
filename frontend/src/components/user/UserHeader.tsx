import {
  Link,
  useLocation,
} from 'react-router-dom'

import backIcon from '@/assets/user/icons/back.svg'
import bellIcon from '@/assets/user/icons/bell.svg'
import menuIcon from '@/assets/user/icons/menu.svg'
import messageCircleIcon from '@/assets/user/icons/message-circle.svg'
import userRoundIcon from '@/assets/user/icons/user-round.svg'
import homeIcon from '@/assets/user/home/header-home.svg'

interface UserHeaderProps {
  variant: 'main' | 'detail'
  title?: string
  onBack?: () => void
}

export default function UserHeader({
  variant,
  title = 'SpaceUP',
  onBack,
}: UserHeaderProps) {
  const isMain = variant === 'main'
  const { pathname } = useLocation()

  return (
    <header className="h-14 shrink-0 border-b border-[#e2e8f0] bg-white">
      <div className="flex h-full items-center justify-between pl-4 pr-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isMain ? (
            <button
              type="button"
              disabled
              aria-label="메뉴"
              className="flex size-10 cursor-default items-center justify-center disabled:opacity-100"
            >
              <img
                src={menuIcon}
                alt=""
                className="size-5"
              />
            </button>
          ) : (
            <button
              type="button"
              aria-label="뒤로가기"
              className="flex size-10 shrink-0 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              onClick={onBack}
            >
              <img
                src={backIcon}
                alt=""
                className="size-5"
              />
            </button>
          )}

          <p className="truncate text-[16px] font-bold leading-[22px] text-[#1e293b]">
            {title}
          </p>
        </div>

        <nav
          className="flex h-8 shrink-0 items-center gap-0.5"
          aria-label="사용자 메뉴"
        >
          <Link
            to="/"
            aria-label="홈"
            className="flex h-8 w-6 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img
              src={homeIcon}
              alt=""
              className="size-5"
            />
          </Link>

          <Link
            to="/chats"
            aria-label="채팅"
            className="flex h-8 w-6 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img
              src={messageCircleIcon}
              alt=""
              className="size-3.5"
            />
          </Link>

          <Link
            to="/mypage"
            aria-label="마이페이지"
            className="flex h-8 w-6 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img
              src={userRoundIcon}
              alt=""
              className="size-3.5"
            />
          </Link>

          <Link
            to="/notifications"
            aria-label="알림"
            className="relative flex h-8 w-6 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img
              src={bellIcon}
              alt=""
              className="size-3.5"
            />

            {pathname !== '/notifications' ? (
              <span
                aria-label="읽지 않은 알림 3개"
                className="absolute left-3.5 top-[3px] flex size-2.5 items-center justify-center rounded-full bg-[#ef4444] text-[6px] font-bold leading-2 text-white"
              >
                3
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  )
}