import { useEffect, useRef, useState } from 'react'

interface ContractorEstimateValidityDialogProps {
  open: boolean
  currentValidUntil: string
  isSaving?: boolean
  submitError?: string
  onClose: () => void
  onSave: (validUntil: string, note: string) => void
}

export default function ContractorEstimateValidityDialog({ open, currentValidUntil, isSaving = false, submitError = '', onClose, onSave }: ContractorEstimateValidityDialogProps) {
  const [validUntil, setValidUntil] = useState('2026-08-14')
  const [note, setNote] = useState('사용자 확인 중 기간을 7일 연장합니다.')
  const [error, setError] = useState('')
  const cancelRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    const onKeyDown = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  const save = () => {
    if (!validUntil || validUntil <= currentValidUntil) {
      setError('현재 유효일보다 이후 날짜를 선택해 주세요.')
      return
    }
    onSave(validUntil, note.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="validity-title" className="max-h-[calc(100dvh-32px)] w-full max-w-[361px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <h2 id="validity-title" className="text-[17px] font-bold text-[#1e293b]">유효기간 연장</h2>
        <p className="mt-2 text-xs leading-5 text-[#64748b]">현재 유효일 {currentValidUntil.replace(/-/g, '.')}</p>
        <label className="mt-5 block text-xs font-bold text-[#1e293b]">새 만료일
          <input type="date" min="2026-08-08" value={validUntil} disabled={isSaving} aria-invalid={Boolean(error)} aria-describedby={error ? 'validity-error' : undefined} onChange={(event) => { setValidUntil(event.target.value); setError('') }} className="mt-2 h-12 w-full rounded-xl border border-[#e2e8f0] px-3 text-xs outline-none focus:border-[#2563eb] disabled:bg-[#f8fafc]" />
        </label>
        {error ? <p id="validity-error" role="alert" className="mt-1 text-[11px] font-semibold text-[#dc2626]">{error}</p> : null}
        <label className="mt-4 block text-xs font-bold text-[#1e293b]">연장 메모
          <textarea maxLength={200} value={note} disabled={isSaving} onChange={(event) => setNote(event.target.value)} className="mt-2 h-24 w-full resize-none rounded-xl border border-[#e2e8f0] p-3 text-xs leading-5 outline-none focus:border-[#2563eb] disabled:bg-[#f8fafc]" />
        </label>
        {submitError ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{submitError}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button ref={cancelRef} type="button" disabled={isSaving} onClick={onClose} className="h-12 rounded-xl border border-[#2563eb] text-sm font-bold text-[#2563eb] disabled:opacity-60">취소</button>
          <button type="button" disabled={isSaving} onClick={save} className="h-12 rounded-xl bg-[#2563eb] text-sm font-bold text-white disabled:opacity-60">{isSaving ? '저장 중' : '연장 저장'}</button>
        </div>
      </section>
    </div>
  )
}
