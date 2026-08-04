import { Link } from 'react-router-dom'
import type { ContractorReview } from '@/types/contractorPortal'
import ContractorReviewStars from './ContractorReviewStars'

export default function ContractorReviewCard({ review }: { review: ContractorReview }) {
  return (
    <article className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#0f172a]">{review.userName}</h2>
          <ContractorReviewStars rating={review.rating} />
        </div>
        <time className="shrink-0 text-[11px] text-[#64748b]">{review.createdAt}</time>
      </div>
      <p className="mt-3 text-xs font-semibold text-[#334155]">{review.projectName} · {review.projectStatusLabel}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {review.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-bold text-[#2563eb]">{keyword}</span>)}
      </div>
      <p className="mt-3 break-words text-xs leading-5 text-[#475569]">{review.excerpt}</p>
      <Link to={`/contractor/reviews/${review.reviewId}`} aria-label={`${review.userName} 리뷰 상세 보기`} className="mt-3 flex h-10 w-full items-center justify-center rounded-lg border border-[#cbd5e1] text-xs font-bold text-[#334155] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">리뷰 상세 보기</Link>
    </article>
  )
}
