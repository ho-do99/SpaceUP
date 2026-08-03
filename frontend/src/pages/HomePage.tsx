import { Link } from 'react-router-dom'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { homeFeatures, homeRecommendations } from '@/mocks/userHome'

export default function HomePage() {
  return (
    <UserScreenShell>
      <UserHeader variant="main" />

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(32px+env(safe-area-inset-bottom))]">
        <section className="relative mt-4 h-[215px] overflow-hidden bg-[linear-gradient(151.2deg,#ffffff_45%,#edf4fc_100%)] px-6 py-7">
          <h1 className="break-keep text-[24px] font-bold leading-[34px] text-[#0f274a]">
            빌라·아파트 데이터 분석으로
            <span className="block">
              공간 <span className="text-[#2563eb]">가치를 높이세요</span>
            </span>
          </h1>
          <p className="mt-2 text-[10px] leading-4 text-[#15284c]">
            공간 분석부터 추천, 견적, 가치 상승 인사이트까지
            <span className="block">한 번에 확인하세요.</span>
          </p>
          <Link
            to="/analysis/new/property"
            className="mt-2.5 flex h-9 w-[200px] items-center justify-center rounded-[5px] border border-[#2563eb] bg-[#2563eb] text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            분석 시작하기
          </Link>

          <div
            aria-hidden="true"
            className="absolute bottom-[-5px] right-[-4px] flex items-end opacity-25"
          >
            <span className="h-[70px] w-[42px] border-[3px] border-[#9cbce4]" />
            <span className="h-[105px] w-[42px] border-[3px] border-[#9cbce4]" />
            <span className="h-[85px] w-[42px] border-[3px] border-[#9cbce4]" />
          </div>
        </section>

        <section
          aria-label="SpaceUP 주요 기능"
          className="mx-[19px] mt-[18px] grid min-h-[130px] grid-cols-3 rounded-[9px] bg-white px-2 py-[18px] shadow-[0_5px_18px_rgba(23,63,113,0.08)]"
        >
          {homeFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className={`flex min-w-0 flex-col items-center px-[7px] text-center ${
                index < homeFeatures.length - 1 ? 'border-r border-[#e3e8f0]' : ''
              }`}
            >
              <img src={feature.icon} alt="" className="size-7 shrink-0" />
              <h2 className="mt-2 text-[11px] font-bold leading-[13px] text-[#15284c]">
                {feature.title}
              </h2>
              <p className="mt-2 break-keep text-[8px] leading-[12.8px] text-[#6d788b]">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mx-[19px] mt-[18px] rounded-[7px] border border-[#d5dfed] bg-[linear-gradient(164deg,#ffffff_0%,#edf5ff_100%)] p-[14px]">
          <h2 className="text-[11px] font-bold leading-[13px] text-[#15284c]">
            이런 분들께 추천해요
          </h2>
          <ul className="mt-[9px] space-y-0 text-[9px] leading-[17.1px] text-[#15284c]">
            {homeRecommendations.map((recommendation) => (
              <li key={recommendation} className="flex items-start gap-[6px]">
                <span aria-hidden="true" className="font-extrabold text-[#0750a8]">
                  ✓
                </span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </UserScreenShell>
  )
}
