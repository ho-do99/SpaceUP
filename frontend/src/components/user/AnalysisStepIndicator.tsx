type AnalysisStep = 1 | 2 | 3 | 4 | 5 | 6

interface AnalysisStepIndicatorProps {
  currentStep: AnalysisStep
  completedContent?: 'check' | 'number'
  showDivider?: boolean
}

const analysisSteps: AnalysisStep[] = [1, 2, 3, 4, 5, 6]

export default function AnalysisStepIndicator({
  currentStep,
  completedContent = 'check',
  showDivider = false,
}: AnalysisStepIndicatorProps) {
  return (
    <ol
      aria-label="분석 진행 단계"
      className={`mx-auto mt-4 flex h-[50px] w-[min(295px,100%)] items-center justify-between ${
        showDivider ? 'border-b border-[#e4e9f0]' : ''
      }`}
    >
      {analysisSteps.map((step) => {
        const isComplete = step < currentStep
        const isCurrent = step === currentStep

        return (
          <li
            key={step}
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={isComplete ? `${step}단계 완료` : `${step}단계`}
            className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              isComplete
                ? 'bg-[#eff6ff] text-[#2563eb]'
                : isCurrent
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#e2e8f0] text-[#64748b]'
            }`}
          >
            {isComplete && completedContent === 'check' ? '✓' : step}
          </li>
        )
      })}
    </ol>
  )
}
