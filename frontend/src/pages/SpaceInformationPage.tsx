import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import FloorPlanPreviewTabs from '@/components/user/FloorPlanPreviewTabs'
import SpaceSelectionCard from '@/components/user/SpaceSelectionCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { getAnalysis, getAnalysisSpaces, replaceAnalysisSpaces, updateAnalysis } from '@/api/analysisApi'
import { getActiveRequestId } from '@/utils/requestFlow'
import { formatSpaceArea, sumSelectedSpaceAreaM2 } from '@/utils/spaceArea'
import type { AnalysisJobResponse, AnalysisSpaceInput, AnalysisSpaceResponse } from '@/types/analysis'

function getFloorPlanPreviewUrl(state: unknown) {
  if (typeof state !== 'object' || state === null) return null
  const value = Reflect.get(state, 'floorPlanPreviewUrl')
  return typeof value === 'string' && value.trim() ? value : null
}

function createSummary(analysis: AnalysisJobResponse | null, ceilingHeight: string) {
  return [
    { id: 'rooms', label: '방 개수', value: analysis?.roomCount == null ? '-' : `${analysis.roomCount}개` },
    { id: 'bathrooms', label: '욕실 개수', value: analysis?.bathroomCount == null ? '-' : `${analysis.bathroomCount}개` },
    { id: 'balcony', label: '발코니', value: analysis?.hasBalcony == null ? '-' : analysis.hasBalcony ? '있음' : '없음' },
    { id: 'kitchen', label: '주방 형태', value: analysis?.kitchenType?.trim() || '-' },
    { id: 'ceiling-height', label: '층고', value: ceilingHeight ? `${ceilingHeight}m` : '-' },
  ] as const
}

