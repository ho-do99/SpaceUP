import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getChatMessages, readChat, sendChatMessage } from '@/api/chatApi'
import { getQuotesByRequest } from '@/api/estimateApi'
import ContractorChatComposer from '@/components/contractor/ContractorChatComposer'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import type { ChatMessage } from '@/types/backendContractor'

export default function LandlordChatPage() {
  const navigate = useNavigate()
  const { requestId, contractorId } = useParams<{ requestId: string; contractorId: string }>()
  const numericRequestId = Number(requestId)
  const numericContractorId = Number(contractorId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [contractorName, setContractorName] = useState(`시공사 #${contractorId ?? ''}`)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!Number.isInteger(numericRequestId) || !Number.isInteger(numericContractorId)) {
      setError('잘못된 채팅방 주소입니다.')
      return
    }
    let active = true
    Promise.all([
      getChatMessages(numericRequestId, numericContractorId),
      getQuotesByRequest(numericRequestId),
    ]).then(([chatMessages, quotes]) => {
      if (!active) return
      setMessages(chatMessages)
      const quote = quotes.find((item) => item.contractorId === numericContractorId)
      if (quote?.contractorName) setContractorName(quote.contractorName)
      void readChat(numericRequestId, numericContractorId).catch(() => undefined)
    }).catch(() => {
      if (active) setError('채팅 내용을 불러오지 못했습니다.')
    })
    return () => { active = false }
  }, [numericContractorId, numericRequestId])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight
  }, [messages.length])

  const send = async (content: string) => {
    if (sending) return
    setSending(true)
    setError(null)
    try {
      const message = await sendChatMessage(numericRequestId, content, numericContractorId)
      setMessages((current) => [...current, message])
    } catch {
      setError('메시지를 보내지 못했습니다. 시공사가 이미 확정된 의뢰인지 확인해주세요.')
    } finally {
      setSending(false)
    }
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title={contractorName} onBack={() => navigate(`/mypage/requests/${requestId}`)} />
      <div ref={containerRef} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-4">
        <p className="mx-auto mb-4 max-w-[300px] rounded-lg bg-[#e2e8f0] px-3 py-2 text-center text-[10px] leading-4 text-[#64748b]">시공사별 독립 채팅방입니다. 다른 시공사에게 이 대화가 공개되지 않습니다.</p>
        <div className="space-y-3">
          {messages.map((message) => {
            const outgoing = message.senderType === 'LANDLORD'
            const system = message.senderType === 'SYSTEM'
            if (system) return <p key={message.id} className="mx-auto max-w-[280px] rounded-full bg-[#e2e8f0] px-3 py-1 text-center text-[10px] text-[#64748b]">{message.content}</p>
            return (
              <div key={message.id} className={`flex items-end gap-1.5 ${outgoing ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[280px] break-words rounded-2xl px-3 py-2 text-xs leading-5 shadow-sm ${outgoing ? 'rounded-br-md bg-[#dbeafe] text-[#1e3a8a]' : 'rounded-bl-md border border-[#e2e8f0] bg-white text-[#1e293b]'}`}>{message.content}</p>
                <time className="shrink-0 text-[10px] text-[#94a3b8]">{message.createdAt?.slice(11, 16)}</time>
              </div>
            )
          })}
          {!messages.length && !error ? <p className="py-10 text-center text-xs text-[#64748b]">첫 메시지를 보내보세요.</p> : null}
        </div>
        {error ? <p role="alert" className="mt-4 text-center text-xs font-bold text-[#dc2626]">{error}</p> : null}
      </div>
      <ContractorChatComposer onSend={(message) => void send(message)} />
    </UserScreenShell>
  )
}
