import { useState } from 'react'

interface ContractorConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

const reasons = ['지역 미지원', '예산 범위 불일치', '전문 분야 불일치', '일정 조율 불가', '기타'] as const

export default function ContractorConfirmDialog({ open, onClose, onConfirm }: ContractorConfirmDialogProps) {
  const [reason, setReason] = useState<(typeof reasons)[number]>('지역 미지원')
  const [otherReason, setOtherReason] = useState('')

  if (!open) return null

  const confirmedReason = reason === '기타' ? otherReason.trim() || '기타' : reason

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f172a]/35 px-0" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title" className="w-full max-w-[393px] rounded-t-[20px] bg-white px-4 pb-8 pt-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <h2 id="reject-dialog-title" className="text-base font-bold text-[#1e293b]">의뢰 거절 사유</h2>
          <button type="button" aria-label="거절 사유 창 닫기" onClick={onClose} className="rounded-md px-2 py-1 text-xl text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">×</button>
        </div>
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">거절 사유 선택</legend>
          {reasons.map((item) => (
            <label key={item} className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-2 text-xs font-bold ${reason === item ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]' : 'border-[#e2e8f0] text-[#1e293b]'}`}>
              <input type="radio" name="reject-reason" value={item} checked={reason === item} onChange={() => setReason(item)} className="accent-[#2563eb]" />
              {item}
            </label>
          ))}
        </fieldset>
        {reason === '기타' ? (
          <label className="mt-2 block">
            <span className="sr-only">기타 거절 사유</span>
            <textarea value={otherReason} onChange={(event) => setOtherReason(event.target.value)} placeholder="기타 사유를 입력하세요." className="h-16 w-full resize-none rounded-lg border border-[#e2e8f0] p-2 text-xs text-[#1e293b] outline-none focus:border-[#2563eb]" />
          </label>
        ) : null}
        <p className="mt-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 text-[11px] font-bold leading-4 text-[#b91c1c]">의뢰를 거절하면 미성사 거래로 이동하며 다시 승인할 수 없습니다.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-12 rounded-lg border border-[#e2e8f0] text-[13px] font-bold text-[#2563eb]">돌아가기</button>
          <button type="button" onClick={() => onConfirm(confirmedReason)} className="h-12 rounded-lg bg-[#ef4444] text-[13px] font-bold text-white">거절 확정</button>
        </div>
      </section>
    </div>
  )
}
