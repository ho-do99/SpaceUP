import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'
import { approveRequest, rejectRequest } from '@/api/contractorApi'

const rejectReasonCodes: Record<string, string> = {
  '지역 미지원': 'REGION_NOT_SUPPORTED', '예산 범위 불일치': 'BUDGET_MISMATCH',
  '전문 분야 불일치': 'SPECIALTY_MISMATCH', '일정 조율 불가': 'SCHEDULE_CONFLICT', '기타': 'OTHER',
}

export default function ContractorRequestDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const fallbackRequest = findContractorRequestDetail(requestId)
  const live = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? live.request : fallbackRequest
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')
  const [actionError, setActionError] = useState('')

  if (live.loading && !request) return <ContractorRequestNotFound />
  if (!request) return <ContractorRequestNotFound />

  const approve = async () => {
    if (/^\d+$/.test(request.requestId)) {
      try { await approveRequest(Number(request.requestId)) } catch (error) {
        setActionError(error instanceof Error ? error.message : '의뢰 승인에 실패했습니다.'); return
      }
    }
    navigate(`/contractor/requests/${request.requestId}/approved`)
  }

  const reject = async (reason: string) => {
    if (/^\d+$/.test(request.requestId)) {
      const code = rejectReasonCodes[reason] ?? 'OTHER'
      try { await rejectRequest(Number(request.requestId), code, code === 'OTHER' ? reason : undefined) } catch (error) {
        setActionError(error instanceof Error ? error.message : '의뢰 거절에 실패했습니다.'); return
      }
    }
    setRejectedReason(reason)
    setRejectOpen(false)
  }

  return (
    <>
      <ContractorRequestDetailLayout
        request={request}
        activeTab="summary"
        statusMessage={actionError || (rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined)}
        actions={<ContractorRequestActions disabled={Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={approve} />}
      >
        <ContractorSectionCard title="공간 분석 요약">
          <p className="text-xs leading-5 text-[#64748b]">방 {request.analysis.rooms}개 · 욕실 {request.analysis.bathrooms}개 · 발코니 {request.analysis.hasBalcony ? '있음' : '없음'}</p>
          <p className="text-xs leading-5 text-[#64748b]">{request.analysis.kitchenType} · 층고 {request.analysis.ceilingHeight}</p>
        </ContractorSectionCard>

        <ContractorSectionCard title="SpaceUP 예상 견적">
          <p className="text-xl font-bold text-[#2563eb]">{request.estimatedCostLabel}</p>
          <p className="mt-2 text-[11px] leading-4 text-[#64748b]">AI 분석 기반 참고 범위이며 실제 견적과 다를 수 있습니다.</p>
        </ContractorSectionCard>

        <Link to={`/contractor/requests/${request.requestId}/floor-plan`} className="flex h-11 items-center justify-center rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb]">평면도 · 집 사진 보기</Link>
      </ContractorRequestDetailLayout>
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={reject} />
    </>
  )
}
