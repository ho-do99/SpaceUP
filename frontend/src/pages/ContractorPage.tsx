import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import ContractorCard from '@/components/user/ContractorCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { contractors } from '@/mocks/contractors'

export default function ContractorPage() {
  const navigate = useNavigate()
  const topRecommendation = contractors[0]

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="시공사 추천"
        onBack={() => navigate('/estimate/summary')}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <section className="pb-3 pt-9 text-center">
            <h1 className="mx-auto max-w-[353px] break-keep text-[18px] font-bold leading-[24px] text-[#15284c]">
              선택한 스타일의 시공 경험이 있는 시공사를 추천해드려요.
            </h1>
            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              유사한 모던 스타일 시공 사례와 전문 항목을 기준으로 추천했어요.
            </p>
          </section>

          <section className="space-y-[15px] pb-6 pt-3" aria-label="추천 시공사 목록">
            {contractors.map((contractor) => (
              <ContractorCard key={contractor.id} contractor={contractor} />
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
            to={`/contractors/${topRecommendation.id}`}
            className="flex h-12 items-center justify-center rounded-[5px] border border-[#2563eb] bg-[#2563eb] px-2 text-center text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            견적 요청하기
          </Link>
        </footer>
      </div>
    </UserScreenShell>
  )
}
