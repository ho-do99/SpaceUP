import { Link } from 'react-router-dom'
import type { EstimateRequestSummary } from '@/mocks/estimateRequests'

interface EstimateRequestHistoryCardProps {
  request: EstimateRequestSummary
  deleting?: boolean
  onDelete: (request: EstimateRequestSummary) => void
}

const statusClass = {
  requested: 'bg-[#e5f7f0] text-[#09835b]',
  reviewing: 'bg-[#fff2db] text-[#b56700]',
} as const

export default function EstimateRequestHistoryCard({
  request,
  deleting = false,
  onDelete,
}: EstimateRequestHistoryCardProps) {
  return (
    <article className="relative h-[170px] w-full rounded-[7px] border border-[#d5dfed] bg-white p-[14px]">
      {/* 시공사명 */}
      <h2 className="max-w-[235px] truncate text-[11px] font-bold leading-[16px] text-[#15284c]">
        {request.contractorName}
      </h2>

      {/* 지역 · 전문 분야 */}
      <p className="mt-[7px] max-w-[235px] truncate text-[8px] font-normal leading-[12px] text-[#6e7788]">
        {request.regionAndSpecialty}
      </p>

      {/* 상태 배지 */}
      <span
        className={`absolute right-[12px] top-[12px] rounded-[4px] px-[7px] py-[4px] text-[7px] font-normal leading-[10px] ${statusClass[request.status]}`}
      >
        {request.statusLabel}
      </span>

      {/* 요청 정보 */}
      <dl className="mt-[15px] grid w-[176px] grid-cols-2 text-[9px] font-normal leading-[16px]">
        <dt className="text-[#657187]">
          요청 항목
        </dt>

        <dd className="text-right text-[#17233a]">
          {request.itemCountLabel}
        </dd>

        <dt className="text-[#657187]">
          요청 일시
        </dt>

        <dd className="text-right text-[#17233a]">
          {request.requestedAtLabel}
        </dd>
      </dl>

      <button
        type="button"
        aria-label={`${request.contractorName} 견적 요청 삭제`}
        title="견적 요청 삭제"
        disabled={deleting}
        onClick={() => onDelete(request)}
        className="absolute bottom-[15px] left-[12px] flex size-[26px] items-center justify-center rounded-[4px] border border-[#fecaca] bg-[#fff7f7] text-[#dc2626] transition-colors hover:bg-[#fee2e2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      </button>

      {/* 상세 보기 */}
      <Link
        to={`/mypage/requests/${request.id}`}
        aria-label={`${request.contractorName} 견적 요청 상세 보기`}
        className="absolute bottom-[15px] right-[12px] flex h-[26px] items-center justify-center rounded-[4px] border border-[#9ab5da] bg-white px-[7px] text-[8px] font-normal text-[#164f9e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
      >
        상세 보기
      </Link>
    </article>
  )
}
