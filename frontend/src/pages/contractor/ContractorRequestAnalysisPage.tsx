import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'

export default function ContractorRequestAnalysisPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')

  if (!request) return <ContractorRequestNotFound />

  return (
    <>
      <ContractorRequestDetailLayout request={request} activeTab="analysis" statusMessage={rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined} actions={<ContractorRequestActions disabled={Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={() => navigate(`/contractor/requests/${request.requestId}/approved`)} />}>
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
          <h2 className="mb-1.5 text-xs font-bold leading-[18px] text-[#1e293b]">사용자 선택 항목</h2>
          <p className="text-[11px] leading-[17px] text-[#64748b]">{request.selectedItems.join(' · ')}</p>
        </section>
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
          <h2 className="mb-1.5 text-xs font-bold leading-[18px] text-[#1e293b]">SpaceUP 예상 견적 · 조명은 현장 실측 후 별도 협의</h2>
          <p className="text-[11px] leading-[17px] text-[#64748b]">{request.estimatedCostLabel} · 조명 금액 미포함</p>
        </section>
      </ContractorRequestDetailLayout>
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { setRejectedReason(reason); setRejectOpen(false) }} />
    </>
  )
}
