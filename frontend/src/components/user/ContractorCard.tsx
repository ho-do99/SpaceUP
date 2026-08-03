import { Link } from 'react-router-dom'
import type { ContractorSummary } from '@/mocks/contractors'

interface ContractorCardProps {
  contractor: ContractorSummary
}

export default function ContractorCard({ contractor }: ContractorCardProps) {
  return (
    <article className="rounded-[7px] border border-[#d5dfed] bg-white p-[11px]">
      <div className="flex items-start gap-3">
        <img src={contractor.iconSrc} alt="" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-bold leading-5 text-[#0f172a]">
                {contractor.companyName}
              </h2>
              <p className="mt-1 truncate text-[10px] leading-4 text-[#64748b]">
                {contractor.region} · {contractor.experienceLabel}
              </p>
              <p className="mt-0.5 text-[10px] font-medium leading-4 text-[#f59e0b]">
                ★ {contractor.rating.toFixed(1)} ({contractor.reviewCount})
              </p>
            </div>
            <strong className="shrink-0 text-[20px] leading-6 text-[#2563eb]">
              {contractor.matchingScore}점
            </strong>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#eff6ff] px-[9px] py-1 text-[11px] font-medium text-[#2563eb]">
          {contractor.experienceLabel}
        </span>
        <span className="text-[11px] font-medium text-[#475569]">
          유사 스타일 {contractor.similarProjectCount}건
        </span>
      </div>

      <p className="mt-2 text-[11px] font-medium leading-5 text-[#0f172a]">
        전문 · {contractor.specialties.join(' · ')}
      </p>

      <div className="mt-2 flex items-end gap-3">
        <img
          src={contractor.portfolioSrc}
          alt={contractor.portfolioAlt}
          className="h-14 w-[76px] shrink-0 rounded-[7px] object-cover"
        />
        <p className="min-w-0 flex-1 break-keep self-start text-[11px] leading-[15px] text-[#475569]">
          {contractor.recommendation}
        </p>
        <Link
          to={`/contractors/${contractor.id}`}
          aria-label={`${contractor.companyName} 상세 보기`}
          className="flex h-[34px] w-[100px] shrink-0 items-center justify-center rounded-[7px] bg-[#2563eb] text-[12px] font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        >
          견적 요청
        </Link>
      </div>
    </article>
  )
}
