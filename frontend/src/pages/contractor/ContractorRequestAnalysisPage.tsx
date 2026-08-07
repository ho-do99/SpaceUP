import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
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
        <ContractorSectionCard title="AI 공간 분석">
          <p className="text-xs leading-5 text-[#64748b]">방 {request.analysis.rooms}개 · 욕실 {request.analysis.bathrooms}개 · 발코니 {request.analysis.hasBalcony ? '있음' : '없음'}</p>
          <p className="text-xs leading-5 text-[#64748b]">{request.analysis.kitchenType} · 층고 {request.analysis.ceilingHeight}</p>
        </ContractorSectionCard>
        <ContractorSectionCard title="사용자 선택 항목">
          <p className="text-sm font-bold text-[#1e293b]">{request.selectedItems.join(' · ')}</p>
        </ContractorSectionCard>
        <ContractorSectionCard title="SpaceUP 예상 견적">
          <p className="text-xl font-bold text-[#2563eb]">{request.estimatedCostLabel}</p>
          <p className="mt-2 rounded-lg bg-[#eff6ff] px-3 py-2 text-[11px] font-semibold leading-4 text-[#2563eb]">{request.lightingNotice}</p>
        </ContractorSectionCard>
        <ContractorSectionCard title="주택 가치 상승 리포트">
          <p className="text-xs text-[#64748b]">예상 회수 기간</p>
          <p className="mt-1 text-lg font-bold text-[#1e293b]">{request.valueIncrease.recoveryPeriod}</p>
        </ContractorSectionCard>
      </ContractorRequestDetailLayout>
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { setRejectedReason(reason); setRejectOpen(false) }} />
    </>
  )
}
