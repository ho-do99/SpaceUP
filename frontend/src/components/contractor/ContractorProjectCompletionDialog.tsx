import { useEffect, useRef } from 'react'

interface Props { open: boolean; onClose: () => void; onConfirm: () => void }
export default function ContractorProjectCompletionDialog({ open, onClose, onConfirm }: Props) {
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
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-8" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="completion-dialog-title" className="w-full max-w-[329px] rounded-2xl bg-white p-6 shadow-2xl"><p aria-hidden="true" className="text-3xl text-[#ef4444]">⚠</p><h2 id="completion-dialog-title" className="mt-2 text-lg font-bold text-[#0f172a]">완료 확인을 요청하시겠어요?</h2><p className="mt-3 text-xs leading-5 text-[#64748b]">사용자에게 시공 완료 확인 요청이 전달됩니다.</p><div className="mt-5 grid grid-cols-2 gap-2"><button ref={cancelRef} type="button" onClick={onClose} className="h-12 rounded-lg border border-[#2563eb] font-bold text-[#2563eb]">취소</button><button type="button" onClick={onConfirm} className="h-12 rounded-lg bg-[#2563eb] text-sm font-bold text-white">완료 확인 요청</button></div></section></div>
}
