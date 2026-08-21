import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getContractor } from '@/api/contractorApi'
import Button from '@/components/Button'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { getContractorById } from '@/mocks/contractors'
import type { ContractorSummary } from '@/mocks/contractors'
import { profileToSummary } from '@/utils/contractorAdapter'

export default function ContractorDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { contractorId } = useParams<{ contractorId: string }>()
  const recommendedContractor = (location.state as { contractor?: ContractorSummary } | null)?.contractor
  const [contractor, setContractor] = useState<ContractorSummary | undefined>(
    () => recommendedContractor ?? getContractorById(contractorId),
  )

  useEffect(() => {
    if (!contractorId || !/^\d+$/.test(contractorId)) return
    getContractor(Number(contractorId))
      .then((profile) => {
        const profileSummary = profileToSummary(profile)
        setContractor((current) => {
          const recommendation = current?.id === contractorId ? current : recommendedContractor
          if (!recommendation) return profileSummary

          return {
            ...profileSummary,
            experienceLabel: recommendation.experienceLabel,
            matchingScore: recommendation.matchingScore,
            reviewScore: recommendation.reviewScore,
            priceScore: recommendation.priceScore,
            responseSpeedScore: recommendation.responseSpeedScore,
            recommendation: recommendation.recommendation,
            recommendationReasons: recommendation.recommendationReasons,
            responseTimeLabel: recommendation.responseTimeLabel,
          }
        })
      })
      .catch(() => setContractor(undefined))
  }, [contractorId, recommendedContractor])

  if (!contractor) {
    return (
      <UserScreenShell className="h-dvh">
        <UserHeader variant="detail" title="시공사 상세" onBack={() => navigate('/contractors')} />
        <main className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <h1 className="text-[18px] font-bold text-[#1e293b]">시공사 정보를 찾을 수 없습니다</h1>
          <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
            시공사 목록에서 업체 정보를 다시 확인해주세요.
          </p>
          <Link
            to="/contractors"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            시공사 목록으로
          </Link>
        </main>
      </UserScreenShell>
    )
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="시공사 상세" onBack={() => navigate('/contractors')} />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-5">
          <h1 className="text-[18px] font-bold leading-[22px] text-[#1e293b]">
            {contractor.companyName}
          </h1>
          <p className="mt-2 text-[11px] leading-4 text-[#64748b]">
            추천 조건과 업체 정보를 확인하세요.
          </p>

          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[16px] font-bold text-[#2563eb]">
                {contractor.initial}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[14px] font-bold leading-5 text-[#1e293b]">
                      {contractor.companyName}
                    </h2>
                    <p className="mt-1 text-[10px] text-[#64748b]">
                      {contractor.region} · 리모델링 전문
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[#f59e0b]">
                      ★ {contractor.rating.toFixed(1)} ({contractor.reviewCount})
                    </p>
                  </div>
                  <strong className="shrink-0 text-[10px] font-bold text-[#2563eb]">
                    매칭 점수 {contractor.matchingScore}점
                  </strong>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold text-[#1e293b]">
              예상 견적 {contractor.budgetRangeLabel}
            </p>
            <p className="mt-2 text-[9px] text-[#64748b]">
              {contractor.availableDateLabel} · {contractor.responseTimeLabel}
            </p>
          </section>

          <section className="mt-3 rounded-[10px] border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">업체 소개</h2>
            <p className="mt-3 break-keep text-[10px] leading-4 text-[#64748b]">
              {contractor.description}
            </p>
          </section>

          <section className="mt-3 rounded-[10px] border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">전문 시공 항목</h2>
            <ul className="mt-3 flex flex-wrap gap-3" aria-label="전문 시공 항목">
              {contractor.specialties.map((specialty) => (
                <li
                  key={specialty}
                  className="rounded-full bg-[#eff6ff] px-3 py-2 text-[9px] font-bold text-[#2563eb]"
                >
                  {specialty}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-3 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-[13px]">
            <h2 className="text-[10px] font-normal text-[#64748b]">예상 견적 범위</h2>
            <p className="mt-2 text-[16px] font-bold text-[#2563eb]">
              {contractor.budgetRangeLabel}
            </p>
          </section>

          {contractor.reviewScore != null &&
          contractor.priceScore != null &&
          contractor.responseSpeedScore != null ? (
            <section className="mt-3 rounded-[10px] border border-[#dbeafe] bg-white p-[13px]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[12px] font-bold text-[#1e293b]">매칭 점수 산정</h2>
                <strong className="text-[12px] font-bold text-[#2563eb]">
                  총 {contractor.matchingScore}점
                </strong>
              </div>
              <p className="mt-1 text-[9px] leading-4 text-[#64748b]">
                리뷰·가격·응답속도 세 항목을 합산한 추천 점수예요.
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ['리뷰', contractor.reviewScore],
                  ['가격', contractor.priceScore],
                  ['응답속도', contractor.responseSpeedScore],
                ].map(([label, score]) => (
                  <div key={label} className="rounded-[8px] bg-[#eff6ff] px-2 py-3 text-center">
                    <dt className="text-[9px] font-medium text-[#64748b]">{label}</dt>
                    <dd className="mt-1 text-[13px] font-bold text-[#2563eb]">
                      {label} {score}점
                    </dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-3 space-y-1.5 border-t border-[#e2e8f0] pt-3 text-[10px] leading-4 text-[#64748b]">
                {contractor.recommendationReasons.map((reason) => (
                  <li key={reason} className="flex gap-1.5">
                    <span aria-hidden="true" className="text-[#2563eb]">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="mt-3 rounded-[10px] border border-[#e2e8f0] bg-white p-[13px]">
              <h2 className="text-[12px] font-bold text-[#1e293b]">추천 이유</h2>
              <ul className="mt-3 space-y-1 text-[10px] leading-4 text-[#64748b]">
                {contractor.recommendationReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>
          )}
        </main>

        <footer className="grid shrink-0 grid-cols-2 gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-bold !text-[#2563eb] !shadow-none hover:!translate-y-0 hover:!bg-white hover:!shadow-none active:!translate-y-0"
            onClick={() => navigate('/contractors')}
          >
            시공사 목록
          </Button>
          <Button
            type="button"
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0"
            onClick={() => navigate('/estimate/request', { state: { contractorId: contractor.id } })}
          >
            이 시공사 선택
          </Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
