import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import simulationSpinner from '@/assets/user/icons/simulation-spinner.svg'
import simulationUploadPreview from '@/assets/user/images/simulation-upload-preview.png'
import { generateInteriorImages, getInteriorImageGenerationErrorMessage } from '@/api/analysisApi'

import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

import { interiorStyleOptions } from '@/mocks/interiorStyles'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'
import { getActiveRequestId } from '@/utils/requestFlow'
import { saveSimulationResult } from '@/utils/simulationResult'

function getRouteString(state: unknown, key: string) {
  if (typeof state !== 'object' || state === null) return null
  const value = Reflect.get(state, key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export default function SimulationGeneratingPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [generationAttempt, setGenerationAttempt] = useState(0)
  const [isGenerating, setIsGenerating] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const routeStyleId = getRouteString(state, 'styleId')
  const uploadedImagePath = getRouteString(state, 'uploadedImagePath')
  const uploadedImageUrl = uploadedImagePath ? resolveApiAssetUrl(uploadedImagePath) : null
  const requestId = getActiveRequestId()
  const selectedStyle =
    interiorStyleOptions.find((option) => option.id === routeStyleId) ?? interiorStyleOptions[0]
  const photoPreviewUrl = uploadedImageUrl ?? simulationUploadPreview
  const canGenerate = Boolean(requestId && uploadedImagePath && uploadedImageUrl)

  useEffect(() => {
    if (!requestId || !uploadedImagePath || !uploadedImageUrl) {
      setIsGenerating(false)
      setErrorMessage('업로드 이미지 또는 진행 중인 의뢰 정보를 찾을 수 없습니다.')
      return undefined
    }

    setIsGenerating(true)
    setErrorMessage('')

    // React StrictMode의 개발용 effect 재실행에서 Gemini 요청이 중복되지 않도록
    // 실제 요청은 다음 task에서 시작하고 첫 cleanup에서 취소합니다.
    let active = true
    const abortController = new AbortController()
    const startTimer = window.setTimeout(() => {
      if (!active) return
      void generateInteriorImages(requestId, {
        style: selectedStyle.name,
        referenceImageUrl: uploadedImagePath,
      }, abortController.signal)
        .then(({ imageUrls }) => {
          if (!active) return
          const afterImagePath = imageUrls.find((url) => typeof url === 'string' && url.trim())?.trim()
          const afterImageUrl = afterImagePath ? resolveApiAssetUrl(afterImagePath) : null
          if (!afterImagePath || !afterImageUrl) throw new Error('AI 생성 이미지 결과를 확인할 수 없습니다.')
          const result = {
            requestId,
            styleId: selectedStyle.id,
            beforeImageUrl: uploadedImageUrl,
            afterImagePath,
            afterImageUrl,
          }
          saveSimulationResult(result)
          navigate('/analysis/simulation/result', { replace: true, state: result })
        })
        .catch((error: unknown) => {
          if (!active || abortController.signal.aborted) return
          setIsGenerating(false)
          setErrorMessage(
            error instanceof Error && !Reflect.has(error, 'kind')
              ? error.message
              : getInteriorImageGenerationErrorMessage(error),
          )
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(startTimer)
      abortController.abort()
    }
  }, [
    generationAttempt,
    navigate,
    requestId,
    selectedStyle.description,
    selectedStyle.id,
    selectedStyle.name,
    uploadedImagePath,
    uploadedImageUrl,
  ])

  const handleFooterAction = () => {
    if (canGenerate) {
      setGenerationAttempt((attempt) => attempt + 1)
    } else {
      navigate('/analysis/simulation/photo', { state: { styleId: selectedStyle.id } })
    }
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="AI 이미지 생성"
        onBack={() =>
          navigate('/analysis/simulation/photo', {
            state: {
              styleId: selectedStyle.id,
            },
          })
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          {/* 진행 단계 */}
          <AnalysisStepIndicator
            currentStep={4}
            completedContent="number"
            showDivider
          />

          {/* 페이지 제목 */}
          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">
              {isGenerating ? '선택한 스타일로 공간을 바꾸고 있어요' : '이미지를 생성하지 못했어요'}
            </h1>

            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              {isGenerating
                ? '업로드한 사진을 분석하고 인테리어 이미지를 생성하고 있습니다.'
                : '아래 안내를 확인한 후 다시 시도해 주세요.'}
            </p>
          </section>

          {/* AI 이미지 생성 중 콘텐츠 */}
          <section
            role={errorMessage ? 'alert' : 'status'}
            aria-live="polite"
            className="mt-[14px] flex min-h-[322px] flex-col items-center"
          >
            {/* 선택 스타일 */}
            <div className="flex h-11 w-[180px] items-center justify-center rounded-full bg-[#eff6ff] px-4">
              <p className="text-[13px] font-medium leading-5 text-[#2563eb]">
                선택 스타일 · {selectedStyle.name}
              </p>
            </div>

            {/* 업로드한 사진 미리보기 */}
            <img
              src={photoPreviewUrl}
              alt="업로드한 현재 집 사진"
              className="mt-5 h-[132px] w-[220px] rounded-[10px] border border-[#cbd5e1] bg-[#f1f5f9] object-cover"
            />
            {isGenerating ? (
              <>
                <span className="relative mt-[34px] flex size-14 items-center justify-center text-[#2563eb]" aria-hidden="true">
                  <img
                    src={simulationSpinner}
                    alt=""
                    className="absolute inset-0 size-14 animate-spin motion-reduce:animate-none"
                  />
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 4 5 5L7 22l-5-5Z" />
                    <path d="m14 5 5 5" />
                    <path d="M6 3v4" />
                    <path d="M4 5h4" />
                    <path d="M19 15v4" />
                    <path d="M17 17h4" />
                  </svg>
                </span>
                <p className="mt-6 text-[14px] font-medium leading-5 text-[#475569]">
                  잠시만 기다려주세요.
                </p>
              </>
            ) : (
              <p className="mt-8 max-w-[280px] break-keep text-center text-[13px] font-medium leading-5 text-[#ef4444]">
                {errorMessage}
              </p>
            )}
          </section>
        </main>

        {/* 하단 비활성 버튼 */}
        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            disabled={isGenerating}
            onClick={handleFooterAction}
            className={`h-12 w-full !rounded-[5px] !border !border-[#2563eb] !px-4 !py-0 !text-[12px] !font-bold !opacity-100 !shadow-none ${
              isGenerating
                ? '!bg-[#cbd5e1]'
                : '!bg-[#2563eb]'
            }`}
          >
            {isGenerating ? '이미지 생성 중…' : canGenerate ? '다시 시도하기' : '사진 다시 선택하기'}
          </Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
