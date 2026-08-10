import type { ContractorNotification } from '@/types/contractorPortal'

const notificationMeta = {
  REQUEST: { label: '의뢰' },
  ESTIMATE: { label: '견적' },
  VISIT: { label: '일정' },
  SETTLEMENT: { label: '정산' },
} as const

interface Props {
  notification: ContractorNotification
  onOpen: (notification: ContractorNotification) => void
}

export default function ContractorNotificationCard({ notification, onOpen }: Props) {
  const meta = notificationMeta[notification.type]
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      aria-label={`${meta.label} 알림: ${notification.title}${notification.isRead ? ', 읽음' : ', 읽지 않음'}`}
      className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${notification.isRead ? 'border-[#dbe3ef] bg-white' : 'border-[#dbe3ef] bg-[#eff6ff]'}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {!notification.isRead ? <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" /> : null}
          <span className="rounded-full bg-[#f8fafc] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">{meta.label}</span>
        </span>
        <time className="shrink-0 text-[10px] text-[#2563eb]">{notification.createdAtLabel}</time>
      </span>
      <span className="mt-2 block break-words text-[13px] font-bold leading-5 text-[#0f172a]">{notification.title}</span>
      <span className="mt-1 block break-words text-[10px] leading-[15px] text-[#64748b]">{notification.message}</span>
    </button>
  )
}
