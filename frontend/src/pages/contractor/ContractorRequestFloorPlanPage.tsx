import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContractorConfirmDialog from '@/components/contractor/ContractorConfirmDialog'
import ContractorRequestActions from '@/components/contractor/ContractorRequestActions'
import ContractorRequestDetailLayout from '@/components/contractor/ContractorRequestDetailLayout'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'

export default function ContractorRequestFloorPlanPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')

  if (!request) return <ContractorRequestNotFound />

  return (
    <>
      <ContractorRequestDetailLayout request={request} activeTab="floor-plan" statusMessage={rejectedReason ? `거절 상태로 표시했습니다: ${rejectedReason}` : undefined} actions={<ContractorRequestActions disabled={Boolean(rejectedReason)} onReject={() => setRejectOpen(true)} onApprove={() => navigate(`/contractor/requests/${request.requestId}/approved`)} />}>
        <ContractorSectionCard title="아파트 84㎡ 평면도">
          <button type="button" aria-label="평면도 크게 보기" onClick={() => setPreviewOpen(true)} className="block w-full overflow-hidden rounded-lg bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
            <img src={request.floorPlanImage} alt={`${request.property.areaLabel} 아파트 평면도`} className="aspect-[16/10] w-full object-contain p-4" />
          </button>
          <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              ['방', `${request.analysis.rooms}`],
              ['주방', '분리형'],
              ['욕실', `${request.analysis.bathrooms}`],
              ['발코니', request.analysis.hasBalcony ? '1' : '0'],
            ].map(([label, value]) => <div key={label} className="rounded-lg bg-[#f8fafc] px-1 py-2"><dt className="text-[10px] text-[#64748b]">{label}</dt><dd className="mt-1 text-sm font-bold">{value}</dd></div>)}
          </dl>
          <p className="mt-3 text-xs text-[#64748b]">전용면적 {request.property.areaLabel} · 층고 {request.analysis.ceilingHeight}</p>
          <button type="button" onClick={() => setPreviewOpen(true)} className="mt-3 h-10 w-full rounded-lg border border-[#2563eb] text-xs font-bold text-[#2563eb]">평면도 크게 보기</button>
        </ContractorSectionCard>
      </ContractorRequestDetailLayout>
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && setPreviewOpen(false)}>
          <section role="dialog" aria-modal="true" aria-label="평면도 확대 보기" className="w-full max-w-[393px] rounded-xl bg-white p-4">
            <div className="flex justify-end"><button type="button" aria-label="평면도 닫기" onClick={() => setPreviewOpen(false)} className="rounded-md px-2 py-1 text-xl text-[#64748b]">×</button></div>
            <img src={request.floorPlanImage} alt={`${request.property.areaLabel} 아파트 평면도 확대`} className="max-h-[70dvh] w-full object-contain" />
          </section>
        </div>
      ) : null}
      <ContractorConfirmDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => { setRejectedReason(reason); setRejectOpen(false) }} />
    </>
  )
}
