import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface UserMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuIconProps {
  className?: string
}

function HomeIcon({ className }: MenuIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
}

function ClipboardListIcon({ className }: MenuIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h4" /></svg>
}

function HammerIcon({ className }: MenuIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9" /><path d="m17.6 2.4 4 4-4.8 4.8-4-4Z" /></svg>
}

function CircleUserIcon({ className }: MenuIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="9" r="3" /><path d="M6.5 19a6 6 0 0 1 11 0" /></svg>
}

function SettingsIcon({ className }: MenuIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.08h-3v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.02 15a1.7 1.7 0 0 0-1.56-1.03H5.4v-3h.06A1.7 1.7 0 0 0 7.02 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06A1.7 1.7 0 0 0 10.68 5a1.7 1.7 0 0 0 1.03-1.56V3.4h3v.04A1.7 1.7 0 0 0 15.74 5a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03h.04v3h-.04A1.7 1.7 0 0 0 19.4 15Z" /></svg>
}

const menuItems = [
  { label: '홈', path: '/', exact: true, Icon: HomeIcon },
  { label: '견적 요청 내역', path: '/mypage/requests', exact: false, Icon: ClipboardListIcon },
  { label: '시공 내역', path: '/mypage/constructions', exact: false, Icon: HammerIcon },
  { label: '마이페이지', path: '/mypage', exact: true, Icon: CircleUserIcon },
  { label: '계정 설정', path: '/settings', exact: true, Icon: SettingsIcon },
] as const

export default function UserMenuDrawer({ isOpen, onClose }: UserMenuDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const drawerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )

      if (!focusableElements?.length) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const moveTo = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true" aria-labelledby="user-menu-title">
      <div className="relative h-dvh w-full max-w-[393px] overflow-hidden">
        <button type="button" tabIndex={-1} aria-label="메뉴 닫기" className="absolute inset-0 bg-[#0f172a]/35" onClick={onClose} />

        <nav id="user-menu-drawer" ref={drawerRef} aria-label="사용자 주요 메뉴" className="absolute inset-y-0 left-0 z-10 w-[280px] bg-white shadow-[8px_0_24px_rgba(15,23,42,0.12)]">
          <div className="flex h-16 items-center justify-between border-b border-[#e2e8f0] px-4">
            <h2 id="user-menu-title" className="text-[17px] font-bold text-[#1e293b]">SpaceUP</h2>
            <button ref={closeButtonRef} type="button" aria-label="메뉴 닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <div className="space-y-2 p-4">
            {menuItems.map(({ label, path, exact, Icon }) => {
              const isActive = exact ? location.pathname === path : location.pathname.startsWith(path)
              return (
                <button key={path} type="button" onClick={() => moveTo(path)} className={`flex h-[52px] w-full items-center gap-3 rounded-[10px] px-[14px] text-left text-[14px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${isActive ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#1e293b]'}`}>
                  <Icon className="size-5 shrink-0" />
                  {label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
