import { Link } from 'react-router-dom'
import type { EstimateRequestSummary } from '@/mocks/estimateRequests'

interface EstimateRequestHistoryCardProps {
  request: EstimateRequestSummary
}

const statusClass = {
  requested: 'bg-[#ecfdf5] text-[#07835b]',
  reviewing: 'bg-[#fff7e8] text-[#b56700]',
} as const

export default function EstimateRequestHistoryCard({
  request,
}: EstimateRequestHistoryCardProps) {
  return (
    <article className="rounded-[7px] border border-[#d5dfed] bg-white p-[13px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[11px] font-bold leading-[13px] text-[#15284c]">
            {request.contractorName}
          </h2>
          <p className="mt-2 text-[8px] text-[#6e7788]">{request.regionAndSpecialty}</p>
        </div>
        <span
          className={`shrink-0 rounded-[5px] px-[7px] py-1 text-[7px] leading-2 ${statusClass[request.status]}`}
        >
          {request.statusLabel}
        </span>
      </div>

      <dl className="mt-[15px] grid max-w-[176px] grid-cols-2 text-[9px] leading-[17px]">
        <dt className="text-[#657187]">요청 항목</dt>
        <dd className="text-right text-[#17233a]">{request.itemCountLabel}</dd>
        <dt className="text-[#657187]">요청 일시</dt>
        <dd className="text-right text-[#17233a]">{request.requestedAtLabel}</dd>
      </dl>

      <div className="mt-7 flex justify-end">
        <Link
          to={`/mypage/requests/${request.id}`}
          aria-label={`${request.contractorName} 견적 요청 상세 보기`}
          className="flex h-6 items-center justify-center rounded-[4px] border border-[#6094d8] px-[7px] text-[8px] text-[#164f9e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        >
          상세 보기
        </Link>
      </div>
    </article>
  )
}
