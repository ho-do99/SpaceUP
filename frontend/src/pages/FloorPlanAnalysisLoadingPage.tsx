import { useNavigate } from 'react-router-dom'
import analysisSpinner from '@/assets/user/icons/analysis-spinner.svg'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

export default function FloorPlanAnalysisLoadingPage() {
  const navigate = useNavigate()

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="평면도 분석"
        onBack={() => navigate(-1)}
      />

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
        <AnalysisStepIndicator currentStep={2} />

        <section className="pt-8 text-center">
          <h1 className="break-keep text-[20px] font-bold leading-6 text-[#0f172a]">
            평면도를 분석하고 있어요
          </h1>
          <p className="mt-4 break-keep text-[14px] leading-5 text-[#64748b]">
            업로드한 평면도의 공간 정보를 불러오고 있습니다.
          </p>
        </section>

        <section
          role="status"
          aria-live="polite"
          className="mt-[34px] flex h-[300px] shrink-0 flex-col items-center rounded-[12px] border border-[#dbeafe] bg-[#f8fafc]"
        >
          <div
            aria-hidden="true"
            className="relative mt-6 h-[110px] w-[180px] shrink-0 border-2 border-[#94a3b8] bg-white"
          >
            <span className="absolute left-[88px] top-0 h-full w-0.5 bg-[#94a3b8]" />
            <span className="absolute left-[88px] top-[58px] h-0.5 w-[90px] bg-[#94a3b8]" />
          </div>

          <img
            src={analysisSpinner}
            alt=""
            className="mt-6 size-12 shrink-0 animate-spin motion-reduce:animate-none"
          />

          <p className="mt-6 text-center text-[14px] font-medium leading-5 text-[#475569]">
            잠시만 기다려주세요.
          </p>
        </section>
      </main>

      <footer className="shrink-0 bg-white px-4 pb-[calc(19px+env(safe-area-inset-bottom))]">
        <Button
          type="button"
          disabled
          className="h-12 w-full !rounded-[8px] !border !border-[#cbd5e1] !bg-[#cbd5e1] !px-4 !py-0 !text-[14px] !font-bold !opacity-100 !shadow-none"
        >
          분석 중…
        </Button>
      </footer>
    </UserScreenShell>
  )
}
