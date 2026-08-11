import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRecommendedContractors } from '@/api/contractorApi'
import Button from '@/components/Button'
import ContractorCard from '@/components/user/ContractorCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import type { ContractorSummary } from '@/mocks/contractors'
import { recommendationToSummary } from '@/utils/contractorAdapter'
import { getActiveRequestId } from '@/utils/requestFlow'

export default function ContractorPage() {
  const navigate = useNavigate()

  const [visibleContractors, setVisibleContractors] =
    useState<readonly ContractorSummary[]>([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const topRecommendation = visibleContractors[0]

  useEffect(() => {
    const requestId = getActiveRequestId()

    if (!requestId) { setLoading(false); setLoadError('진행 중인 의뢰 정보를 찾을 수 없습니다.'); return }

    getRecommendedContractors(requestId)
      .then((items) => {
        setVisibleContractors(items.map(recommendationToSummary))
        setLoading(false)
      })
      .catch((error) => { setLoading(false); setLoadError(error instanceof Error ? error.message : '추천 시공사를 불러오지 못했습니다.') })
  }, [])

  return (
    <UserScreenShell>
      <UserHeader
        variant="detail"
        title="시공사 추천"
        onBack={() => navigate('/estimate/summary')}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <section className="pb-[10px] pt-[36px] text-center">
            <h1 className="mx-auto max-w-[353px] break-keep text-[18px] font-bold leading-[24px] text-[#15284c]">
              선택한 스타일의 시공 경험이 있는 시공사를 추천해드려요.
            </h1>

            <p className="mt-2 break-keep text-[10px] font-normal leading-[17px] text-[#657187]">
              유사한 모던 스타일 시공 사례와 전문 항목을 기준으로
              추천했어요.
            </p>
          </section>

          <section
            className="space-y-[15px] pb-6 pt-[28px]"
            aria-label="추천 시공사 목록"
          >
            {loading ? <p className="py-10 text-center text-xs text-[#64748b]">추천 시공사를 불러오는 중입니다.</p> : null}
            {loadError ? <p role="alert" className="py-10 text-center text-xs text-[#dc2626]">{loadError}</p> : null}
            {!loading && !loadError && visibleContractors.length === 0 ? <p className="py-10 text-center text-xs text-[#64748b]">추천 가능한 시공사가 없습니다.</p> : null}
            {visibleContractors.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
              />
            ))}
          </section>

        </main>

        <footer className="grid shrink-0 grid-cols-2 gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-bold !text-[#2563eb] !shadow-none hover:!translate-y-0 hover:!bg-white hover:!shadow-none active:!translate-y-0"
            onClick={() => navigate('/estimate/summary')}
          >
            이전
          </Button>

          <Link
            to="/estimate/request"
            state={
              topRecommendation
                ? {contractorId: topRecommendation.id}
                : undefined
            }
            className="flex h-12 items-center justify-center rounded-[5px] border border-[#2563eb] bg-[#2563eb] px-2 text-center text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            견적 요청하기
          </Link>
        </footer>
      </div>
    </UserScreenShell>
  )
}
