import type { ContractorChatMessage } from '@/types/contractorPortal'

export default function ContractorChatBubble({ message }: { message: ContractorChatMessage }) {
  if (message.sender === 'system') {
    return <p className="mx-auto max-w-[280px] rounded-full bg-[#e2e8f0] px-3 py-1 text-center text-[10px] text-[#64748b]">{message.text}</p>
  }

  const outgoing = message.sender === 'contractor'
  return (
    <div className={`flex items-end gap-1.5 ${outgoing ? 'justify-end' : 'justify-start'}`}>
      {outgoing ? <time className="shrink-0 text-[10px] text-[#94a3b8]">{message.timeLabel}</time> : null}
      <p className={`max-w-[280px] break-words rounded-2xl px-3 py-2 text-xs leading-5 shadow-sm ${outgoing ? 'rounded-br-md bg-[#dbeafe] text-[#1e3a8a]' : 'rounded-bl-md border border-[#e2e8f0] bg-white text-[#1e293b]'}`}>
        {message.text}
      </p>
      {!outgoing ? <time className="shrink-0 text-[10px] text-[#94a3b8]">{message.timeLabel}</time> : null}
    </div>
  )
}
