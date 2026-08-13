import { useEffect, useRef } from 'react'

export type UserAccountAction = 'logout' | 'withdrawal'

interface UserAccountConfirmDialogProps {
  action: UserAccountAction | null
  errorMessage: string
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function UserAccountConfirmDialog({
  action,
  errorMessage,
  isSubmitting,
  onCancel,
  onConfirm,
}: UserAccountConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!action) return undefined

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

      if (!focusableElements || focusableElements.length === 0) return

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
  }, [action, onCancel])

  if (!action) return null

  const isWithdrawal = action === 'withdrawal'
  const title = isWithdrawal ? '회원탈퇴' : '로그아웃'
  const description = isWithdrawal
    ? '정말 회원탈퇴를 진행하시겠습니까?'
    : '로그아웃하시겠습니까?'
  const detail = isWithdrawal
    ? '탈퇴하면 계정 정보를 다시 사용할 수 없습니다.'
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="account-confirm-title"
        aria-describedby="account-confirm-description"
        aria-busy={isSubmitting}
        className="w-full max-w-[329px] rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="account-confirm-title" className="text-lg font-bold leading-[26px] text-[#1e293b]">
          {title}
        </h2>
        <p id="account-confirm-description" className="mt-3 text-sm font-semibold leading-6 text-[#334155]">
          {description}
        </p>
        {detail ? <p className="mt-2 text-xs leading-5 text-[#64748b]">{detail}</p> : null}
        {errorMessage ? <p role="alert" className="mt-3 text-xs font-semibold leading-5 text-[#dc2626]">{errorMessage}</p> : null}

        <div className="mt-5 flex gap-[10px]">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="h-12 flex-1 rounded-[10px] border border-[#cbd5e1] bg-white text-sm font-bold text-[#334155] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`h-12 flex-1 rounded-[10px] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              isWithdrawal
                ? 'bg-[#ef4444] focus-visible:outline-[#dc2626]'
                : 'bg-[#2563eb] focus-visible:outline-[#1d4ed8]'
            }`}
          >
            {isSubmitting ? '처리 중...' : title}
          </button>
        </div>
      </div>
    </div>
  )
}
