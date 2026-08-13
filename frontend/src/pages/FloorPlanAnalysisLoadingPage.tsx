import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import analysisSpinner from '@/assets/user/icons/analysis-spinner.svg'
import { getAnalysis, scanFloorPlan, scanStoredFloorPlan } from '@/api/analysisApi'
import { getFloorPlanVariantPreviewUrl } from '@/api/apartmentFloorPlanApi'
import { ApiClientError } from '@/api/axiosInstance'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { clearStoredFloorPlanAnalysisState, getFloorPlanAnalysisNavigationState, getStoredFloorPlanAnalysisState } from '@/utils/floorPlanAnalysisFlow'
import { getActiveRequestId } from '@/utils/requestFlow'

function getScanErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return error instanceof Error
      ? error.message
      : '평면도 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }

  if (error.status === 400) return error.message || '평면도 파일과 주택 정보를 확인해 주세요.'
  if (error.status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if (error.status === 403) return '이 의뢰의 평면도를 분석할 권한이 없습니다.'
  if (error.status === 404) return '분석할 의뢰 정보를 찾을 수 없습니다.'
  if (error.status && error.status >= 500) return '평면도 분석 서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  if (error.kind === 'network') return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.'

  return error.message || '평면도 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export default function FloorPlanAnalysisLoadingPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const routeAnalysisState = useMemo(() => getFloorPlanAnalysisNavigationState(state), [state])
  const analysisState = useMemo(() => routeAnalysisState ?? getStoredFloorPlanAnalysisState(), [routeAnalysisState])
  const recoveredStorageState = !routeAnalysisState && analysisState?.mode === 'storage'
  const requestId = getActiveRequestId()
  const floorPlanFile = analysisState?.mode === 'multipart' ? analysisState.floorPlanFile : null
  const [attempt, setAttempt] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(Boolean(requestId && floorPlanFile))
  const [errorMessage, setErrorMessage] = useState('')

  const moveToSpaceResults = useCallback(() => {
    const floorPlanPreviewUrl = analysisState?.mode === 'storage'
      ? getFloorPlanVariantPreviewUrl(analysisState.floorPlanVariantId)
      : analysisState?.uploadedImageUrl
    clearStoredFloorPlanAnalysisState()
    navigate('/analysis/spaces', {
      replace: true,
      state: floorPlanPreviewUrl ? { floorPlanPreviewUrl } : undefined,
    })
  }, [analysisState, navigate])

  useEffect(() => {
    if (!requestId) {
      setIsAnalyzing(false)
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return undefined
    }

    if (!analysisState) {
      setIsAnalyzing(false)
      setErrorMessage('분석할 평면도 파일을 찾을 수 없습니다. 평면도를 다시 업로드해 주세요.')
      return undefined
    }

    let active = true

    // StrictMode의 첫 effect 정리 전에 실제 POST가 시작되지 않도록 다음 task에서 실행합니다.
    const startTimer = window.setTimeout(() => {
      if (!active) return

      setIsAnalyzing(true)
      setErrorMessage('')

      const analyze = analysisState.mode === 'storage'
        ? recoveredStorageState && attempt === 0
          ? getAnalysis(requestId)
          : scanStoredFloorPlan(requestId, analysisState.floorPlanVariantId)
        : scanFloorPlan(requestId, analysisState.floorPlanFile)

      void analyze
        .then((analysis) => {
          if (!active) return

          if (analysis.status === 'COMPLETED') {
            moveToSpaceResults()
            return
          }

          setIsAnalyzing(false)
          setErrorMessage(
            analysis.status === 'FAILED'
              ? '평면도 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.'
              : '평면도 분석 요청이 아직 처리 대기 상태입니다. 잠시 후 다시 시도해 주세요.',
          )
        })
        .catch(async (error: unknown) => {
          if (!active) return
          if (analysisState.mode === 'storage') {
            try {
              const current = await getAnalysis(requestId)
              if (!active) return
              if (current.status === 'COMPLETED') {
                moveToSpaceResults()
                return
              }
              if (current.status === 'FAILED') {
                setIsAnalyzing(false)
                setErrorMessage('평면도 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.')
                return
              }
            } catch { /* 원래 Storage 분석 오류를 표시합니다. */ }
          }
          setIsAnalyzing(false)
          setErrorMessage(getScanErrorMessage(error))
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(startTimer)
    }
  }, [analysisState, attempt, moveToSpaceResults, recoveredStorageState, requestId])

  const handleFooterAction = () => {
    if (!requestId) {
      navigate('/analysis/new/property', { replace: true })
      return
    }

    if (!analysisState) {
      navigate('/upload', { replace: true })
      return
    }

    setAttempt((current) => current + 1)
  }

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
            {isAnalyzing ? '평면도를 분석하고 있어요' : '평면도 분석을 완료하지 못했어요'}
          </h1>
          <p className="mt-4 break-keep text-[14px] leading-5 text-[#64748b]">
            {isAnalyzing
              ? '업로드한 평면도의 공간 정보를 불러오고 있습니다.'
              : errorMessage}
          </p>
        </section>

        <section
          role={errorMessage ? 'alert' : 'status'}
          aria-live="polite"
          className="mt-[34px] flex h-[300px] shrink-0 flex-col items-center rounded-[12px] border border-[#dbeafe] bg-[#f8fafc]"
        >
          {errorMessage ? <span className="sr-only">{errorMessage}</span> : null}
          <div
            aria-hidden="true"
            className="relative mt-6 h-[110px] w-[180px] shrink-0 border-2 border-[#94a3b8] bg-white"
          >
            <span className="absolute left-[88px] top-0 h-full w-0.5 bg-[#94a3b8]" />
            <span className="absolute left-[88px] top-[58px] h-0.5 w-[90px] bg-[#94a3b8]" />
          </div>

          {isAnalyzing ? (
            <img
              src={analysisSpinner}
              alt=""
              className="mt-6 size-12 shrink-0 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <div aria-hidden="true" className="mt-6 flex size-12 items-center justify-center rounded-full bg-[#fee2e2] text-[24px] font-bold text-[#dc2626]">
              !
            </div>
          )}

          <p className="mt-6 text-center text-[14px] font-medium leading-5 text-[#475569]">
            {isAnalyzing ? '잠시만 기다려주세요.' : '입력한 정보는 유지되며 다시 시도할 수 있습니다.'}
          </p>
        </section>
      </main>

      <footer className="shrink-0 bg-white px-4 pb-[calc(19px+env(safe-area-inset-bottom))]">
        <Button
          type="button"
          disabled={isAnalyzing}
          onClick={handleFooterAction}
          className={`h-12 w-full !rounded-[8px] !border !px-4 !py-0 !text-[14px] !font-bold !opacity-100 !shadow-none ${
            isAnalyzing
              ? '!border-[#cbd5e1] !bg-[#cbd5e1]'
              : '!border-[#2563eb] !bg-[#2563eb]'
          }`}
        >
          {isAnalyzing
            ? '분석 중'
            : !requestId
              ? '처음부터 다시 시작'
            : !analysisState
                ? '평면도 다시 업로드'
                : '다시 시도'}
        </Button>
      </footer>
    </UserScreenShell>
  )
}
