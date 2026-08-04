import { useEffect, useRef, useState } from 'react'

interface Props { open: boolean; initialStartDate: string; initialCompletionDate: string; onClose: () => void; onSave: (startDate: string, completionDate: string, reason: string) => void }
export default function ContractorProjectScheduleDialog({ open, initialStartDate, initialCompletionDate, onClose, onSave }: Props) {
  const [startDate, setStartDate] = useState(initialStartDate)
  const [completionDate, setCompletionDate] = useState(initialCompletionDate)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const cancelRef = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); previousFocus.current?.focus() }
  }, [onClose, open])
  if (!open) return null
  const submit = () => {
    if (!startDate || !completionDate) return setError('시작일과 종료 예정일을 모두 선택해 주세요.')
    if (completionDate < startDate) return setError('종료 예정일은 시작일보다 빠를 수 없습니다.')
    if (!reason.trim()) return setError('일정 변경 사유를 입력해 주세요.')
    onSave(startDate, completionDate, reason.trim())
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title" className="max-h-[calc(100dvh-32px)] w-full max-w-[361px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <h2 id="schedule-dialog-title" className="text-lg font-bold text-[#0f172a]">공사 일정 변경</h2><p className="mt-2 text-xs leading-5 text-[#64748b]">프로젝트 공사 시작일과 종료 예정일을 변경해 주세요.</p>
      <label className="mt-4 block text-xs font-bold text-[#334155]">시작일<input type="date" value={startDate} onInput={(e) => setStartDate(e.currentTarget.value)} className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3" /></label>
      <label className="mt-3 block text-xs font-bold text-[#334155]">종료 예정일<input type="date" value={completionDate} onInput={(e) => setCompletionDate(e.currentTarget.value)} className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3" /></label>
      <label className="mt-3 block text-xs font-bold text-[#334155]">일정 변경 사유<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="일정 변경 사유를 입력하세요." maxLength={200} className="mt-2 h-24 w-full resize-none rounded-lg border border-[#cbd5e1] p-3" /></label>
      {error ? <p role="alert" className="mt-2 text-xs text-[#dc2626]">{error}</p> : null}
      <div className="mt-5 grid grid-cols-2 gap-2"><button ref={cancelRef} type="button" onClick={onClose} className="h-12 rounded-lg border border-[#2563eb] font-bold text-[#2563eb]">취소</button><button type="button" onClick={submit} className="h-12 rounded-lg bg-[#2563eb] font-bold text-white">일정 변경 저장</button></div>
    </section>
  </div>
}
