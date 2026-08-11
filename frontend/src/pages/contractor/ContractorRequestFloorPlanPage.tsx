import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'
import { approveContractorRequest, rejectContractorRequest } from '@/utils/contractorRequestDecision'

export default function ContractorRequestFloorPlanPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')
  const [actionError, setActionError] = useState('')

  if (!request) return <ContractorRequestNotFound />

  return (
    <>
      <ContractorRequestDetailLayout request={request} activeTab="floor-plan" statusMessage={actionError || (rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined)} actions={<ContractorRequestActions disabled={Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={() => { void approveContractorRequest(request.requestId).then(() => navigate(`/contractor/requests/${request.requestId}/approved`)).catch((error) => setActionError(error instanceof Error ? error.message : '의뢰 승인에 실패했습니다.')) }} />}>
        <button type="button" aria-label="평면도 크게 보기" onClick={() => setPreviewOpen(true)} className="flex h-[190px] w-full flex-col items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
          <span aria-hidden="true" className="text-[38px] font-bold leading-[44px] text-[#2563eb]">⌗</span>
          <span className="mt-2 text-[13px] font-bold leading-[19px] text-[#1e293b]">아파트 {request.property.areaLabel} 평면도</span>
        </button>
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-[13px]">
          <h2 className="text-[13px] font-bold leading-[19px] text-[#1e293b]">구조 요약</h2>
          <p className="mt-1.5 text-[11px] leading-[17px] text-[#64748b]">방 {request.analysis.rooms} · {request.analysis.kitchenType} · 욕실 {request.analysis.bathrooms} · 발코니 {request.analysis.hasBalcony ? '1' : '0'}</p>
          <p className="mt-1 text-[11px] leading-[17px] text-[#64748b]">전용면적 {request.property.areaLabel} · 층고 {request.analysis.ceilingHeight}</p>
        </section>
        <button type="button" onClick={() => setPreviewOpen(true)} className="h-12 w-full rounded-lg border border-[#2563eb] bg-white text-[13px] font-bold text-[#2563eb]">평면도 크게 보기</button>
      </ContractorRequestDetailLayout>
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && setPreviewOpen(false)}>
          <section role="dialog" aria-modal="true" aria-label="평면도 확대 보기" className="w-full max-w-[393px] rounded-xl bg-white p-4">
            <div className="flex justify-end"><button type="button" aria-label="평면도 닫기" onClick={() => setPreviewOpen(false)} className="rounded-md px-2 py-1 text-xl text-[#64748b]">×</button></div>
            <img src={request.floorPlanImage} alt={`${request.property.areaLabel} 아파트 평면도 확대`} className="max-h-[70dvh] w-full object-contain" />
          </section>
        </div>
      ) : null}
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { void rejectContractorRequest(request.requestId, reason).then(() => { setRejectedReason(reason); setRejectOpen(false) }).catch((error) => setActionError(error instanceof Error ? error.message : '의뢰 거절에 실패했습니다.')) }} />
    </>
  )
}
