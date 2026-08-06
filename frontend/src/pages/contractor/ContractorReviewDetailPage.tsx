import { useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorReviewStars from '@/components/contractor/ContractorReviewStars'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import { findContractorReview } from '@/mocks/contractorPortalMockData'
import ContractorReviewNotFound from './ContractorReviewNotFound'

export default function ContractorReviewDetailPage() {
  const { reviewId } = useParams()
  const review = findContractorReview(reviewId)
  if (!review) return <ContractorReviewNotFound />
  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="리뷰 상세" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-7 pt-4">
        <ContractorSectionCard>
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-[#0f172a]">{review.userName}</h2><p className="mt-1 text-xs text-[#64748b]">{review.projectName} · {review.projectStatusLabel}</p></div><time className="shrink-0 text-[11px] text-[#64748b]">{review.createdAt}</time></div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-[#fffbeb] px-3 py-3"><ContractorReviewStars rating={review.rating} size="md" /><strong className="text-xs text-[#92400e]">{review.satisfactionLabel}</strong></div>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="시공 정보">
          <dl className="space-y-2 text-xs"><div className="flex justify-between gap-4"><dt className="text-[#64748b]">시공 항목</dt><dd className="text-right font-semibold text-[#334155]">{review.constructionItem}</dd></div>{review.region ? <div className="flex justify-between gap-4"><dt className="text-[#64748b]">지역</dt><dd className="font-semibold text-[#334155]">{review.region}</dd></div> : null}{review.constructionPeriod ? <div className="flex justify-between gap-4"><dt className="text-[#64748b]">시공 기간</dt><dd className="text-right font-semibold text-[#334155]">{review.constructionPeriod}</dd></div> : null}<div className="flex justify-between gap-4"><dt className="text-[#64748b]">완료일</dt><dd className="font-semibold text-[#334155]">{review.completedAt}</dd></div></dl>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="고객 리뷰"><div className="flex flex-wrap gap-1.5">{review.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-bold text-[#2563eb]">{keyword}</span>)}</div><p className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-[#334155]">{review.content}</p></ContractorSectionCard>
        <section className="mt-3 rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-4" aria-labelledby="review-guide-title"><h2 id="review-guide-title" className="text-xs font-bold text-[#1d4ed8]">리뷰 이용 안내</h2><p className="mt-1 text-xs leading-5 text-[#475569]">고객이 작성한 리뷰는 시공사에서 수정하거나 삭제할 수 없습니다.</p></section>
      </main>
    </ContractorMobileShell>
  )
}
