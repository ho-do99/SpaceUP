import { useMemo, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorReviewCard from '@/components/contractor/ContractorReviewCard'
import ContractorReviewStars from '@/components/contractor/ContractorReviewStars'
import { contractorReviewMocks, contractorReviewSummary } from '@/mocks/contractorPortalMockData'
import type { ContractorReviewFilter } from '@/types/contractorPortal'

const filters: readonly { id: ContractorReviewFilter; label: string }[] = [
  { id: 'all', label: '전체 24' }, { id: 'five', label: '5점 20' }, { id: 'four', label: '4점 3' }, { id: 'three_or_less', label: '3점 이하 1' },
]

export default function ContractorReviewListPage() {
  const [filter, setFilter] = useState<ContractorReviewFilter>('all')
  const reviews = useMemo(() => contractorReviewMocks.filter((review) => filter === 'all' || (filter === 'five' && review.rating === 5) || (filter === 'four' && review.rating === 4) || (filter === 'three_or_less' && review.rating <= 3)), [filter])
  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="받은 리뷰" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">고객이 남긴 별점과 시공 후기를 확인하세요.</p>
        <section className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm" aria-labelledby="review-summary-title">
          <h2 id="review-summary-title" className="text-sm font-bold text-[#0f172a]">{contractorReviewSummary.contractorName}</h2>
          <div className="mt-3 flex items-center gap-4"><div><p className="text-3xl font-extrabold text-[#0f172a]">{contractorReviewSummary.averageRating.toFixed(1)}</p><ContractorReviewStars rating={contractorReviewSummary.averageRating} /></div><p className="text-xs text-[#64748b]">전체 리뷰<br /><strong className="text-sm text-[#334155]">{contractorReviewSummary.totalCount}개</strong></p></div>
          <div className="mt-4 space-y-1.5" aria-label="별점별 리뷰 수">
            {[5, 4, 3, 2, 1].map((rating) => <div key={rating} className="grid grid-cols-[22px_1fr_22px] items-center gap-2 text-[10px] text-[#64748b]"><span>{rating}점</span><span className="h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]"><span className="block h-full rounded-full bg-[#f59e0b]" style={{ width: `${contractorReviewSummary.totalCount ? (contractorReviewSummary.ratingCounts[rating as 1 | 2 | 3 | 4 | 5] / contractorReviewSummary.totalCount) * 100 : 0}%` }} /></span><span className="text-right">{contractorReviewSummary.ratingCounts[rating as 1 | 2 | 3 | 4 | 5]}</span></div>)}
          </div>
        </section>
        <div className="mt-4 flex items-center justify-between gap-3"><div className="flex min-w-0 gap-2 overflow-x-auto pb-1" aria-label="리뷰 별점 필터">{filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-8 shrink-0 rounded-full px-3 text-[11px] font-bold ${filter === item.id ? 'bg-[#2563eb] text-white' : 'border border-[#cbd5e1] bg-white text-[#475569]'}`}>{item.label}</button>)}</div><span className="shrink-0 text-[11px] font-semibold text-[#64748b]">최신순</span></div>
        <div className="mt-3 space-y-3">{reviews.map((review) => <ContractorReviewCard key={review.reviewId} review={review} />)}{reviews.length === 0 ? <ContractorEmptyState title="리뷰가 없습니다" description="선택한 조건의 리뷰가 없습니다." /> : null}</div>
      </main>
    </ContractorMobileShell>
  )
}
