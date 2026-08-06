import { useNavigate } from 'react-router-dom'
import EstimateRequestHistoryCard from '@/components/user/EstimateRequestHistoryCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { estimateRequests } from '@/mocks/estimateRequests'

export default function EstimateRequestHistoryPage() {
  const navigate = useNavigate()

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="내역" onBack={() => navigate('/mypage')} />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4">
        <h1 className="text-[18px] font-bold leading-[22px] text-[#15284c]">견적 요청 내역</h1>
        <p className="mt-[9px] text-[9px] text-[#647086]">총 {estimateRequests.length}건</p>

        <div className="mt-[18px] space-y-[13px]">
          {estimateRequests.map((request) => (
            <EstimateRequestHistoryCard key={request.id} request={request} />
          ))}
        </div>
      </main>
    </UserScreenShell>
  )
}
