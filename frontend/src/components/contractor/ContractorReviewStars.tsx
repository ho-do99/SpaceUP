interface Props {
  rating: number
  size?: 'sm' | 'md'
}

export default function ContractorReviewStars({ rating, size = 'sm' }: Props) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="inline-flex items-center gap-1" aria-label={`별점 5점 만점에 ${rating}점`}>
      <span aria-hidden="true" className={`tracking-[1px] text-[#f59e0b] ${size === 'md' ? 'text-lg' : 'text-sm'}`}>
        {'★'.repeat(roundedRating)}<span className="text-[#dbe1ea]">{'★'.repeat(5 - roundedRating)}</span>
      </span>
      <span className="text-xs font-bold text-[#334155]">{rating.toFixed(1)}</span>
    </span>
  )
}
