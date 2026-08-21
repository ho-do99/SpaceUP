import { useNavigate } from 'react-router-dom'

import EstimateRequestHistoryCard from '@/components/user/EstimateRequestHistoryCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { useEstimateRequestHistory } from '@/hooks/useEstimateRequests'

export default function EstimateRequestHistoryPage() {
  const navigate = useNavigate()

  const { requests, loading, error, retry } = useEstimateRequestHistory()

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
            />
          ))}
          {!loading && !error && requests.length === 0 ? <p className="py-10 text-center text-[12px] text-[#64748b]">견적 요청 내역이 없습니다.</p> : null}
        </div>
      </main>

    </UserScreenShell>
  )
}
