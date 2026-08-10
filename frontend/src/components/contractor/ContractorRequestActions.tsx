interface ContractorRequestActionsProps {
  disabled?: boolean
  onReject: () => void
  onApprove: () => void
}
export default function ContractorRequestActions({ disabled = false, onReject, onApprove }: ContractorRequestActionsProps) {
  return (
    <div className="grid h-16 grid-cols-2 gap-2 p-2">
      <button type="button" disabled={disabled} onClick={onReject} className="h-12 rounded-lg border border-[#ef4444] bg-white text-[13px] font-bold text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-45">의뢰 거절</button>
      <button type="button" disabled={disabled} onClick={onApprove} className="h-12 rounded-lg bg-[#2563eb] text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">의뢰 승인</button>
    </div>
  )
}
