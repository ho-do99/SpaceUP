import type { UserNotification } from '@/mocks/notifications'

interface NotificationCardProps {
  notification: UserNotification
  onSelect: (notification: UserNotification) => void
}

export default function NotificationCard({ notification, onSelect }: NotificationCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      aria-label={`${notification.title}, ${notification.occurredAtLabel}${notification.isRead ? ', 읽음' : ', 읽지 않음'}`}
      className={`flex min-h-[97px] w-full flex-col gap-[7px] rounded-xl border p-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
        notification.isRead
          ? 'border-[#e2e8f0] bg-white'
          : 'border-[#dbeafe] bg-[#eff6ff]'
      }`}
    >
      <span className="flex h-5 w-full items-center justify-between">
        <span className="flex min-w-0 items-center gap-1.5">
          {!notification.isRead ? (
            <span className="size-1.5 rounded-full bg-[#2563eb]" aria-hidden="true" />
          ) : null}
          <span className="rounded-[10px] bg-white px-2 py-[3px] text-[9px] leading-[14px] text-[#64748b]">
            {notification.categoryLabel}
          </span>
          {notification.flowLabel ? (
            <span className="truncate rounded-[10px] bg-[#dbeafe] px-2 py-[3px] text-[9px] font-medium leading-[14px] text-[#2563eb]">
              {notification.flowLabel}
            </span>
          ) : null}
        </span>
        <span className={`text-[9px] leading-[14px] ${notification.isRead ? 'text-[#94a3b8]' : 'text-[#2563eb]'}`}>
          {notification.occurredAtLabel}
        </span>
      </span>
      <span className="block w-full text-[13px] font-bold leading-[19px] text-[#1e293b]">
        {notification.title}
      </span>
      <span className="block w-full text-[10px] leading-4 text-[#64748b]">
        {notification.message}
      </span>
    </button>
  )
}
