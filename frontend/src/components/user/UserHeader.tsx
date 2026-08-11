import { useEffect, useRef, useState } from 'react'
import {
  Link,
  useLocation,
} from 'react-router-dom'

import backIcon from '@/assets/user/icons/back.svg'
import menuIcon from '@/assets/user/icons/menu.svg'
import UserMenuDrawer from '@/components/user/UserMenuDrawer'

interface HeaderIconProps {
  className?: string
}

function HomeIcon({ className }: HeaderIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

function MessageSquareIcon({ className }: HeaderIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  )
}

function CircleUserIcon({ className }: HeaderIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6.5 19a6 6 0 0 1 11 0" />
    </svg>
  )
}

function BellIcon({ className }: HeaderIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const wasMenuOpenRef = useRef(false)

  useEffect(() => {
    if (wasMenuOpenRef.current && !isMenuOpen) {
      menuButtonRef.current?.focus()
    }

    wasMenuOpenRef.current = isMenuOpen
  }, [isMenuOpen])

  return (
    <>
      <header className="h-14 shrink-0 border-b border-[#e2e8f0] bg-white">
        <div className="flex h-full items-center justify-between pl-4 pr-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isMain ? (
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="메뉴 열기"
                aria-haspopup="dialog"
                aria-expanded={isMenuOpen}
                aria-controls="user-menu-drawer"
                onClick={() => setIsMenuOpen((open) => !open)}
                className="flex size-10 items-center justify-center rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
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
            className="flex h-8 w-6 items-center justify-center rounded text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <HomeIcon className="size-5 shrink-0" />
          </Link>

          <Link
            to="/chats"
            aria-label="채팅"
            className="flex h-8 w-6 items-center justify-center rounded text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <MessageSquareIcon className="size-5 shrink-0" />
          </Link>

          <Link
            to="/mypage"
            aria-label="마이페이지"
            className="flex h-8 w-6 items-center justify-center rounded text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <CircleUserIcon className="size-5 shrink-0" />
          </Link>

          <Link
            to="/notifications"
            aria-label="알림"
            className="relative flex h-8 w-6 items-center justify-center rounded text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <BellIcon className="size-5 shrink-0" />

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
      {isMain ? <UserMenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} /> : null}
    </>
  )
}
