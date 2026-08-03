import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import BeforeAfterComparison from '@/components/user/BeforeAfterComparison'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

export default function SimulationResultPage() {
  const navigate = useNavigate()

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="AI 인테리어 시뮬레이션 결과"
        onBack={() => navigate('/analysis/simulation/photo')}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          <AnalysisStepIndicator currentStep={4} completedContent="number" showDivider />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">
              AI 인테리어 시뮬레이션 결과
            </h1>
            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              선택한 스타일이 적용된 공간을 확인해보세요.
            </p>
          </section>

          <section className="mt-[12px] pb-6">
            <p className="mx-auto w-fit rounded-full bg-[#eff6ff] px-4 py-[10px] text-[12px] font-medium leading-5 text-[#2563eb]">
              선택 스타일 · 모던
            </p>
            <div className="mt-4">
              <BeforeAfterComparison />
            </div>
          </section>
        </main>

        <footer className="grid shrink-0 grid-cols-[1fr_1.03fr] gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-semibold !text-[#2563eb] !shadow-none hover:!translate-y-0 hover:!bg-white hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            onClick={() => navigate('/analysis/simulation/photo')}
          >
            다시 생성하기
          </Button>
          <Button
            type="button"
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[12px] !font-semibold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            이 스타일로 결정하기
          </Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
