import { useEffect, useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorChatBubble from '@/components/contractor/ContractorChatBubble'
import ContractorChatComposer from '@/components/contractor/ContractorChatComposer'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'

interface ContractorChatPageProps {
  completed?: boolean
}

export default function ContractorChatPage({ completed = false }: ContractorChatPageProps) {
  const { requestId } = useParams()
  const request = findContractorRequestDetail(requestId)
  const { messages, addMessage, visitStatus } = useContractorPortalFlow()
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages.length])

  if (!request) return <ContractorRequestNotFound />
  if (completed && visitStatus !== 'COMPLETED') {
    return <Navigate to={`/contractor/requests/${request.requestId}/visit`} replace />
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title={request.customerName} back />
      <section className={`shrink-0 border-b px-4 py-2 text-[11px] font-semibold ${completed ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]' : 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'}`}>
        <p>{request.requestId}</p>
        <p>{completed ? '현장 확인 완료 · 견적 작성 가능' : '의뢰 승인 완료 · 실시간 채팅 중'}</p>
      </section>
      <div ref={messagesRef} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="mx-auto mb-4 max-w-[300px] rounded-lg bg-[#f1f5f9] px-3 py-2 text-center text-[10px] leading-4 text-[#64748b]">개인정보 보호를 위해 연락처와 외부 결제 요청에 주의해 주세요.</p>
        <p className="mb-3 text-center text-[10px] text-[#94a3b8]">2026년 7월 24일</p>
        <div className="space-y-3">
          {messages.map((message) => <ContractorChatBubble key={message.id} message={message} />)}
        </div>
        {completed ? (
          <div className="mt-4 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3 text-xs leading-5 text-[#047857]">
            <p className="font-bold">현장 방문 완료</p>
            <p>방문일 2026.07.24 · 이제 견적서를 작성할 수 있습니다.</p>
          </div>
        ) : null}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 bg-[#f8fafc] px-4 py-3">
        <Link to={`/contractor/requests/${request.requestId}/visit`} className="flex h-11 items-center justify-center rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb]">
          {completed ? '방문 일정 확인' : '현장 방문 일정 잡기'}
        </Link>
        {completed ? (
          <Link to={`/contractor/requests/${request.requestId}/estimate-ready`} className="flex h-11 items-center justify-center rounded-lg bg-[#2563eb] text-xs font-bold text-white">견적서 작성</Link>
        ) : (
          <button type="button" disabled aria-disabled="true" className="h-11 rounded-lg bg-[#cbd5e1] text-xs font-bold text-white disabled:cursor-not-allowed">견적서 작성</button>
        )}
      </div>
      <ContractorChatComposer onSend={addMessage} />
    </ContractorMobileShell>
  )
}
