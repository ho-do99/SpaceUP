import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import simulationSpinner from '@/assets/user/icons/simulation-spinner.svg'
import simulationUploadPreview from '@/assets/user/images/simulation-upload-preview.png'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { interiorStyleOptions } from '@/mocks/interiorStyles'

export default function SimulationGeneratingPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const routeStyleId =
    typeof state === 'object' && state !== null ? Reflect.get(state, 'styleId') : undefined
  const routePhotoFile =
    typeof state === 'object' && state !== null ? Reflect.get(state, 'photoFile') : undefined
  const selectedStyle =
    interiorStyleOptions.find((option) => option.id === routeStyleId) ?? interiorStyleOptions[0]
  const photoFile = routePhotoFile instanceof File ? routePhotoFile : null
  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : simulationUploadPreview),
    [photoFile],
  )

  useEffect(() => {
    return () => {
      if (photoFile) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    }
  }, [photoFile, photoPreviewUrl])

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="AI 이미지 생성"
        onBack={() => navigate('/analysis/simulation/photo')}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          <AnalysisStepIndicator currentStep={4} completedContent="number" showDivider />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">
              선택한 스타일로 공간을 바꾸고 있어요
            </h1>
            <p className="mt-2 break-keep text-[10px] leading-[17px] text-[#657187]">
              업로드한 사진을 분석하고 인테리어 이미지를 생성하고 있습니다.
            </p>
          </section>

          <section
            role="status"
            aria-live="polite"
            className="mt-[14px] flex min-h-[322px] flex-col items-center"
          >
            <p className="rounded-full bg-[#eff6ff] px-4 py-3 text-[12px] font-medium leading-5 text-[#2563eb]">
              선택 스타일 · {selectedStyle.name}
            </p>
            <img
              src={photoPreviewUrl}
              alt="업로드한 현재 집 사진"
              className="mt-5 h-[132px] w-[220px] rounded-[10px] object-cover"
            />
            <img
              src={simulationSpinner}
              alt=""
              className="mt-[34px] size-12 animate-spin motion-reduce:animate-none"
            />
            <p className="mt-6 text-[14px] font-medium leading-5 text-[#475569]">
              잠시만 기다려주세요.
            </p>
          </section>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            disabled
            className="h-12 w-full !rounded-[5px] !border !border-[#cbd5e1] !bg-[#cbd5e1] !px-4 !py-0 !text-[12px] !font-bold !opacity-100 !shadow-none"
          >
            이미지 생성 중…
          </Button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
