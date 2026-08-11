import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorNotificationCard from '@/components/contractor/ContractorNotificationCard'
import type { ContractorNotification, ContractorNotificationFilter } from '@/types/contractorPortal'
import { getNotifications, readAllNotifications, readNotification } from '@/api/notificationApi'

const filters: readonly { id: ContractorNotificationFilter; label: string }[] = [
  { id: 'all', label: '전체' }, { id: 'request', label: '의뢰' }, { id: 'estimate', label: '견적' }, { id: 'visit', label: '일정' }, { id: 'settlement', label: '정산' },
]
const filterTypes = { request: 'REQUEST', estimate: 'ESTIMATE', visit: 'VISIT', settlement: 'SETTLEMENT' } as const

export default function ContractorNotificationPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<ContractorNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getNotifications({ size: 50 }).then((page) => {
      if (!active) return
      const today = new Date().toISOString().slice(0, 10)
      setNotifications(page.content.map((item) => ({
        notificationId: String(item.id), type: item.type === 'QUOTE' ? 'ESTIMATE' : item.type === 'SCHEDULE' ? 'VISIT' : item.type,
        title: item.title, message: item.content, createdAtLabel: item.createdAt.slice(0, 16).replace('T', ' '),
        section: item.createdAt.startsWith(today) ? 'TODAY' : 'PREVIOUS', isRead: item.read, destination: '',
      })))
    }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : '알림을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const [filter, setFilter] = useState<ContractorNotificationFilter>('all')
  const filtered = useMemo(() => filter === 'all' ? notifications : notifications.filter((item) => item.type === filterTypes[filter]), [filter, notifications])
  const unreadCount = notifications.filter((item) => !item.isRead).length
  const openNotification = async (notification: ContractorNotification) => {
    if (!notification.isRead) {
      try { await readNotification(Number(notification.notificationId)); setNotifications((items) => items.map((item) => item.notificationId === notification.notificationId ? { ...item, isRead: true } : item)) }
      catch (readError) { setError(readError instanceof Error ? readError.message : '읽음 처리에 실패했습니다.'); return }
    }
    if (notification.destination) navigate(notification.destination)
  }
  const markAllNotificationsRead = async () => {
    try { await readAllNotifications(); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))) }
    catch (readError) { setError(readError instanceof Error ? readError.message : '읽음 처리에 실패했습니다.') }
  }
  const today = filtered.filter((item) => item.section === 'TODAY')
  const previous = filtered.filter((item) => item.section === 'PREVIOUS')
  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="알림" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs leading-5 text-[#64748b]">업무와 관련된 새로운 알림을 확인하세요.</p>
          <button type="button" disabled={unreadCount === 0} onClick={markAllNotificationsRead} className="h-8 shrink-0 rounded-lg border border-[#dbe3ef] bg-white px-3 text-[11px] font-bold text-[#2563eb] disabled:text-[#94a3b8]">모두 읽음</button>
        </div>
        <p className="sr-only" aria-live="polite">읽지 않은 알림 {unreadCount}개</p>
        <div className="mt-4 grid grid-cols-5 gap-2" aria-label="알림 유형 필터">
          {filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-9 min-w-0 rounded-full px-1 text-[11px] font-bold ${filter === item.id ? 'bg-[#2563eb] text-white' : 'border border-[#dbe3ef] bg-white text-[#475569]'}`}>{item.label}</button>)}
        </div>
        {loading ? <p className="py-10 text-center text-xs text-[#64748b]">알림을 불러오는 중입니다.</p> : null}
        {error ? <p role="alert" className="mt-4 text-center text-xs text-[#dc2626]">{error}</p> : null}
        {!loading && !error && filtered.length === 0 ? <div className="mt-5"><ContractorEmptyState title="알림이 없습니다" description="선택한 유형의 알림이 없습니다." /></div> : null}
        {today.length > 0 ? <section className="mt-4" aria-labelledby="notification-today"><h2 id="notification-today" className="mb-2 text-sm font-bold text-[#1e293b]">오늘</h2><div className="space-y-3">{today.map((item) => <ContractorNotificationCard key={item.notificationId} notification={item} onOpen={openNotification} />)}</div></section> : null}
        {previous.length > 0 ? <section className="mt-5" aria-labelledby="notification-previous"><h2 id="notification-previous" className="mb-2 text-sm font-bold text-[#1e293b]">이전 알림</h2><div className="space-y-3">{previous.map((item) => <ContractorNotificationCard key={item.notificationId} notification={item} onOpen={openNotification} />)}</div></section> : null}
      </main>
    </ContractorMobileShell>
  )
}
