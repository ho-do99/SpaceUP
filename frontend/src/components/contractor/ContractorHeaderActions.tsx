import bellIcon from '@/assets/user/icons/bell.svg'
import messageIcon from '@/assets/user/icons/message-circle.svg'
import userIcon from '@/assets/user/icons/user-round.svg'

export default function ContractorHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button type="button" disabled aria-label="채팅" className="rounded-md opacity-80 disabled:cursor-not-allowed">
        <img src={messageIcon} alt="" className="h-5 w-5" />
      </button>
      <button type="button" disabled aria-label="마이페이지" className="rounded-md opacity-80 disabled:cursor-not-allowed">
        <img src={userIcon} alt="" className="h-5 w-5" />
      </button>
      <button type="button" disabled aria-label="알림" className="relative rounded-md opacity-80 disabled:cursor-not-allowed">
        <img src={bellIcon} alt="" className="h-5 w-5" />
        <span className="absolute -right-1.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white">3</span>
      </button>
    </div>
  )
}
