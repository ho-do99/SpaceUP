import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorRequest, findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'
import { approveRequest, rejectRequest } from '@/api/contractorApi'
import type { ContractorRequest, ContractorRequestDetail } from '@/types/contractorPortal'

const rejectReasonCodes: Record<string, string> = {
  '지역 미지원': 'REGION_NOT_SUPPORTED', '예산 범위 불일치': 'BUDGET_MISMATCH',
  '전문 분야 불일치': 'SPECIALTY_MISMATCH', '일정 조율 불가': 'SCHEDULE_CONFLICT', '기타': 'OTHER',
}

function isRequestDetail(request: ContractorRequest): request is ContractorRequestDetail {
  return 'selectedItems' in request && 'analysis' in request
}

export default function ContractorRequestDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const fallbackRequest = findContractorRequestDetail(requestId)
  const fallbackSummary = fallbackRequest ?? findContractorRequest(requestId)
  const live = useContractorRequest(requestId)
  const resolvedRequest = /^\d+$/.test(requestId ?? '') ? live.request : fallbackSummary
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (live.loading && !resolvedRequest) return <ContractorRequestNotFound />
  if (!resolvedRequest) return <ContractorRequestNotFound />

  if (resolvedRequest.status === 'auto_canceled') {
    return (
      <ContractorMobileShell innerClassName="h-dvh min-h-0">
        <ContractorAppBar title="의뢰 자동 취소" back />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <p className="text-xs leading-[17px] text-[#64748b]">168시간 동안 유효 활동이 없어 의뢰가 자동 취소되었습니다.</p>
          <section className="mt-3 rounded-xl bg-[#fdf0f1] p-[14px]">
            <span aria-hidden="true" className="text-[30px] font-bold leading-[34px] text-[#ef4444]">!</span>
            <h2 className="mt-2 text-[17px] font-bold text-[#ef4444]">의뢰가 자동으로 취소되었습니다.</h2>
          </section>
          <ContractorSectionCard className="mt-3 p-[14px] shadow-none" title="자동 취소 정보">
            <p className="text-[11px] leading-[17px] text-[#64748b]">의뢰번호 {resolvedRequest.requestId}</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">자동 취소 2026.07.15 09:30</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">마지막 활동 2026.07.08 09:30</p>
          </ContractorSectionCard>
          <ContractorSectionCard className="mt-3 p-[14px] shadow-none" title="자동 취소 사유">
            <p className="text-[11px] leading-[17px] text-[#64748b]">lastActivityAt 이후 168시간 동안 유효 활동이 없었습니다.</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">144시간 시점에 D-1 알림이 발송되었습니다.</p>
          </ContractorSectionCard>
          <ContractorSectionCard className="mt-3 p-[14px] shadow-none" title="유효 활동 8개">
            <p className="text-[11px] leading-[17px] text-[#64748b]">채팅 전송 · 일정 등록 · 일정 변경 · 일정 수락</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">일정 확인 · 현장 방문 완료 · 견적 임시 저장 · 견적 전송</p>
          </ContractorSectionCard>
          <Link to="/contractor/requests" className="mt-3 flex h-12 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white">다른 의뢰 보기</Link>
        </main>
      </ContractorMobileShell>
    )
  }

  if (!isRequestDetail(resolvedRequest)) return <ContractorRequestNotFound />
  const request = resolvedRequest
  const isLiveRequest = /^\d+$/.test(request.requestId)
  const canDecide = request.participationStatus === 'INVITED' || !isLiveRequest
  const canContinueChat = request.participationStatus === 'APPROVED' || request.participationStatus === 'SELECTED'

  if (rejectedReason) {
    return (
      <ContractorMobileShell innerClassName="h-dvh min-h-0">
        <ContractorAppBar title="의뢰 거절 완료" back />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <p className="text-xs leading-[17px] text-[#64748b]">거절한 의뢰는 미성사 거래에서 확인할 수 있습니다.</p>
          <section className="mt-3 rounded-xl bg-[#fdf0f1] p-[14px]">
            <span aria-hidden="true" className="text-[30px] font-bold leading-[34px] text-[#ef4444]">!</span>
            <h2 className="mt-2 text-[17px] font-bold leading-6 text-[#ef4444]">의뢰 상태가 시공사 거절로 변경되었습니다.</h2>
          </section>
          <ContractorSectionCard className="mt-3 p-[14px] shadow-none">
            <p className="text-sm font-bold leading-5 text-[#ef4444]">{request.requestId}</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">{request.property.region} · {request.property.propertyType} {request.property.areaLabel}</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">상태: 시공사 거절</p>
          </ContractorSectionCard>
          <ContractorSectionCard className="mt-3 p-[14px] shadow-none" title="거절 사유">
            <p className="text-[11px] leading-[17px] text-[#64748b]">{rejectedReason}</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">확정 2026.07.15 16:20</p>
          </ContractorSectionCard>
          <ContractorSectionCard className="mt-3 p-[14px] shadow-none" title="이용 제한">
            <p className="text-[11px] leading-[17px] text-[#64748b]">이 의뢰는 다시 승인할 수 없습니다.</p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">채팅 및 견적서 작성 기능을 사용할 수 없습니다.</p>
          </ContractorSectionCard>
          <Link to="/contractor/requests" state={{ filter: 'unmatched' }} className="mt-3 flex h-12 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-sm font-bold text-[#0b2b59]">미성사 의뢰 보기</Link>
        </main>
      </ContractorMobileShell>
    )
  }

  const approve = async () => {
    if (isSubmitting) return
    setActionError('')
    setIsSubmitting(true)
    try {
      if (isLiveRequest) await approveRequest(Number(request.requestId))
      navigate(`/contractor/requests/${request.requestId}/approved`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '의뢰 승인에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reject = async (reason: string) => {
    if (isSubmitting) return
    setActionError('')
    setIsSubmitting(true)
    try {
      if (isLiveRequest) {
        const code = rejectReasonCodes[reason] ?? 'OTHER'
        await rejectRequest(Number(request.requestId), code, code === 'OTHER' ? reason : undefined)
      }
      setRejectedReason(reason)
      setRejectOpen(false)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '의뢰 거절에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <ContractorRequestDetailLayout
        request={request}
        activeTab="summary"
        statusMessage={actionError || (rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined)}
        actions={canContinueChat
          ? <ContractorRequestActions chatHref={`/contractor/requests/${request.requestId}/chat`} />
          : canDecide
            ? <ContractorRequestActions disabled={isSubmitting || Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={approve} />
            : null}
      >
        <ContractorSectionCard className="p-[14px] shadow-none">
          <h2 className="mb-[7px] text-sm font-bold leading-5 text-[#1e293b]">공간 분석 요약</h2>
          <p className="text-xs leading-[17px] text-[#64748b]">방 {request.analysis.rooms}개 · 욕실 {request.analysis.bathrooms}개 · 발코니 {request.analysis.hasBalcony ? '있음' : '없음'}</p>
          <p className="text-xs leading-[17px] text-[#64748b]">{request.analysis.kitchenType} · 층고 {request.analysis.ceilingHeight}</p>
        </ContractorSectionCard>

        <ContractorSectionCard className="p-[14px] shadow-none">
          <h2 className="mb-[7px] text-sm font-bold leading-5 text-[#2563eb]">SpaceUP 예상 견적</h2>
          <p className="text-xs leading-[17px] text-[#64748b]">{request.estimatedCostLabel}</p>
          <p className="text-xs leading-[17px] text-[#64748b]">AI 분석 기반 참고 범위이며 실제 견적과 다를 수 있습니다.</p>
        </ContractorSectionCard>

        <Link to={`/contractor/requests/${request.requestId}/floor-plan`} className="flex h-12 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-sm font-bold text-[#0b2b59]">평면도 · 집 사진 보기</Link>
      </ContractorRequestDetailLayout>
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={reject} />
    </>
  )
}
