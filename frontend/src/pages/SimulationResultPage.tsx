import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { generateInteriorImages, getInteriorImageGenerationErrorMessage } from '@/api/analysisApi'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import BeforeAfterComparison from '@/components/user/BeforeAfterComparison'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { interiorStyleOptions, type InteriorStyleId } from '@/mocks/interiorStyles'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'
import { saveMaterialTheme } from '@/utils/materialTheme'
import {
  getSimulationGenerationContext,
  getSimulationResult,
  parseSimulationResult,
  saveSimulationGenerationContext,
  saveSimulationResult,
} from '@/utils/simulationResult'

const resultStyleOrder: readonly InteriorStyleId[] = ['marble', 'wood', 'white', 'modern']

function extractStoredImagePath(imageUrl: string) {
  const prefix = '/api/files/images/'
  const prefixIndex = imageUrl.indexOf(prefix)
  return prefixIndex >= 0 ? imageUrl.slice(prefixIndex) : null
}

export default function SimulationResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialResult = useMemo(
    () => parseSimulationResult(state) ?? getSimulationResult(),
    [state],
  )
  const [result, setResult] = useState(initialResult)
  const [selectedStyleId, setSelectedStyleId] = useState<InteriorStyleId>(() => {
    const savedStyle = initialResult?.styleId
    return interiorStyleOptions.some((option) => option.id === savedStyle)
      ? savedStyle as InteriorStyleId
      : interiorStyleOptions[0].id
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const generationAbortRef = useRef<AbortController | null>(null)
  const selectedStyle =
    interiorStyleOptions.find((option) => option.id === selectedStyleId) ?? interiorStyleOptions[0]
  const selectableStyles = resultStyleOrder.map((styleId) =>
    interiorStyleOptions.find((option) => option.id === styleId),
  ).filter((option): option is (typeof interiorStyleOptions)[number] => Boolean(option))

  useEffect(() => {
    if (!initialResult) {
      navigate('/analysis/simulation/photo', { replace: true })
    }
  }, [initialResult, navigate])

  useEffect(() => () => generationAbortRef.current?.abort(), [])

  const regenerateAfterImage = async (nextStyleId: InteriorStyleId) => {
    if (!result || isGenerating || nextStyleId === result.styleId) {
      setSelectedStyleId((result?.styleId as InteriorStyleId | undefined) ?? nextStyleId)
      return
    }

    const nextStyle = interiorStyleOptions.find((option) => option.id === nextStyleId)
    if (!nextStyle) return
    const context = getSimulationGenerationContext()
    const uploadedImagePath = context?.requestId === result.requestId
      ? context.uploadedImagePath
      : extractStoredImagePath(result.beforeImageUrl)
    if (!uploadedImagePath) {
      setSelectedStyleId(result.styleId as InteriorStyleId)
      setGenerationError('원본 사진 정보를 확인할 수 없습니다. 사진을 다시 선택해 주세요.')
      return
    }

    setSelectedStyleId(nextStyleId)
    setIsGenerating(true)
    setGenerationError('')
    const abortController = new AbortController()
    generationAbortRef.current = abortController
    try {
      const generated = await generateInteriorImages(result.requestId, {
        style: nextStyle.name,
        referenceImageUrl: uploadedImagePath,
      }, abortController.signal)
      const afterImagePath = generated.imageUrls.find((url) => typeof url === 'string' && url.trim())?.trim()
      const afterImageUrl = afterImagePath ? resolveApiAssetUrl(afterImagePath) : null
      if (!afterImagePath || !afterImageUrl) throw new Error('새 스타일 이미지 결과를 확인할 수 없습니다.')

      const nextResult = { ...result, styleId: nextStyleId, afterImagePath, afterImageUrl }
      setResult(nextResult)
      saveSimulationResult(nextResult)
      saveSimulationGenerationContext({
        requestId: result.requestId,
        styleId: nextStyleId,
        uploadedImagePath,
        uploadedImageUrl: result.beforeImageUrl,
      })
      saveMaterialTheme(nextStyleId)
    } catch (error) {
      if (abortController.signal.aborted) return
      setSelectedStyleId(result.styleId as InteriorStyleId)
      setGenerationError(
        error instanceof Error && !Reflect.has(error, 'kind')
          ? error.message
          : getInteriorImageGenerationErrorMessage(error),
      )
    } finally {
      if (!abortController.signal.aborted) setIsGenerating(false)
    }
  }

  if (!result) return null

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="AI 인테리어 시뮬레이션 결과"
        onBack={() => navigate('/analysis/simulation/photo', { state: { styleId: selectedStyle.id } })}
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
            <div className="relative mx-auto w-[184px]">
              <label htmlFor="simulation-result-style" className="sr-only">AI 인테리어 스타일 선택</label>
              <select
                id="simulation-result-style"
                aria-label="AI 인테리어 스타일 선택"
                value={selectedStyleId}
                disabled={isGenerating}
                onChange={(event) => { void regenerateAfterImage(event.target.value as InteriorStyleId) }}
                className="h-10 w-full appearance-none rounded-full border border-[#dbeafe] bg-[#eff6ff] pl-4 pr-9 text-center text-[12px] font-medium text-[#2563eb] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe] disabled:cursor-wait disabled:opacity-70"
              >
                {selectableStyles.map((style) => <option key={style.id} value={style.id}>선택 스타일 · {style.name}</option>)}
              </select>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#2563eb]">
                <path d="m6 8 4 4 4-4" />
              </svg>
            </div>
            {generationError ? <p role="alert" className="mx-auto mt-3 max-w-[300px] break-keep text-center text-[11px] leading-4 text-[#ef4444]">{generationError}</p> : null}
            <div className="mt-4">
              <BeforeAfterComparison
                beforeImageUrl={result.beforeImageUrl}
                afterImageUrl={result.afterImageUrl}
                styleName={selectedStyle.name}
                afterLoading={isGenerating}
              />
            </div>
          </section>
        </main>

        <footer className="grid shrink-0 grid-cols-[1fr_1.03fr] gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            disabled={isGenerating}
            variant="outline"
            className="h-12 w-full !rounded-[5px] !border-[#2563eb] !bg-white !px-2 !py-0 !text-[12px] !font-semibold !text-[#2563eb] !shadow-none hover:!translate-y-0 hover:!bg-white hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            onClick={() => navigate('/analysis/simulation/photo', { state: { styleId: selectedStyle.id } })}
          >
            다시 생성하기
          </Button>
          <Button
            type="button"
            disabled={isGenerating}
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[12px] !font-semibold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            onClick={() => navigate('/estimate/summary')}
          >
            {isGenerating ? '새 스타일 생성 중…' : '이 스타일로 결정하기'}
          </Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
