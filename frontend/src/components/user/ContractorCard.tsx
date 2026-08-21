import { Link } from 'react-router-dom'
import type { ContractorSummary } from '@/mocks/contractors'

interface ContractorCardProps {
  contractor: ContractorSummary
}

export default function ContractorCard({
  contractor,
}: ContractorCardProps) {
  return (
    <article className="relative h-[238px] w-full overflow-hidden rounded-[7px] border border-[#d5dfed] bg-white">
      {/* 시공사 아이콘 */}
      <div className="absolute left-[11px] top-[11px] flex h-10 w-10 items-center justify-center rounded-[7px] bg-[#f1f5f9]">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 21V5.5L12 2L19 5.5V21"
            stroke="#315B86"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V17H15V21"
            stroke="#315B86"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 8H10"
            stroke="#315B86"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14 8H15.5"
            stroke="#315B86"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8.5 12H10"
            stroke="#315B86"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14 12H15.5"
            stroke="#315B86"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 업체명 */}
      <h2 className="absolute left-[63px] top-[10px] h-5 w-[190px] truncate text-[14px] font-bold leading-5 text-[#0f172a]">
        {contractor.companyName}
      </h2>

      {/* 지역 / 시공 경험 */}
      <p className="absolute left-[63px] top-[36px] h-5 w-[190px] truncate text-[10px] font-normal leading-5 text-[#64748b]">
        {contractor.region} · {contractor.experienceLabel}
      </p>

      {/* 평점 */}
      <p className="absolute left-[63px] top-[56px] h-5 w-[120px] text-[10px] font-medium leading-5 text-[#f59e0b]">
        ★ {contractor.rating.toFixed(1)} ({contractor.reviewCount})
      </p>

      {/* 매칭 점수 */}
      <p className="absolute right-[11px] top-[10px] h-7 min-w-[58px] text-right text-[20px] font-bold leading-7 text-[#2563eb]">
        {contractor.matchingScore}점
      </p>

      {/* 스타일 시공 경험 */}
      <div className="absolute left-[11px] top-[81px] flex h-6 min-w-[138px] items-center justify-center rounded-full bg-[#eff6ff] px-[9px]">
        <span className="whitespace-nowrap text-center text-[11px] font-medium leading-5 text-[#2563eb]">
          {contractor.experienceLabel}
        </span>
      </div>

      {/* 유사 스타일 */}
      <p className="absolute right-[17px] top-[84px] h-5 text-right text-[11px] font-medium leading-5 text-[#475569]">
        유사 스타일 {contractor.similarProjectCount}건
      </p>

      {/* 전문 영역 */}
      <p className="absolute left-[11px] top-[114px] h-5 max-w-[330px] truncate text-[11px] font-medium leading-5 text-[#0f172a]">
        전문 · {contractor.specialties.join(' · ')}
      </p>

      {/* 포트폴리오 이미지 */}
      <img
        src={contractor.portfolioSrc}
        alt={contractor.portfolioAlt}
        className="absolute left-[11px] top-[147px] h-14 w-[76px] rounded-[7px] bg-[#f1f5f9] object-cover"
      />

      {/* 추천 이유 */}
      <p className="absolute left-[99px] right-[17px] top-[145px] break-keep text-[11px] font-normal leading-[16px] text-[#475569]">
        {contractor.recommendation}
      </p>

      {/* 하단 버튼 */}
      <div className="absolute bottom-[10px] right-[11px] flex items-center gap-[9px]">
        <Link
          to={`/contractors/${contractor.id}`}
          state={{ contractor }}
          aria-label={`${contractor.companyName} 포트폴리오 보기`}
          className="flex h-[34px] w-[138px] shrink-0 items-center justify-center rounded-[8px] border border-[#2563eb] bg-white px-[10px] text-[12px] font-medium text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        >
          포트폴리오 보기
        </Link>

        <Link
          to="/estimate/request"
          state={{
            contractorId: contractor.id,
          }}
          aria-label={`${contractor.companyName} 견적 요청`}
          className="flex h-[34px] w-[100px] shrink-0 items-center justify-center rounded-[7px] bg-[#2563eb] px-[10px] text-[12px] font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        >
          견적 요청
        </Link>
      </div>
    </article>
  )
}
