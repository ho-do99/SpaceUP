import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import EstimateRequestDeleteDialog from '@/components/user/EstimateRequestDeleteDialog'
import EstimateRequestHistoryCard from '@/components/user/EstimateRequestHistoryCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { useEstimateRequestHistory } from '@/hooks/useEstimateRequests'
import type { EstimateRequestSummary } from '@/mocks/estimateRequests'

export default function EstimateRequestHistoryPage() {
  const navigate = useNavigate()

  const { requests, loading, error, retry, removeRequest } = useEstimateRequestHistory()
  const [deleteTarget, setDeleteTarget] = useState<EstimateRequestSummary>()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const openDeleteDialog = (request: EstimateRequestSummary) => {
    setDeleteTarget(request)
    setDeleteError('')
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteTarget(undefined)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await removeRequest(deleteTarget.id)
      setDeleteTarget(undefined)
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : '견적 요청 삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <UserScreenShell>
      <UserHeader
        variant="detail"
        title="견적 요청 내역"
        onBack={() => navigate('/mypage')}
      />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[26px] pt-4">
        <h1 className="text-[18px] font-bold leading-[24px] text-[#15284c]">
          견적 요청 내역
        </h1>

        <p className="mt-[9px] text-[9px] leading-[14px] text-[#647086]">
          총 {requests.length}건
        </p>

        <div className="mt-[18px] space-y-[13px]">
          {loading ? <p className="py-10 text-center text-[12px] text-[#64748b]">요청 내역을 불러오는 중입니다.</p> : null}
          {error ? <div className="py-8 text-center"><p role="alert" className="text-[12px] text-[#dc2626]">{error}</p><button type="button" onClick={retry} className="mt-3 rounded-lg border border-[#2563eb] px-3 py-2 text-[11px] font-bold text-[#2563eb]">다시 시도</button></div> : null}
          {requests.map((request) => (
            <EstimateRequestHistoryCard
              key={request.id}
              request={request}
              deleting={deleting && deleteTarget?.id === request.id}
              onDelete={openDeleteDialog}
            />
          ))}
          {!loading && !error && requests.length === 0 ? <p className="py-10 text-center text-[12px] text-[#64748b]">견적 요청 내역이 없습니다.</p> : null}
        </div>
      </main>

      <EstimateRequestDeleteDialog
        request={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={closeDeleteDialog}
        onConfirm={() => { void confirmDelete() }}
      />
    </UserScreenShell>
  )
}
