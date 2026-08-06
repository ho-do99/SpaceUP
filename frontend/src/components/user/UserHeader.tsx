import { Link, useLocation } from 'react-router-dom'
import backIcon from '@/assets/user/icons/back.svg'
import bellIcon from '@/assets/user/icons/bell.svg'
import menuIcon from '@/assets/user/icons/menu.svg'
import messageCircleIcon from '@/assets/user/icons/message-circle.svg'
import userRoundIcon from '@/assets/user/icons/user-round.svg'

interface UserHeaderProps {
  variant: 'main' | 'detail'
  title?: string
  onBack?: () => void
}

const unavailableIconButtonClass =
  'flex h-8 w-6 cursor-default items-center justify-center disabled:opacity-100'

export default function UserHeader({ variant, title = 'SpaceUP', onBack }: UserHeaderProps) {
  const isMain = variant === 'main'
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-[#e2e8f0] bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between overflow-hidden pl-4 pr-3">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {isMain ? (
            <button
              type="button"
              disabled
              aria-label="메뉴"
              className="flex size-10 shrink-0 cursor-default items-center justify-center disabled:opacity-100"
            >
              <img src={menuIcon} alt="" className="size-[22px]" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="홈으로 돌아가기"
              className="flex size-10 shrink-0 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563eb]"
              onClick={onBack}
            >
              <img src={backIcon} alt="" className="size-5" />
            </button>
          )}

          <p className="truncate text-[16px] font-bold leading-[22px] text-[#1e293b]">
            {title}
          </p>
        </div>

        <nav className="flex h-8 shrink-0 items-center gap-0.5" aria-label="사용자 메뉴">
          <button
            type="button"
            disabled
            aria-label="채팅"
            className={unavailableIconButtonClass}
          >
            <img src={messageCircleIcon} alt="" className="size-3.5" />
          </button>
          <Link
            to="/mypage"
            aria-label="마이페이지"
            className="flex h-8 w-6 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img src={userRoundIcon} alt="" className="size-3.5" />
          </Link>
          <Link
            to="/notifications"
            aria-label="알림"
            className="relative flex h-8 w-6 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img src={bellIcon} alt="" className="size-3.5" />
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
