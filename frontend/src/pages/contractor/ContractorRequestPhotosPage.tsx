import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
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
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null)
  const [rejectedReason, setRejectedReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!request) return <ContractorRequestNotFound />
  const isLiveRequest = /^\d+$/.test(request.requestId)
  const canDecide = request.participationStatus === 'INVITED' || !isLiveRequest
  const canContinueChat = request.participationStatus === 'APPROVED' || request.participationStatus === 'SELECTED'

  const approve = async () => {
    if (isSubmitting) return
    setActionError('')
    setIsSubmitting(true)
    try {
      await approveContractorRequest(request.requestId)
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
      await rejectContractorRequest(request.requestId, reason)
      setRejectedReason(reason)
      setRejectOpen(false)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '의뢰 거절에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const beforeSrc = request.beforeImage
  const afterSrc = request.afterImage

  return (
    <>
      <ContractorRequestDetailLayout request={request} activeTab="photos" statusMessage={actionError || (rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined)} actions={canContinueChat
        ? <ContractorRequestActions chatHref={`/contractor/requests/${request.requestId}/chat`} />
        : canDecide
          ? <ContractorRequestActions disabled={isSubmitting || Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={approve} />
          : null}>
        <section>
          <h2 className="text-[15px] font-bold leading-normal text-[#1e293b]">사용자 공간 사진</h2>
          <p className="mt-2 text-[11px] leading-[17px] text-[#64748b]">사용자가 의뢰에 직접 등록한 현장 사진입니다.</p>
          {request.photos.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {request.photos.map((photo) => (
                <button key={photo.id} type="button" onClick={() => setPreview({ src: photo.image, label: photo.label })} className="rounded-[10px] border border-[#d9e3f0] bg-white p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
                  <img src={photo.image} alt={photo.label} className="h-[150px] w-full rounded-[8px] object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#cbd5e1] bg-white px-4 py-8 text-center">
              <p className="text-[12px] font-bold text-[#475569]">사용자가 등록한 공간 사진이 없습니다.</p>
            </div>
          )}
        </section>
        {beforeSrc && afterSrc ? (
          <section>
            <h2 className="text-[15px] font-bold leading-normal text-[#1e293b]">AI 인테리어 시뮬레이션 결과</h2>
            <p className="mt-2 text-[11px] leading-[17px] text-[#64748b]">사용자 원본 사진과 실제 생성 결과입니다.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-[#d9e3f0] bg-white p-3">
              <figure><figcaption className="mb-2 text-xs font-bold text-[#64748b]">Before</figcaption><button type="button" onClick={() => setPreview({ src: beforeSrc, label: '시뮬레이션 전 원본 사진' })}><img src={beforeSrc} alt="AI 인테리어 시뮬레이션 전" className="h-[168px] w-full rounded-[10px] object-cover" /></button></figure>
              <figure><figcaption className="mb-2 text-xs font-bold text-[#2563eb]">After</figcaption><button type="button" onClick={() => setPreview({ src: afterSrc, label: 'AI 인테리어 시뮬레이션 결과 사진' })}><img src={afterSrc} alt="AI 인테리어 시뮬레이션 후" className="h-[168px] w-full rounded-[10px] object-cover" /></button></figure>
            </div>
          </section>
        ) : null}      </ContractorRequestDetailLayout>
      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && setPreview(null)}>
          <section role="dialog" aria-modal="true" aria-label={preview.label} className="w-full max-w-[720px] rounded-xl bg-white p-4">
            <div className="flex justify-end"><button type="button" aria-label="사진 닫기" onClick={() => setPreview(null)} className="rounded-md px-2 py-1 text-xl text-[#64748b]">×</button></div>
            <img src={preview.src} alt={preview.label} className="max-h-[76dvh] w-full object-contain" />
          </section>
        </div>
      ) : null}
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={reject} />
    </>
  )
}
