import { useEffect, useRef } from 'react'

interface ContractorLogoutDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ContractorLogoutDialog({ open, onCancel, onConfirm }: ContractorLogoutDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== 'Tab') return
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-description"
        className="w-full max-w-[329px] rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          </svg>
        </div>
        <h2 id="logout-confirm-title" className="mt-4 text-lg font-bold leading-[26px] text-[#1e293b]">
          로그아웃하시겠어요?
        </h2>
        <p id="logout-confirm-description" className="mt-2 text-xs leading-5 text-[#64748b]">
          로그아웃하면 로그인 화면으로 이동합니다.
        </p>
        <div className="mt-5 flex gap-[10px]">
          <button ref={cancelButtonRef} type="button" onClick={onCancel} className="h-12 flex-1 rounded-[10px] border border-[#cbd5e1] bg-white text-sm font-bold text-[#334155] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
            취소
          </button>
          <button type="button" onClick={onConfirm} className="h-12 flex-1 rounded-[10px] bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
