import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import StyleOptionCard from '@/components/user/StyleOptionCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

import {
  interiorStyleOptions,
  type InteriorStyleId,
} from '@/mocks/interiorStyles'

import { saveMaterialTheme } from '@/utils/materialTheme'

export default function StyleSelectionPage() {
  const navigate = useNavigate()

  /*
   * 최신 Figma 기준:
   * 첫 진입 시 첫 번째 스타일인 '모던'을 기본 선택합니다.
   */
  const [selectedStyle, setSelectedStyle] =
    useState<InteriorStyleId | null>(
      () => interiorStyleOptions[0]?.id ?? null,
    )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedStyle) {
      return
    }

    saveMaterialTheme(selectedStyle)

    navigate('/analysis/simulation/photo', {
      state: {
        styleId: selectedStyle,
      },
    })
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="인테리어 스타일 선택"
        onBack={() => navigate(-1)}
      />

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit}
      >
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          {/* 진행 단계 */}
          <AnalysisStepIndicator
            currentStep={4}
            completedContent="number"
            showDivider
          />

          {/* 페이지 제목 */}
          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[24px] text-[#15284c]">
              원하는 인테리어 스타일을 선택해주세요.
            </h1>

            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              현재 집 사진을 선택한 스타일로 미리 바꿔볼 수 있어요.
            </p>
          </section>

          {/* 스타일 선택 */}
          <fieldset className="mt-[17px] border-0 p-0 pb-6">
            <legend className="sr-only">
              인테리어 스타일
            </legend>

            <div className="grid grid-cols-2 gap-3">
              {interiorStyleOptions.map((option) => (
                <StyleOptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedStyle === option.id}
                  onChange={setSelectedStyle}
                />
              ))}
            </div>
          </fieldset>
        </main>

        {/* 하단 고정 버튼 */}
        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!selectedStyle}
            className={`h-12 w-full !rounded-[5px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              selectedStyle
                ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]'
                : '!border-[#cbd5e1] !bg-[#cbd5e1] !opacity-100'
            }`}
          >
            사진 업로드하기
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}