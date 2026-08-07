import { Link } from 'react-router-dom'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

import hero3D from '@/assets/user/home/hero-3d.svg'
import recommendationInterior from '@/assets/user/home/recommendation-interior.svg'

import {
  homeFeatures,
  homeFlowSteps,
  homeRecommendations,
} from '@/mocks/userHome'

export default function HomePage() {
  return (
    <UserScreenShell>
      <UserHeader variant="main" />

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f7faff]">
        <div className="flex w-full flex-col gap-3 px-4 pb-6 pt-[14px]">
          {/* 히어로 */}
          <section className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-[16px] bg-white">
            <div
              aria-hidden="true"
              className="absolute -top-7 left-[235px] size-[180px] rounded-full bg-[#eff6ff] opacity-45"
            />

            <div
              aria-hidden="true"
              className="absolute left-[290px] top-[118px] size-[95px] rounded-[48px] bg-[#f3f7ff] opacity-25"
            />

            <h1 className="absolute left-[13px] top-[10px] w-[333px] break-keep text-[16.5px] font-bold leading-6 text-[#0f2545]">
              평면도 분석부터
              <span className="block">
                AI 스타일 시뮬레이션까지
              </span>
              <span className="block">
                우리 집 인테리어를{' '}
                <span className="text-[#2563eb]">
                  더 쉽게
                </span>
              </span>
            </h1>

            <p className="absolute left-[13px] top-[91px] w-[198px] break-keep text-[9.5px] leading-4 text-[#63748d]">
              AI가 평면도를 분석하고 3D 모델을 보여드려요.
              <span className="block">
                스타일을 선택하면 Before/After 이미지를 생성하고
                예상 견적과 시공사까지 한 번에 연결해 드려요.
              </span>
            </p>

            <Link
              to="/analysis/new/property"
              className="absolute left-[13px] top-[157px] flex h-9 w-[97px] items-center justify-center rounded-[9px] bg-[#2563eb] text-[12px] font-bold text-white"
            >
              분석 시작하기
            </Link>

            <img
              src={hero3D}
              alt=""
              className="absolute left-[166px] top-[76px] h-[132px] w-[188px]"
            />
          </section>

          {/* 핵심 기능 */}
          <section
            aria-label="SpaceUP 주요 기능"
            className="flex h-[258px] w-full shrink-0 flex-col gap-2"
          >
            <div className="grid h-[83px] grid-cols-2 gap-2">
              {homeFeatures.slice(0, 2).map((feature) => (
                <article
                  key={feature.title}
                  className="relative h-[83px] overflow-hidden rounded-[12px] border border-[#e7eef9] bg-white"
                >
                  <div className="absolute left-[9px] top-[13px] flex h-[52px] w-11 items-center justify-center rounded-[9px] bg-[#f1f6ff]">
                    <img
                      src={feature.icon}
                      alt=""
                      className="size-6"
                    />
                  </div>

                  <h2 className="absolute left-[63px] top-[14px] w-[98px] text-[12px] font-bold leading-[18px] text-[#172b4d]">
                    {feature.title}
                  </h2>

                  <p className="absolute left-[63px] top-9 w-[94px] break-keep text-[9px] leading-[15px] text-[#6f7f96]">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid h-[83px] grid-cols-2 gap-2">
              {homeFeatures.slice(2, 4).map((feature) => (
                <article
                  key={feature.title}
                  className="relative h-[83px] overflow-hidden rounded-[12px] border border-[#e7eef9] bg-white"
                >
                  <div className="absolute left-[9px] top-[13px] flex h-[52px] w-11 items-center justify-center rounded-[9px] bg-[#f1f6ff]">
                    <img
                      src={feature.icon}
                      alt=""
                      className="size-6"
                    />
                  </div>

                  <h2 className="absolute left-[63px] top-[14px] w-[98px] text-[12px] font-bold leading-[18px] text-[#172b4d]">
                    {feature.title}
                  </h2>

                  <p className="absolute left-[63px] top-9 w-[94px] break-keep text-[9px] leading-[15px] text-[#6f7f96]">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>

            <article className="relative h-[76px] w-full overflow-hidden rounded-[12px] border border-[#e7eef9] bg-white">
              <img
                src={homeFeatures[4].icon}
                alt=""
                className="absolute left-[9px] top-[11px] size-[52px]"
              />

              <h2 className="absolute left-[73px] top-[14px] w-[200px] text-[12px] font-bold leading-[18px] text-[#172b4d]">
                {homeFeatures[4].title}
              </h2>

              <p className="absolute left-[73px] top-[37px] w-[215px] text-[9.5px] leading-[15px] text-[#6f7f96]">
                {homeFeatures[4].description}
              </p>
            </article>
          </section>

          {/* 이용 흐름 */}
          <section className="relative h-[116px] w-full shrink-0 overflow-hidden rounded-[14px] border border-[#e7eef9] bg-white">
            <h2 className="absolute left-[13px] top-[11px] text-[12px] font-bold leading-[18px] text-[#172b4d]">
              이용 흐름
            </h2>

            <div className="absolute left-[13px] right-[13px] top-[38px] grid grid-cols-5">
              {homeFlowSteps.map((item, index) => (
                <div
                  key={item.step}
                  className="relative flex flex-col items-center"
                >
                  {index < homeFlowSteps.length - 1 ? (
                    <div
                      aria-hidden="true"
                      className="absolute left-[calc(50%+13px)] top-[10px] w-[46px] border-t border-dashed border-[#bdd3f5]"
                    />
                  ) : null}

                  <div className="relative z-10 flex size-5 items-center justify-center rounded-full bg-[#eaf2ff] text-[9px] font-bold text-[#2563eb]">
                    {item.step}
                  </div>

                  <img
                    src={item.icon}
                    alt=""
                    className="mt-[5px] size-6"
                  />

                  <span className="mt-[3px] whitespace-nowrap text-[8px] font-bold leading-[14px] text-[#314966]">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 추천 대상 */}
          <section className="relative h-[132px] w-full shrink-0 overflow-hidden rounded-[14px] border border-[#e7eef9] bg-white">
            <h2 className="absolute left-[13px] top-[11px] text-[12px] font-bold leading-[18px] text-[#172b4d]">
              이런 분들께 추천해요
            </h2>

            <ul className="absolute left-[13px] top-[41px] space-y-2">
              {homeRecommendations.map((recommendation) => (
                <li
                  key={recommendation}
                  className="flex h-[14px] items-center gap-2"
                >
                  <span className="flex size-[14px] shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[8px] font-black text-white">
                    ✓
                  </span>

                  <span className="text-[9px] leading-4 text-[#40536d]">
                    {recommendation}
                  </span>
                </li>
              ))}
            </ul>

            <img
              src={recommendationInterior}
              alt=""
              className="absolute left-[250px] top-[21px] h-[98px] w-[100px]"
            />
          </section>
        </div>
      </main>
    </UserScreenShell>
  )
}