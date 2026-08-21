import { useEffect, useRef } from 'react'

interface ContractorVisitChangeRejectDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  initialRequest?: boolean
}

export default function ContractorVisitChangeRejectDialog({ open, onClose, onConfirm, initialRequest = false }: ContractorVisitChangeRejectDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelButtonRef.current?.focus()
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/60 px-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="visit-change-reject-title" className="w-full max-w-[361px] rounded-2xl bg-white p-5 shadow-2xl">
        <span aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fff7ed] text-xl text-[#ea580c]">!</span>
        <h2 id="visit-change-reject-title" className="mt-3 text-center text-base font-bold text-[#1e293b]">
          {initialRequest ? '방문 요청을 거절하시겠어요?' : '변경 요청을 거절하시겠어요?'}
        </h2>
        <p className="mt-2 text-center text-xs leading-5 text-[#64748b]">
          {initialRequest ? '거절하면 방문 일정은 미등록 상태로 돌아갑니다.' : '거절하면 기존 방문 일정이 유지됩니다.'}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button ref={cancelButtonRef} type="button" onClick={onClose} className="h-11 rounded-lg border border-[#e2e8f0] text-xs font-bold text-[#64748b]">취소</button>
          <button type="button" onClick={onConfirm} className="h-11 rounded-lg border border-[#ef4444] text-xs font-bold text-[#ef4444]">
            {initialRequest ? '방문 요청 거절' : '변경 요청 거절'}
          </button>
        </div>
      </section>
    </div>
  )
}
