import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import cameraIcon from '@/assets/user/icons/camera.svg'
import floorPlanPreview from '@/assets/user/images/floor-plan-preview.png'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import SpaceSelectionCard from '@/components/user/SpaceSelectionCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { uploadImage } from '@/api/fileApi'
import { attachRequestImage } from '@/api/requestApi'
import { getActiveRequestId } from '@/utils/requestFlow'
import {
  analyzedSpaceOptions,
  analyzedSpaceSummary,
  type SpaceOptionId,
} from '@/mocks/analysisSpaces'

const acceptedPhotoTypes = 'image/jpeg,image/png,.jpg,.jpeg,.png'
const maximumPhotoCount = 5

export default function SpaceInformationPage() {
  const navigate = useNavigate()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<ReadonlySet<SpaceOptionId>>(
    () => new Set(),
  )
  const [photos, setPhotos] = useState<ReadonlyArray<File>>([])
  const [photoError, setPhotoError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const photoPreviews = useMemo(
    () => photos.map((photo) => URL.createObjectURL(photo)),
    [photos],
  )

  useEffect(
    () => () => {
      photoPreviews.forEach((preview) => URL.revokeObjectURL(preview))
    },
    [photoPreviews],
  )

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

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedPhotos = Array.from(event.target.files ?? [])

    if (selectedPhotos.length > maximumPhotoCount) {
      setPhotos([])
      setPhotoError('사진은 최대 5장까지 선택할 수 있습니다.')
      event.target.value = ''
      return
    }

    setPhotos(selectedPhotos)
    setPhotoError('')
  }

  const removePhoto = (photoIndex: number) => {
    setPhotos((current) => current.filter((_, index) => index !== photoIndex))
    setPhotoError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canContinue) {
      return
    }

    const requestId = getActiveRequestId()
    setIsSaving(true)
    setPhotoError('')
    try {
      if (requestId && photos.length > 0) {
        for (const photo of photos) {
          const uploaded = await uploadImage(photo)
          await attachRequestImage(requestId, {
            imageType: 'PHOTO',
            imageUrl: uploaded.imageUrl,
          })
        }
      }
      navigate('/analysis/style')
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : '공간 사진 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="공간 정보 확인 및 수정"
        onBack={() => navigate(-1)}
      />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
          <AnalysisStepIndicator
            currentStep={3}
            completedContent="number"
            showDivider
          />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">
              분석된 공간 정보를 확인해주세요
            </h1>
            <p className="mt-2 text-[10px] leading-[17px] text-[#657187]">
              AI 분석 결과를 확인하고 수정할 수 있습니다.
            </p>
          </section>

          <section className="mt-[17px] grid grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] items-start gap-2">
            <img
              src={floorPlanPreview}
              alt="거실, 방 2개, 주방, 발코니와 욕실이 표시된 분석 평면도"
              className="aspect-[176/322] w-full border-[3px] border-[#777] bg-[#fafafa] object-cover"
            />

            <div className="overflow-hidden rounded-[7px] border border-[#d5dfed] bg-white">
              <h2 className="flex h-7 items-center px-2 text-[10px] font-bold text-[#15284c]">
                공간 정보
              </h2>
              <dl>
                {analyzedSpaceSummary.map((summary) => (
                  <div
                    key={summary.id}
                    className="grid h-11 grid-cols-[minmax(0,1fr)_47px] items-center gap-1 px-2"
                  >
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
                      <dt className="truncate text-[10px] leading-4 text-[#64748b]">
                        {summary.label}
                      </dt>
                      <dd className="whitespace-nowrap text-[10px] font-bold leading-4 text-[#1e293b]">
                        {summary.value}
                      </dd>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="h-5 rounded-[4px] border border-[#2563eb] bg-white text-[10px] leading-4 text-[#2563eb] disabled:cursor-default disabled:opacity-100"
                    >
                      수정
                    </button>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <fieldset
            aria-describedby={
              canContinue ? 'space-selection-help' : 'space-selection-help space-selection-error'
            }
            className="mx-[5px] mt-[22px] min-w-0 border-0 p-0"
          >
            <legend className="text-[18px] font-bold leading-[26px] text-[#15284c]">
              인테리어할 공간을 선택해주세요
            </legend>
            <p id="space-selection-help" className="mt-1 text-[12px] leading-[18px] text-[#64748b]">
              인테리어를 원하는 공간을 여러 개 선택할 수 있습니다.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {analyzedSpaceOptions.map((option) => (
                <SpaceSelectionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedSpaceIds.has(option.id)}
                  onToggle={toggleSpace}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#64748b]">복수 선택 가능</p>
            {!canContinue && (
              <p
                id="space-selection-error"
                role="alert"
                className="mt-1 min-h-4 text-[11px] leading-4 text-[#ef4444]"
              >
                인테리어할 공간을 1개 이상 선택해주세요.
              </p>
            )}
          </fieldset>

          <section className="mt-[22px] pb-6" aria-labelledby="space-photo-heading">
            <h2 id="space-photo-heading" className="text-[15px] font-bold leading-[22px] text-[#1e293b]">
              공간 사진 추가 <span className="text-[12px] font-normal text-[#64748b]">(선택)</span>
            </h2>
            <p className="mt-1 break-keep text-[11px] leading-[18px] text-[#64748b]">
              현재 공간 사진을 추가하면 시공업체에서 더 정확하게 확인할 수 있어요.
            </p>

            <input
              ref={photoInputRef}
              id="space-photos"
              type="file"
              accept={acceptedPhotoTypes}
              multiple
              className="sr-only"
              aria-label="공간 사진 선택"
              aria-describedby="space-photo-help space-photo-error"
              onChange={handlePhotoChange}
            />

            {photos.length === 0 ? (
              <button
                type="button"
                className="mt-3 flex h-[104px] w-full flex-col items-center justify-center rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                onClick={() => photoInputRef.current?.click()}
              >
                <img src={cameraIcon} alt="" className="size-6" />
                <span className="mt-1 text-[12px] font-bold leading-[18px] text-[#2563eb]">
                  사진 추가
                </span>
                <span className="mt-0.5 text-[10px] leading-[15px] text-[#64748b]">
                  JPG, PNG / 최대 5장
                </span>
              </button>
            ) : (
              <div className="mt-3 flex min-h-[104px] flex-wrap items-center gap-2 rounded-[10px] border border-[#d5dfed] bg-white p-3">
                {photoPreviews.map((preview, index) => (
                  <div key={preview} className="relative size-16 overflow-hidden rounded-[6px] bg-[#f1f5f9]">
                    <img src={preview} alt={`추가한 공간 사진 ${index + 1}`} className="size-full object-cover" />
                    <button
                      type="button"
                      aria-label={`공간 사진 ${index + 1} 삭제`}
                      className="absolute right-0 top-0 flex size-[18px] items-center justify-center rounded-bl bg-[#1e293b]/80 text-[14px] leading-none text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < maximumPhotoCount && (
                  <button
                    type="button"
                    className="flex size-16 flex-col items-center justify-center rounded-[6px] border border-dashed border-[#cbd5e1] text-[11px] leading-[14px] text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <span className="text-[18px] leading-5">＋</span>
                    {photos.length}/5
                  </button>
                )}
              </div>
            )}

            <p id="space-photo-help" className="mt-2 text-[10px] leading-[15px] text-[#64748b]">
              사진 없이도 다음 단계로 진행할 수 있습니다.
            </p>
            <p id="space-photo-error" role="alert" className="mt-1 min-h-[15px] text-[10px] leading-[15px] text-[#ef4444]">
              {photoError}
            </p>
          </section>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!canContinue || isSaving}
            isLoading={isSaving}
            className={`h-12 w-full !rounded-[5px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              canContinue
                ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]'
                : '!border-[#cbd5e1] !bg-[#cbd5e1] !opacity-100'
            }`}
          >
            다음
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
