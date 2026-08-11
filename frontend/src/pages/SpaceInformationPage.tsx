import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import floorPlanPreview from '@/assets/user/images/floor-plan-preview.png'

import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import SpaceSelectionCard from '@/components/user/SpaceSelectionCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

import {
  analyzedSpaceOptions,
  analyzedSpaceSummary,
  type SpaceOptionId,
} from '@/mocks/analysisSpaces'
import { getAnalysis, getAnalysisSpaces, replaceAnalysisSpaces, updateAnalysis } from '@/api/analysisApi'
import { getActiveRequestId } from '@/utils/requestFlow'
import type { AnalysisSpaceInput, AnalysisSpaceResponse } from '@/types/analysis'

const initialCeilingHeight =
  analyzedSpaceSummary
    .find((summary) => summary.label === '층고')
    ?.value.replace('m', '') ?? '2.3'

function createInitialSelectedSpaces() {
  return new Set<SpaceOptionId>(
    analyzedSpaceOptions
      .slice(0, 4)
      .map((option) => option.id),
  )
}

export default function SpaceInformationPage() {
  const navigate = useNavigate()

  /*
   * 최신 Figma 기준:
   * 거실 / 주방 / 방1 / 방2는 기본 선택 상태입니다.
   * analyzedSpaceOptions의 앞 4개가 해당 공간입니다.
   */
  const [selectedSpaceIds, setSelectedSpaceIds] =
    useState<ReadonlySet<SpaceOptionId>>(
      createInitialSelectedSpaces,
    )

  const [ceilingHeight, setCeilingHeight] =
    useState(initialCeilingHeight)

  const [isEditingCeilingHeight, setIsEditingCeilingHeight] =
    useState(false)
  const [spaces, setSpaces] = useState<AnalysisSpaceResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    const requestId = getActiveRequestId()
    if (!requestId) return
    let active = true
    setLoading(true)
    Promise.all([getAnalysis(requestId), getAnalysisSpaces(requestId)])
      .then(([analysis, liveSpaces]) => {
        if (!active) return
        setSpaces(liveSpaces)
        setSelectedSpaceIds(new Set(analyzedSpaceOptions
          .filter((option) => liveSpaces.some((space) => space.spaceName === option.name && space.selectedForConstruction))
          .map((option) => option.id)))
        if (analysis.ceilingHeightM != null) setCeilingHeight(String(analysis.ceilingHeightM))
      })
      .catch((error) => { if (active) setApiError(error instanceof Error ? error.message : '공간 정보를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const canContinue = selectedSpaceIds.size > 0

  const toggleSpace = (id: SpaceOptionId) => {
    setSelectedSpaceIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!canContinue) {
      return
    }

    /*
     * 현재는 UI 수정 단계이므로
     * 별도 백엔드 요청 없이 다음 스타일 선택 화면으로 이동합니다.
     */
    const requestId = getActiveRequestId()
    if (!requestId) {
      navigate('/analysis/style')
      return
    }

    setSaving(true)
    setApiError('')
    try {
      const sourceSpaces: AnalysisSpaceInput[] = spaces.length ? spaces : analyzedSpaceOptions.map((option) => ({
        spaceName: option.name,
        selectedForConstruction: selectedSpaceIds.has(option.id),
      }))
      await Promise.all([
        replaceAnalysisSpaces(requestId, sourceSpaces.map((space) => ({
          spaceName: space.spaceName,
          spaceAreaM2: space.spaceAreaM2,
          floorAreaM2: space.floorAreaM2,
          wallpaperAreaM2: space.wallpaperAreaM2,
          selectedForConstruction: analyzedSpaceOptions.some((option) => option.name === space.spaceName && selectedSpaceIds.has(option.id)),
        }))),
        updateAnalysis(requestId, { ceilingHeightM: Number(ceilingHeight) }),
      ])
      navigate('/analysis/style')
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '공간 정보 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="공간 정보 확인 및 수정"
        onBack={() => navigate(-1)}
      />

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit}
      >
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px] pb-[120px]">
          {/* 진행 단계 */}
          <AnalysisStepIndicator
            currentStep={3}
            completedContent="number"
            showDivider
          />

          {/* 페이지 제목 */}
          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">
              분석된 공간 정보를 확인해주세요
            </h1>

            <p className="mt-2 text-[10px] leading-[17px] text-[#657187]">
              AI 분석 결과를 확인하고 층고를 수정할 수 있습니다.
            </p>
          </section>

          {/* 평면도 + 공간 정보 */}
          <section className="mt-[17px] grid grid-cols-[176px_minmax(0,1fr)] items-start gap-2">
            {/* 평면도 */}
            <img
              src={floorPlanPreview}
              alt="거실, 방 2개, 주방, 발코니와 욕실이 표시된 분석 평면도"
              className="h-[322px] w-[176px] border-[3px] border-[#777] bg-[#fafafa] object-cover"
            />

            {/* 공간 정보 카드 */}
            <div className="h-[248px] overflow-hidden rounded-[7px] border border-[#d5dfed] bg-white">
              <h2 className="flex h-7 items-center px-[7px] text-[11px] font-bold text-[#1e293b]">
                공간 정보
              </h2>

              <dl>
                {analyzedSpaceSummary.map((summary) => {
                  const isCeilingHeight =
                    summary.label === '층고'

                  return (
                    <div
                      key={summary.id}
                      className="grid h-11 grid-cols-[minmax(0,1fr)_47px] items-center gap-1 px-[7px]"
                    >
                      <div className="grid min-w-0 grid-cols-[55px_minmax(0,1fr)] items-center gap-[2px]">
                        <dt className="truncate text-[10px] leading-4 text-[#475569]">
                          {summary.label}
                        </dt>

                        <dd className="min-w-0 text-[10px] font-bold leading-4 text-[#1e293b]">
                          {isCeilingHeight &&
                          isEditingCeilingHeight ? (
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                value={ceilingHeight}
                                aria-label="층고"
                                className="h-7 w-[45px] rounded-[4px] border border-[#93c5fd] bg-white px-1 text-right text-[10px] font-bold text-[#1e293b] outline-none focus:border-[#2563eb]"
                                onChange={(event) =>
                                  setCeilingHeight(
                                    event.target.value,
                                  )
                                }
                              />

                              <span className="ml-0.5">
                                m
                              </span>
                            </div>
                          ) : (
                            <span className="whitespace-nowrap">
                              {isCeilingHeight
                                ? `${ceilingHeight}m`
                                : summary.value}
                            </span>
                          )}
                        </dd>
                      </div>

                      {/* 최신 기획: 층고만 수정 가능 */}
                      {isCeilingHeight ? (
                        <button
                          type="button"
                          className="h-5 rounded-[4px] border border-[#2563eb] bg-white text-[10px] leading-4 text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb]"
                          onClick={() =>
                            setIsEditingCeilingHeight(
                              (current) => !current,
                            )
                          }
                        >
                          {isEditingCeilingHeight
                            ? '완료'
                            : '수정'}
                        </button>
                      ) : (
                        <span aria-hidden="true" />
                      )}
                    </div>
                  )
                })}
              </dl>
            </div>
          </section>

          {/* 인테리어 공간 선택 */}
          <fieldset
            aria-describedby={
              canContinue
                ? 'space-selection-help'
                : 'space-selection-help space-selection-error'
            }
            className="mx-[5px] mt-[22px] min-w-0 border-0 p-0"
          >
            <legend className="text-[18px] font-bold leading-[26px] text-[#0f172a]">
              인테리어할 공간을 선택해주세요
            </legend>

            <p
              id="space-selection-help"
              className="mt-1 text-[12px] leading-[18px] text-[#475569]"
            >
              인테리어를 원하는 공간을 여러 개 선택할 수 있습니다.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {analyzedSpaceOptions.map((option) => (
                <SpaceSelectionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedSpaceIds.has(
                    option.id,
                  )}
                  onToggle={toggleSpace}
                />
              ))}
            </div>

            <p className="mt-2 text-[11px] leading-4 text-[#64748b]">
              복수 선택 가능
            </p>

            {!canContinue ? (
              <p
                id="space-selection-error"
                role="alert"
                className="mt-1 min-h-4 text-[11px] leading-4 text-[#ef4444]"
              >
                인테리어할 공간을 1개 이상 선택해주세요.
              </p>
            ) : null}
          </fieldset>
          {apiError ? <p role="alert" className="mx-[5px] mt-3 text-[11px] font-semibold text-[#dc2626]">{apiError}</p> : null}
        </main>

        {/* 하단 고정 버튼 */}
        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!canContinue || loading || saving}
            className={`h-12 w-full !rounded-[5px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              canContinue
                ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]'
                : '!border-[#cbd5e1] !bg-[#cbd5e1] !opacity-100'
            }`}
          >
            {saving ? '저장 중...' : '다음'}
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
