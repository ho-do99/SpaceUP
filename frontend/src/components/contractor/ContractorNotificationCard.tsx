import type { ContractorNotification } from '@/types/contractorPortal'

const notificationMeta = {
  REQUEST: { label: '의뢰', symbol: '의', color: 'bg-[#dbeafe] text-[#2563eb]' },
  ESTIMATE: { label: '견적', symbol: '견', color: 'bg-[#ede9fe] text-[#7c3aed]' },
  VISIT: { label: '일정', symbol: '일', color: 'bg-[#dcfce7] text-[#16a34a]' },
  SETTLEMENT: { label: '정산', symbol: '정', color: 'bg-[#ffedd5] text-[#ea580c]' },
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
      className={`w-full rounded-xl border p-4 text-left shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${notification.isRead ? 'border-[#e2e8f0] bg-white' : 'border-[#bfdbfe] bg-[#eff6ff]'}`}
    >
      <span className="flex items-start gap-3">
        <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${meta.color}`}>{meta.symbol}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="break-words text-[13px] font-bold leading-5 text-[#0f172a]">{notification.title}</span>
            {!notification.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2563eb]"><span className="sr-only">읽지 않음</span></span> : null}
          </span>
          <span className="mt-1 block break-words text-xs leading-5 text-[#475569]">{notification.message}</span>
          <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#64748b]">
            <span className={`rounded-full px-2 py-0.5 font-bold ${meta.color}`}>{meta.label}</span>
            <time>{notification.createdAtLabel}</time>
          </span>
        </span>
      </span>
    </button>
  )
}
