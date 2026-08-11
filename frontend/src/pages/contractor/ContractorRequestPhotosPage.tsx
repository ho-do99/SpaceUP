import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import beforeImage from '@/assets/contractor/request-detail/ai-before.svg'
import afterImage from '@/assets/contractor/request-detail/ai-after.svg'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'
import { approveContractorRequest, rejectContractorRequest } from '@/utils/contractorRequestDecision'

export default function ContractorRequestPhotosPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')
  const [actionError, setActionError] = useState('')

  if (!request) return <ContractorRequestNotFound />

  return (
    <>
      <ContractorRequestDetailLayout request={request} activeTab="photos" statusMessage={actionError || (rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined)} actions={<ContractorRequestActions disabled={Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={() => { void approveContractorRequest(request.requestId).then(() => navigate(`/contractor/requests/${request.requestId}/approved`)).catch((error) => setActionError(error instanceof Error ? error.message : '의뢰 승인에 실패했습니다.')) }} />}>
        <section>
          <h2 className="text-[15px] font-bold leading-normal text-[#1e293b]">AI 인테리어 시뮬레이션 결과</h2>
          <p className="mt-2 text-[11px] leading-[17px] text-[#64748b]">사용자가 선택한 스타일로 생성한 Before / After 이미지입니다.</p>
          <div className="mt-7 rounded-xl border border-[#d9e3f0] bg-white p-[11px] pb-3">
            <div className="relative grid grid-cols-[164px_164px] justify-center gap-[9px]">
              <span aria-hidden="true" className="absolute left-1/2 top-[41px] h-[168px] w-px -translate-x-1/2 bg-[#d9e3f0]" />
              <figure>
                <figcaption className="mb-3 px-1.5 text-xs font-bold text-[#64748b]">Before</figcaption>
                <img src={beforeImage} alt="AI 인테리어 시뮬레이션 전" className="h-[168px] w-[164px] rounded-[10px]" />
              </figure>
              <figure>
                <figcaption className="mb-3 px-1.5 text-xs font-bold text-[#2563eb]">After</figcaption>
                <img src={afterImage} alt="모던 스타일 AI 인테리어 시뮬레이션 후" className="h-[168px] w-[164px] rounded-[10px]" />
              </figure>
            </div>
            <div className="mt-2.5 flex items-start justify-between gap-2">
              <span className="flex h-7 shrink-0 items-center rounded-[14px] bg-[#eff6ff] px-3 text-[11px] font-bold text-[#2563eb]">선택 스타일 · 모던</span>
              <p className="max-w-[199px] text-right text-[9px] leading-[15px] text-[#64748b]">※ AI 생성 이미지로 실제 시공 결과와 차이가 있을 수 있습니다.</p>
            </div>
          </div>
        </section>
      </ContractorRequestDetailLayout>
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { void rejectContractorRequest(request.requestId, reason).then(() => { setRejectedReason(reason); setRejectOpen(false) }).catch((error) => setActionError(error instanceof Error ? error.message : '의뢰 거절에 실패했습니다.')) }} />
    </>
  )
}
