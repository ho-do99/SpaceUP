import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { homeValueReport } from '@/mocks/homeValueReport'

export default function HomeValueIncreaseReportPage() {
  const navigate = useNavigate()

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="주택 가치 상승 리포트"
        onBack={() => navigate('/estimate/summary')}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <AnalysisStepIndicator currentStep={6} completedContent="number" showDivider />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[24px] text-[#15284c]">
              {homeValueReport.title}
            </h1>
            <p className="mt-2 text-[10px] leading-[17px] text-[#657187]">
              {homeValueReport.description}
            </p>
          </section>

          <section className="mt-3 rounded-[10px] border border-[#e2e8f0] bg-white p-[13px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[12px] font-bold text-[#1e293b]">
                {homeValueReport.simulationTitle}
              </h2>
              <span className="rounded-full bg-[#eff6ff] px-4 py-1.5 text-[11px] font-bold text-[#2563eb]">
                {homeValueReport.increaseBadge}
              </span>
            </div>

            <div
              className="mt-3 space-y-3"
              role="img"
              aria-label="현재 월세 60만원, 시공 후 예상 월세 80만원 비교"
            >
              {homeValueReport.bars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-[10px] leading-4">
                    <span className="text-[#64748b]">{bar.label}</span>
                    <strong className={bar.tone === 'expected' ? 'text-[#2563eb]' : 'text-[#1e293b]'}>
                      {bar.displayValue}
                    </strong>
                  </div>
                  <div className="mt-1.5 h-[9px] overflow-hidden rounded-full bg-[#f8fafc]">
                    <div
                      className={`h-full rounded-full ${
                        bar.tone === 'expected' ? 'bg-[#2563eb]' : 'bg-[#bfdbfe]'
                      }`}
                      style={{ width: `${bar.widthPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 break-keep text-[10px] leading-4 text-[#64748b]">
              {homeValueReport.simulationDescription}
            </p>
          </section>

          <section className="mt-2.5 rounded-[10px] border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">가치 상승 요약</h2>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {homeValueReport.metrics.map((metric, index) => (
                <article
                  key={metric.label}
                  className="min-w-0 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-2.5"
                >
                  <h3 className="text-[9px] leading-3 text-[#64748b]">{metric.label}</h3>
                  <p
                    className={`mt-2 break-keep font-bold leading-[18px] ${
                      metric.emphasis === 'brand'
                        ? 'text-[15px] text-[#2563eb]'
                        : 'text-[12px] text-[#1e293b]'
                    }`}
                  >
                    {metric.displayValue}
                  </p>
                  {index === 1 && (
                    <div aria-hidden="true" className="mt-3">
                      <div className="relative h-2">
                        <span className="absolute left-0 right-0 top-[3px] h-0.5 rounded bg-[#e2e8f0]" />
                        <span className="absolute right-0 top-0 size-2 rounded-full bg-[#2563eb]" />
                      </div>
                      <div className="flex justify-between text-[7px] text-[#64748b]">
                        <span>0개월</span>
                        <strong className="text-[#2563eb]">39개월</strong>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <article className="mt-2 rounded-[9px] bg-[#eff6ff] px-3 py-2">
              <p className="text-[9px] text-[#64748b]">연간 투자비 회수율</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <strong className="text-[20px] leading-6 text-[#2563eb]">
                  {homeValueReport.annualRecoveryRate}
                </strong>
                <span className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-center">
                  <span className="block text-[8px] text-[#64748b]">예상 연간 추가 임대수익</span>
                  <strong className="mt-0.5 block text-[12px] text-[#059669]">
                    {homeValueReport.annualAdditionalIncome}
                  </strong>
                </span>
              </div>
            </article>
          </section>

          <section className="mb-6 mt-2.5 rounded-[7px] border border-[#d5dfed] bg-white p-3.5">
            <h2 className="text-[11px] font-bold text-[#15284c]">유의 사항</h2>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-[12px] leading-[18px] text-[#15284c]">
              {homeValueReport.cautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="grid shrink-0 grid-cols-2 gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-semibold !text-[#2563eb] !shadow-none hover:!translate-y-0 hover:!bg-white hover:!shadow-none active:!translate-y-0"
            onClick={() => navigate('/estimate/summary')}
          >
            이전
          </Button>
          <Button
            type="button"
            disabled
            className="h-12 w-full !cursor-default !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[12px] !font-semibold !opacity-100 !shadow-none"
          >
            다음
          </Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
