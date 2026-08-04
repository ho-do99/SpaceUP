import bellIcon from '@/assets/user/icons/bell.svg'
import messageIcon from '@/assets/user/icons/message-circle.svg'
import userIcon from '@/assets/user/icons/user-round.svg'
import { Link } from 'react-router-dom'
import useContractorPortalFlow from './useContractorPortalFlow'

export default function ContractorHeaderActions() {
  const { notifications } = useContractorPortalFlow()
  const unreadCount = notifications.filter((notification) => !notification.isRead).length
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button type="button" disabled aria-label="채팅" className="rounded-md opacity-80 disabled:cursor-not-allowed">
        <img src={messageIcon} alt="" className="h-5 w-5" />
      </button>
      <button type="button" disabled aria-label="마이페이지" className="rounded-md opacity-80 disabled:cursor-not-allowed">
        <img src={userIcon} alt="" className="h-5 w-5" />
      </button>
      <Link to="/contractor/notifications" aria-label={`알림${unreadCount ? `, 읽지 않은 알림 ${unreadCount}개` : ''}`} className="relative rounded-md p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
        <img src={bellIcon} alt="" className="h-5 w-5" />
        {unreadCount > 0 ? <span aria-hidden="true" className="absolute -right-1.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white">{unreadCount}</span> : null}
      </Link>
    </div>
  )
}
