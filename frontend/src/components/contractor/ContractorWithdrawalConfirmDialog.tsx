import { useEffect, useRef } from 'react'

interface ContractorWithdrawalConfirmDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ContractorWithdrawalConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: ContractorWithdrawalConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

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

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

      if (!focusableElements || focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement =
        focusableElements[focusableElements.length - 1]

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
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

  if (!open) {
    return null
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="withdrawal-confirm-title"
        aria-describedby="withdrawal-confirm-description"
        className="w-full max-w-[329px] rounded-2xl bg-white p-6 shadow-xl"
      >
        <div
          aria-hidden="true"
          className="text-[28px] leading-[34px] text-[#ef4444]"
        >
          ⚠
        </div>

        <h2
          id="withdrawal-confirm-title"
          className="mt-4 text-lg font-bold leading-[26px] text-[#1e293b]"
        >
          정말 회원탈퇴를 진행할까요?
        </h2>

        <p
          id="withdrawal-confirm-description"
          className="mt-4 text-xs leading-5 text-[#64748b]"
        >
          탈퇴가 완료되면 현재 계정으로 다시 로그인할 수
          없으며, 삭제된 계정은 복구할 수 없습니다.
        </p>

        <div className="mt-4 flex gap-[10px]">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-[10px] border border-[#cbd5e1] bg-white text-sm font-bold text-[#334155] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-12 flex-1 rounded-[10px] bg-[#ef4444] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dc2626]"
          >
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  )
}