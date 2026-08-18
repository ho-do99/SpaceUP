import { useState, type KeyboardEvent } from 'react'

export default function ContractorChatComposer({
  onSend,
  enabled = true,
  sending = false,
}: {
  onSend: (message: string) => void
  enabled?: boolean
  sending?: boolean
}) {
  const [message, setMessage] = useState('')
  const canSend = enabled && !sending && message.trim().length > 0

  const send = () => {
    if (!canSend) return
    onSend(message)
    setMessage('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="shrink-0 border-t border-[#e2e8f0] bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">채팅 메시지</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!enabled}
            rows={1}
            aria-label="채팅 메시지"
            placeholder={enabled ? '메시지를 입력하세요.' : '종료된 채팅방입니다.'}
            className="max-h-24 min-h-11 w-full resize-none rounded-xl border border-[#cbd5e1] px-3 py-3 text-xs leading-5 outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#bfdbfe]"
          />
        </label>
        <button type="button" onClick={send} disabled={!canSend} className="h-11 shrink-0 rounded-lg bg-[#2563eb] px-4 text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:bg-[#cbd5e1]">
          전송
        </button>
      </div>
      <p className="mt-1 text-[10px] text-[#94a3b8]">Enter 전송 · Shift+Enter 줄바꿈</p>
    </div>
  )
}