export default function SpaceInformationPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const floorPlanPreviewUrl = useMemo(() => getFloorPlanPreviewUrl(state), [state])
  const requestId = getActiveRequestId()
  const [analysis, setAnalysis] = useState<AnalysisJobResponse | null>(null)
  const [ceilingHeight, setCeilingHeight] = useState('2.4')
  const [isEditingCeilingHeight, setIsEditingCeilingHeight] = useState(false)
  const [spaces, setSpaces] = useState<AnalysisSpaceResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    const requestId = getActiveRequestId()
    if (!requestId) {
      setApiError('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    let active = true
    setLoading(true)
    Promise.all([getAnalysis(requestId), getAnalysisSpaces(requestId)])
      .then(([liveAnalysis, liveSpaces]) => {
        if (!active) return
        setAnalysis(liveAnalysis)
        setSpaces(liveSpaces)
        setCeilingHeight(liveAnalysis.ceilingHeightM == null ? '2.4' : String(liveAnalysis.ceilingHeightM))
      })
      .catch((error) => {
        if (active) setApiError(error instanceof Error ? error.message : '공간 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const canContinue = spaces.some((space) => space.selectedForConstruction)
  const selectedTotalAreaM2 = sumSelectedSpaceAreaM2(spaces)
  const summary = createSummary(analysis, ceilingHeight)

  const toggleSpace = (index: number) => {
    setSpaces((current) => current.map((space, spaceIndex) => (
      spaceIndex === index
        ? { ...space, selectedForConstruction: !space.selectedForConstruction }
        : space
    )))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canContinue || saving) return

    const requestId = getActiveRequestId()
    if (!requestId) {
      setApiError('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    const input: AnalysisSpaceInput[] = spaces.map((space) => ({
      spaceName: space.spaceName,
      spaceAreaM2: space.spaceAreaM2,
      floorAreaM2: space.floorAreaM2,
      wallpaperAreaM2: space.wallpaperAreaM2,
      selectedForConstruction: space.selectedForConstruction,
    }))

    setSaving(true)
    setApiError('')
    try {
      const ceilingHeightM = Number(ceilingHeight)
      await Promise.all([
        replaceAnalysisSpaces(requestId, input),
        ...(Number.isFinite(ceilingHeightM) && ceilingHeightM > 0
          ? [updateAnalysis(requestId, { ceilingHeightM })]
          : []),
      ])

      try {
        const refreshedSpaces = await getAnalysisSpaces(requestId)
        setSpaces(refreshedSpaces)
      } catch (error) {
        setApiError(error instanceof Error
          ? `공간 정보는 저장되었지만 최신 정보를 불러오지 못했습니다. ${error.message}`
          : '공간 정보는 저장되었지만 최신 정보를 불러오지 못했습니다.')
        return
      }

      navigate('/analysis/style')
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '공간 정보 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="공간 정보 확인 및 수정" onBack={() => navigate(-1)} />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px] pb-[120px]">
          <AnalysisStepIndicator currentStep={3} completedContent="number" showDivider />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">분석된 공간 정보를 확인해 주세요</h1>
            <p className="mt-2 text-[10px] leading-[17px] text-[#657187]">AI 분석 결과를 확인하고 층고를 수정할 수 있습니다.</p>
          </section>

          <section className="mt-[17px] flex flex-col gap-3">
            <FloorPlanPreviewTabs requestId={requestId} floorPlanPreviewUrl={floorPlanPreviewUrl} spaces={spaces} />

            <div role="region" aria-label="공간 정보" className="w-full overflow-hidden rounded-[7px] border border-[#d5dfed] bg-white">
              <h2 className="flex h-7 items-center px-[7px] text-[11px] font-bold text-[#1e293b]">공간 정보</h2>
              <dl className="grid grid-cols-2 px-[7px] pb-2">
                {summary.map((item) => {
                  const isCeilingHeight = item.id === 'ceiling-height'
                  return (
                    <div key={item.id} className={`grid h-11 grid-cols-[55px_minmax(0,1fr)] items-center gap-2 px-1 ${isCeilingHeight ? 'col-span-2' : ''}`}>
                      <dt className="truncate text-[10px] leading-4 text-[#475569]">{item.label}</dt>
                      <dd className={`min-w-0 text-[10px] font-bold leading-4 text-[#1e293b] ${isCeilingHeight ? 'flex items-center justify-between gap-2' : ''}`}>
                        {isCeilingHeight && isEditingCeilingHeight ? (
                          <div className="flex items-center">
                            <input type="number" min="1" max="5" step="0.1" value={ceilingHeight} aria-label="층고" className="h-7 w-[45px] rounded-[4px] border border-[#93c5fd] bg-white px-1 text-right text-[10px] font-bold text-[#1e293b] outline-none focus:border-[#2563eb]" onChange={(event) => setCeilingHeight(event.target.value)} />
                            <span className="ml-0.5">m</span>
                          </div>
                        ) : <span className="whitespace-nowrap">{item.value}</span>}
                        {isCeilingHeight ? (
                          <button type="button" className="h-5 w-[47px] shrink-0 rounded-[4px] border border-[#2563eb] bg-white text-[10px] leading-4 text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb]" onClick={() => setIsEditingCeilingHeight((current) => !current)}>
                            {isEditingCeilingHeight ? '완료' : '수정'}
                          </button>
                        ) : null}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          </section>

          <fieldset aria-describedby="space-selection-help" className="mx-[5px] mt-[22px] min-w-0 border-0 p-0">
            <legend className="text-[18px] font-bold leading-[26px] text-[#0f172a]">인테리어할 공간을 선택해 주세요</legend>
            <p id="space-selection-help" className="mt-1 text-[12px] leading-[18px] text-[#475569]">인테리어를 원하는 공간을 여러 개 선택할 수 있습니다.</p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {spaces.map((space, index) => (
                <SpaceSelectionCard
                  key={space.id ?? `${space.sortOrder ?? index}-${space.spaceName}`}
                  spaceName={space.spaceName}
                  areaM2={space.spaceAreaM2}
                  isSelected={space.selectedForConstruction}
                  onToggle={() => toggleSpace(index)}
                />
              ))}
            </div>

            {!loading && spaces.length === 0 ? <p role="status" className="mt-3 text-center text-[12px] leading-5 text-[#64748b]">분석된 공간 정보가 없습니다.</p> : null}
            <p className="mt-2 text-[11px] leading-4 text-[#64748b]">복수 선택 가능</p>

            {selectedTotalAreaM2 !== null ? (
              <p className="mt-3 flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-3 text-[12px] leading-5 text-[#475569]">
                <span>선택 공간 총 면적</span>
                <strong className="shrink-0 font-bold text-[#1e293b]">{formatSpaceArea(selectedTotalAreaM2)}</strong>
              </p>
            ) : null}

            {!loading && spaces.length > 0 && !canContinue ? <p role="alert" className="mt-1 min-h-4 text-[11px] leading-4 text-[#ef4444]">인테리어할 공간을 1개 이상 선택해 주세요.</p> : null}
          </fieldset>

          {apiError ? <p role="alert" className="mx-[5px] mt-3 text-[11px] font-semibold text-[#dc2626]">{apiError}</p> : null}
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button type="submit" disabled={!canContinue || loading || saving} className={`h-12 w-full !rounded-[5px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${canContinue && !loading ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]' : '!border-[#cbd5e1] !bg-[#cbd5e1] !opacity-100'}`}>
            {saving ? '저장 중...' : '다음'}
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
