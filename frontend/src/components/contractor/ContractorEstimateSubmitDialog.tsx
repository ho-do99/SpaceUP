import { useEffect, useRef } from 'react'

interface ContractorEstimateSubmitDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
}

export default function ContractorEstimateSubmitDialog({ open, onClose, onSubmit }: ContractorEstimateSubmitDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="estimate-submit-title" className="w-full max-w-[329px] rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl">
        <h2 id="estimate-submit-title" className="text-center text-[17px] font-bold text-[#0f172a]">견적서를 제출하시겠습니까?</h2>
        <p className="mt-4 text-center text-xs leading-5 text-[#64748b]">작성한 견적서를 사용자에게 제출하시겠습니까?<br />제출 후에는 사용자가 견적 내용을 확인할 수 있습니다.</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button ref={cancelRef} type="button" onClick={onClose} className="h-12 rounded-[10px] border border-[#2563eb] text-sm font-bold text-[#2563eb]">취소</button>
          <button type="button" onClick={onSubmit} className="h-12 rounded-[10px] bg-[#2563eb] text-sm font-bold text-white">제출하기</button>
        </div>
      </section>
    </div>
  )
}
