import { useEffect, useRef } from 'react'

interface ContractorVisitCompletionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ContractorVisitCompletionDialog({ open, onClose, onConfirm }: ContractorVisitCompletionDialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="visit-completion-title" className="w-full max-w-[361px] rounded-2xl bg-white p-5 shadow-2xl">
        <span aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#ecfdf5] text-xl text-[#047857]">✓</span>
        <h2 id="visit-completion-title" className="mt-3 text-center text-base font-bold text-[#1e293b]">현장 방문을 완료하시겠어요?</h2>
        <p className="mt-2 text-center text-xs leading-5 text-[#64748b]">완료 처리 후 방문 완료 채팅에서 견적 작성 단계로 이동할 수 있습니다.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button ref={cancelButtonRef} type="button" onClick={onClose} className="h-11 rounded-lg border border-[#e2e8f0] text-xs font-bold text-[#64748b]">취소</button>
          <button type="button" onClick={onConfirm} className="h-11 rounded-lg bg-[#2563eb] text-xs font-bold text-white">방문 완료</button>
        </div>
      </section>
    </div>
  )
}
