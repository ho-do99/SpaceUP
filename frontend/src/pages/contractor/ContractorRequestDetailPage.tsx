import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'

export default function ContractorRequestDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const request = findContractorRequestDetail(requestId)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')

  if (!request) return <ContractorRequestNotFound />

  return (
    <>
      <ContractorRequestDetailLayout
        request={request}
        activeTab="summary"
        statusMessage={rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined}
        actions={<ContractorRequestActions disabled={Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={() => navigate(`/contractor/requests/${request.requestId}/approved`)} />}
      >
        <ContractorSectionCard title="공간 분석 요약">
          <p className="text-xs leading-5 text-[#64748b]">방 {request.analysis.rooms}개 · 욕실 {request.analysis.bathrooms}개 · 발코니 {request.analysis.hasBalcony ? '있음' : '없음'}</p>
          <p className="text-xs leading-5 text-[#64748b]">{request.analysis.kitchenType} · 층고 {request.analysis.ceilingHeight}</p>
        </ContractorSectionCard>

        <ContractorSectionCard title="SpaceUP 예상 견적">
          <p className="text-xl font-bold text-[#2563eb]">{request.estimatedCostLabel}</p>
          <p className="mt-2 text-[11px] leading-4 text-[#64748b]">AI 분석 기반 참고 범위이며 실제 견적과 다를 수 있습니다.</p>
        </ContractorSectionCard>

        <ContractorSectionCard title="주택 가치 상승 리포트 요약">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-[#f8fafc] px-1 py-2"><dt className="text-[10px] text-[#64748b]">현재 월세</dt><dd className="mt-1 text-xs font-bold">{request.valueIncrease.currentMonthlyRent}</dd></div>
            <div className="rounded-lg bg-[#eff6ff] px-1 py-2"><dt className="text-[10px] text-[#64748b]">예상 상승액</dt><dd className="mt-1 text-xs font-bold text-[#2563eb]">+{request.valueIncrease.expectedMonthlyIncrease}</dd></div>
            <div className="rounded-lg bg-[#f8fafc] px-1 py-2"><dt className="text-[10px] text-[#64748b]">예상 회수</dt><dd className="mt-1 text-xs font-bold">{request.valueIncrease.recoveryPeriod}</dd></div>
          </dl>
        </ContractorSectionCard>

        <Link to={`/contractor/requests/${request.requestId}/floor-plan`} className="flex h-11 items-center justify-center rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb]">평면도 · 집 사진 보기</Link>
      </ContractorRequestDetailLayout>
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { setRejectedReason(reason); setRejectOpen(false) }} />
    </>
  )
}
