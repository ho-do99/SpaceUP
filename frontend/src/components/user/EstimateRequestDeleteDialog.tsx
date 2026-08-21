import { useEffect, useRef } from 'react'
import type { EstimateRequestSummary } from '@/mocks/estimateRequests'

interface EstimateRequestDeleteDialogProps {
  request?: EstimateRequestSummary
  deleting: boolean
  error: string
  onClose: () => void
  onConfirm: () => void
}

export default function EstimateRequestDeleteDialog({
  request,
  deleting,
  error,
  onClose,
  onConfirm,
}: EstimateRequestDeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!request) return
    cancelRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [deleting, onClose, request])

  if (!request) return null

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center bg-[#0f172a]/40 px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onClose()
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="estimate-request-delete-title"
        aria-describedby="estimate-request-delete-description"
        className="w-full max-w-[345px] rounded-[16px] bg-white p-5 shadow-xl"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" />
          </svg>
        </div>
        <h2 id="estimate-request-delete-title" className="mt-4 text-[17px] font-bold text-[#1e293b]">
          견적 요청을 삭제하시겠어요?
        </h2>
        <p id="estimate-request-delete-description" className="mt-2 text-[12px] leading-5 text-[#64748b]">
          <strong className="font-bold text-[#334155]">{request.contractorName}</strong> 요청이 내역에서 삭제됩니다.
          삭제 후에는 화면에서 다시 확인할 수 없습니다.
        </p>
        {error ? <p role="alert" className="mt-3 rounded-[8px] bg-[#fef2f2] px-3 py-2 text-[11px] leading-4 text-[#dc2626]">{error}</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={cancelRef} type="button" disabled={deleting} onClick={onClose} className="h-11 rounded-[8px] border border-[#cbd5e1] bg-white text-[12px] font-bold text-[#475569] disabled:opacity-50">
            취소
          </button>
          <button type="button" disabled={deleting} onClick={onConfirm} className="h-11 rounded-[8px] bg-[#ef4444] text-[12px] font-bold text-white disabled:cursor-wait disabled:bg-[#fca5a5]">
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </section>
    </div>
  )
}
