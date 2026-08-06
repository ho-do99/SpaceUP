import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface ContractorMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContractorMenuDrawer({
  isOpen,
  onClose,
}: ContractorMenuDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const drawerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements =
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

      if (!focusableElements || focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const isCompanyActive = location.pathname.startsWith(
    '/contractor/company',
  )

  const isSettingsActive =
    location.pathname.startsWith('/contractor/settings') ||
    location.pathname === '/contractor/mypage'

  const moveTo = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contractor-menu-title"
    >
      <div className="relative h-dvh w-full max-w-[393px] overflow-hidden">
        <button
          type="button"
          tabIndex={-1}
          aria-label="메뉴 닫기"
          className="absolute inset-0 bg-[#0f172a]/35"
          onClick={onClose}
        />

        <nav
          id="contractor-menu-drawer"
          ref={drawerRef}
          aria-label="시공사 주요 메뉴"
          className="absolute inset-y-0 left-0 z-10 w-[280px] bg-white shadow-[8px_0_24px_rgba(15,23,42,0.12)]"
        >
          <div className="flex h-16 items-center justify-between border-b border-[#e2e8f0] px-4">
            <h2
              id="contractor-menu-title"
              className="text-[17px] font-bold text-[#1e293b]"
            >
              SpaceUP 시공사
            </h2>

            <button
              ref={closeButtonRef}
              type="button"
              aria-label="메뉴 닫기"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 p-4">
            <button
              type="button"
              onClick={() => moveTo('/contractor/company')}
              className={`flex h-[52px] w-full items-center gap-3 rounded-[10px] px-[14px] text-left text-[14px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                isCompanyActive
                  ? 'bg-[#eff6ff] text-[#2563eb]'
                  : 'text-[#1e293b]'
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M6 21V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v17" />
                <path d="M15 8h3a1 1 0 0 1 1 1v12" />
                <path d="M9 7h2" />
                <path d="M9 11h2" />
                <path d="M9 15h2" />
              </svg>

              업체정보
            </button>

            <button
              type="button"
              onClick={() => moveTo('/contractor/settings')}
              className={`flex h-[52px] w-full items-center gap-3 rounded-[10px] px-[14px] text-left text-[14px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                isSettingsActive
                  ? 'bg-[#eff6ff] text-[#2563eb]'
                  : 'text-[#1e293b]'
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.02 15a1.7 1.7 0 0 0-1.56-1.03H5.4v-3h.06A1.7 1.7 0 0 0 7.02 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06A1.7 1.7 0 0 0 10.68 5a1.7 1.7 0 0 0 1.03-1.56V3.4h3v.04A1.7 1.7 0 0 0 15.74 5a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03h.04v3h-.04A1.7 1.7 0 0 0 19.4 15Z" />
              </svg>

              설정
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}