import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'

export default function ContractorRequestPhotosPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const request = findContractorRequestDetail(requestId)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')

  if (!request) return <ContractorRequestNotFound />

  return (
    <>
      <ContractorRequestDetailLayout request={request} activeTab="photos" statusMessage={rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined} actions={<ContractorRequestActions disabled={Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={() => navigate(`/contractor/requests/${request.requestId}/approved`)} />}>
        <ContractorSectionCard title="집 사진">
          <div className="grid grid-cols-2 gap-2">
            {request.photos.map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                <img src={photo.image} alt={`${photo.label} 사진`} className={`w-full object-cover ${expanded ? 'aspect-[4/3]' : 'aspect-square'}`} />
                <figcaption className="px-2 py-2 text-xs font-bold">{photo.label}</figcaption>
              </figure>
            ))}
          </div>
          <button type="button" aria-pressed={expanded} onClick={() => setExpanded((value) => !value)} className="mt-3 h-10 w-full rounded-lg border border-[#2563eb] text-xs font-bold text-[#2563eb]">{expanded ? '기본 보기' : '사진 더 보기'}</button>
        </ContractorSectionCard>
      </ContractorRequestDetailLayout>
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { setRejectedReason(reason); setRejectOpen(false) }} />
    </>
  )
}
