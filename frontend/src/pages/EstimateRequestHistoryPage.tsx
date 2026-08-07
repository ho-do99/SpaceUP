import { useNavigate } from 'react-router-dom'
import EstimateRequestHistoryCard from '@/components/user/EstimateRequestHistoryCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { useEstimateRequestHistory } from '@/hooks/useEstimateRequests'

export default function EstimateRequestHistoryPage() {
  const navigate = useNavigate()
  const { requests, usingLiveData } = useEstimateRequestHistory()

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="내역" onBack={() => navigate('/mypage')} />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4">
        <h1 className="text-[18px] font-bold leading-[22px] text-[#15284c]">견적 요청 내역</h1>
        <p className="mt-[9px] text-[9px] text-[#647086]">총 {requests.length}건 · {usingLiveData ? '실시간 내역' : '예시 내역'}</p>

        <div className="mt-[18px] space-y-[13px]">
          {requests.map((request) => (
            <EstimateRequestHistoryCard key={request.id} request={request} />
          ))}
        </div>
      </main>
    </UserScreenShell>
  )
}
