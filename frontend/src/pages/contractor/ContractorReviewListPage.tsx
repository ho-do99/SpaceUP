import { useEffect, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorReviewCard from '@/components/contractor/ContractorReviewCard'
import ContractorReviewStars from '@/components/contractor/ContractorReviewStars'
import type { ContractorReviewFilter } from '@/types/contractorPortal'
import type { ContractorReview, ContractorReviewSummary } from '@/types/contractorPortal'
import { getContractorReviews, getReviewSummary } from '@/api/reviewApi'
import { getMyContractorProfile } from '@/api/contractorApi'

const keywordLabels = { SCHEDULE_KEPT: '일정을 잘 지켰어요', CLEAN_FINISH: '마감이 깔끔해요', DETAILED_CONSULT: '상담이 자세해요', FAST_COMMUNICATION: '소통이 빨라요' } as const
const emptySummary: ContractorReviewSummary = { contractorName: '-', averageRating: 0, totalCount: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }

export default function ContractorReviewListPage() {
  const [filter, setFilter] = useState<ContractorReviewFilter>('all')
  const [reviews, setReviews] = useState<readonly ContractorReview[]>([])
  const [summary, setSummary] = useState<ContractorReviewSummary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const filters: readonly { id: ContractorReviewFilter; label: string }[] = [
    { id: 'all', label: `전체 ${summary.totalCount}` },
    { id: 'five', label: `5점 ${summary.ratingCounts[5]}` },
    { id: 'four', label: `4점 ${summary.ratingCounts[4]}` },
    { id: 'three_or_less', label: `3점 이하 ${summary.ratingCounts[3] + summary.ratingCounts[2] + summary.ratingCounts[1]}` },
  ]
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getMyContractorProfile().then(async (profile) => {
      const [page, value] = await Promise.all([getContractorReviews(profile.id, filter), getReviewSummary(profile.id)])
      if (!active) return
      setReviews(page.content.map((review) => ({
        reviewId: String(review.id), userName: review.reviewerName, rating: Math.min(5, Math.max(1, review.rating)) as 1 | 2 | 3 | 4 | 5,
        createdAt: review.createdAt?.slice(0, 10) || '-', projectName: `의뢰 #${review.requestId}`,
        projectStatusLabel: '시공 완료', constructionItem: '리모델링', completedAt: review.createdAt?.slice(0, 10) || '-',
        satisfactionLabel: `${review.rating}점`, content: review.content, excerpt: review.content,
        keywords: review.keywords.map((keyword) => keywordLabels[keyword as keyof typeof keywordLabels]).filter(Boolean) as ContractorReview['keywords'],
      })))
      setSummary({ contractorName: value.contractorName, averageRating: value.averageRating, totalCount: value.totalCount,
        ratingCounts: { 1: value.ratingCounts['1'] ?? 0, 2: value.ratingCounts['2'] ?? 0, 3: value.ratingCounts['3'] ?? 0, 4: value.ratingCounts['4'] ?? 0, 5: value.ratingCounts['5'] ?? 0 } })
    }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : '리뷰를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filter])
  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="받은 리뷰" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">고객이 남긴 별점과 시공 후기를 확인하세요.</p>
        <section className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm" aria-labelledby="review-summary-title">
          <h2 id="review-summary-title" className="text-sm font-bold text-[#0f172a]">{summary.contractorName}</h2>
          <div className="mt-3 flex items-center gap-4"><div><p className="text-3xl font-extrabold text-[#0f172a]">{summary.averageRating.toFixed(1)}</p><ContractorReviewStars rating={summary.averageRating} /></div><p className="text-xs text-[#64748b]">전체 리뷰<br /><strong className="text-sm text-[#334155]">{summary.totalCount}개</strong></p></div>
          <div className="mt-4 space-y-1.5" aria-label="별점별 리뷰 수">
            {[5, 4, 3, 2, 1].map((rating) => <div key={rating} className="grid grid-cols-[22px_1fr_22px] items-center gap-2 text-[10px] text-[#64748b]"><span>{rating}점</span><span className="h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]"><span className="block h-full rounded-full bg-[#f59e0b]" style={{ width: `${summary.totalCount ? (summary.ratingCounts[rating as 1 | 2 | 3 | 4 | 5] / summary.totalCount) * 100 : 0}%` }} /></span><span className="text-right">{summary.ratingCounts[rating as 1 | 2 | 3 | 4 | 5]}</span></div>)}
          </div>
        </section>
        <div className="mt-4 flex items-center justify-between gap-3"><div className="flex min-w-0 gap-2 overflow-x-auto pb-1" aria-label="리뷰 별점 필터">{filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-8 shrink-0 rounded-full px-3 text-[11px] font-bold ${filter === item.id ? 'bg-[#2563eb] text-white' : 'border border-[#cbd5e1] bg-white text-[#475569]'}`}>{item.label}</button>)}</div><span className="shrink-0 text-[11px] font-semibold text-[#64748b]">최신순</span></div>
        <div className="mt-3 space-y-3">{loading ? <p className="py-10 text-center text-xs text-[#64748b]">리뷰를 불러오는 중입니다.</p> : null}{error ? <p role="alert" className="py-10 text-center text-xs text-[#dc2626]">{error}</p> : null}{reviews.map((review) => <ContractorReviewCard key={review.reviewId} review={review} />)}{!loading && !error && reviews.length === 0 ? <ContractorEmptyState title="리뷰가 없습니다" description="선택한 조건의 리뷰가 없습니다." /> : null}</div>
      </main>
    </ContractorMobileShell>
  )
}
