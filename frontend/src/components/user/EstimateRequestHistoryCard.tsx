import { Link } from 'react-router-dom'
import type { EstimateRequestSummary } from '@/mocks/estimateRequests'

interface EstimateRequestHistoryCardProps {
  request: EstimateRequestSummary
}

const statusClass = {
  requested: 'bg-[#e5f7f0] text-[#09835b]',
  reviewing: 'bg-[#fff2db] text-[#b56700]',
} as const

export default function EstimateRequestHistoryCard({
  request,
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