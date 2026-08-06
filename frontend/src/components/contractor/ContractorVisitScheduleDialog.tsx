import { useEffect, useRef, useState } from 'react'
import type { ContractorVisitSchedule } from '@/types/contractorPortal'

interface ContractorVisitScheduleDialogProps {
  open: boolean
  currentSchedule: ContractorVisitSchedule
  onClose: () => void
  onSubmit: (schedule: ContractorVisitSchedule) => void
}

export default function ContractorVisitScheduleDialog({ open, currentSchedule, onClose, onSubmit }: ContractorVisitScheduleDialogProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const canSubmit = Boolean(date && time)

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f172a]/70 px-3 pb-3" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="visit-proposal-title" className="max-h-[calc(100dvh-24px)] w-full max-w-[393px] overflow-y-auto rounded-[20px] bg-white px-4 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#e2e8f0]" />
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <h2 id="visit-proposal-title" className="text-base font-bold text-[#1e293b]">다른 일정 제안</h2>
          <button ref={closeButtonRef} type="button" aria-label="다른 일정 제안 닫기" onClick={onClose} className="rounded-md px-2 py-1 text-xl text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">×</button>
        </div>
        <p className="mt-2 text-[11px] text-[#64748b]">사용자에게 제안할 방문 일정을 입력해 주세요.</p>
        <div className="mt-3 space-y-3">
          <label className="block text-[11px] font-bold text-[#1e293b]">
            제안 날짜
            <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 h-12 w-full rounded-lg border border-[#e2e8f0] px-3 text-xs font-normal text-[#1e293b] outline-none focus:border-[#2563eb]" />
          </label>
          <label className="block text-[11px] font-bold text-[#1e293b]">
            제안 시간
            <input type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 h-12 w-full rounded-lg border border-[#e2e8f0] px-3 text-xs font-normal text-[#1e293b] outline-none focus:border-[#2563eb]" />
          </label>
          <label className="block text-[11px] font-bold text-[#1e293b]">
            전달 사항
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="일정 변경 사유 또는 전달 사항을 입력하세요." className="mt-1 h-16 w-full resize-none rounded-lg border border-[#e2e8f0] p-3 text-xs font-normal text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb]" />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-12 rounded-lg border border-[#e2e8f0] text-xs font-bold text-[#2563eb]">취소</button>
          <button type="button" disabled={!canSubmit} onClick={() => onSubmit({ ...currentSchedule, date, time, note: note.trim() })} className="h-12 rounded-lg bg-[#2563eb] text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">제안 보내기</button>
        </div>
      </section>
    </div>
  )
}
