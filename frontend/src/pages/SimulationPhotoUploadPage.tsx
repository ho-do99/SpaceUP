import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getImageUploadErrorMessage } from '@/api/fileApi'
import { deleteRequestImage } from '@/api/requestApi'
import simulationImageUploadIcon from '@/assets/user/icons/simulation-image-upload.svg'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { interiorStyleOptions } from '@/mocks/interiorStyles'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'
import { getActiveRequestId } from '@/utils/requestFlow'
import { uploadAndAttachRequestImage, type LinkedRequestImage } from '@/utils/requestImageFlow'
import { clearSimulationResult, saveSimulationGenerationContext } from '@/utils/simulationResult'

const acceptedImageTypes = ['image/jpeg', 'image/png']
const maximumImageSize = 10 * 1024 * 1024
const maximumPhotoCount = 5

interface UploadedPhoto {
  file: File
  linkedImage: LinkedRequestImage
  previewUrl: string
}

function validateSimulationImage(file: File) {
  if (!acceptedImageTypes.includes(file.type)) return 'JPG 또는 PNG 파일만 업로드할 수 있습니다.'
  if (file.size > maximumImageSize) return '이미지 파일은 최대 10MB까지 업로드할 수 있습니다.'
  return ''
}

export default function SimulationPhotoUploadPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const photosRef = useRef<UploadedPhoto[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const routeStyleId = typeof state === 'object' && state !== null ? Reflect.get(state, 'styleId') : undefined
  const selectedStyle = interiorStyleOptions.find((option) => option.id === routeStyleId) ?? interiorStyleOptions[0]

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => {
    abortControllerRef.current?.abort()
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
  }, [])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selectedFiles.length === 0) return

    const availableCount = maximumPhotoCount - photos.length
    if (availableCount <= 0) {
      setErrorMessage(`사진은 최대 ${maximumPhotoCount}장까지 추가할 수 있습니다.`)
      return
    }

    const files = selectedFiles.slice(0, availableCount)
    const invalidMessage = files.map(validateSimulationImage).find(Boolean)
    if (invalidMessage) {
      setErrorMessage(invalidMessage)
      return
    }

    const requestId = getActiveRequestId()
    if (!requestId) {
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setErrorMessage(selectedFiles.length > availableCount ? `최대 ${maximumPhotoCount}장까지만 추가했습니다.` : '')
    setIsUploading(true)

    const uploaded: UploadedPhoto[] = []
    try {
      for (const file of files) {
        const linkedImage = await uploadAndAttachRequestImage(requestId, file, 'PHOTO', abortController.signal)
        uploaded.push({ file, linkedImage, previewUrl: URL.createObjectURL(file) })
      }
      setPhotos((current) => [...current, ...uploaded])
    } catch (error) {
      await Promise.all(uploaded.map(async (photo) => {
        URL.revokeObjectURL(photo.previewUrl)
        await deleteRequestImage(requestId, photo.linkedImage.id).catch(() => undefined)
      }))
      if (!abortController.signal.aborted) setErrorMessage(getImageUploadErrorMessage(error))
    } finally {
      if (!abortController.signal.aborted) setIsUploading(false)
      if (abortControllerRef.current === abortController) abortControllerRef.current = null
    }
  }

  const handleDelete = async (photo: UploadedPhoto) => {
    if (isUploading) return
    const requestId = getActiveRequestId()
    if (!requestId) {
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    setIsUploading(true)
    setErrorMessage('')
    try {
      await deleteRequestImage(requestId, photo.linkedImage.id)
      URL.revokeObjectURL(photo.previewUrl)
      setPhotos((current) => current.filter((item) => item.linkedImage.id !== photo.linkedImage.id))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '이미지 삭제에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const primaryPhoto = photos[0]
    if (!primaryPhoto || isUploading) return
    const requestId = getActiveRequestId()
    if (!requestId) {
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    clearSimulationResult()
    const uploadedImageUrl = resolveApiAssetUrl(primaryPhoto.linkedImage.imageUrl)
    if (!uploadedImageUrl) {
      setErrorMessage('서버 응답을 확인할 수 없습니다.')
      return
    }

    saveSimulationGenerationContext({
      requestId,
      styleId: selectedStyle.id,
      uploadedImagePath: primaryPhoto.linkedImage.imageUrl,
      uploadedImageUrl,
    })
    navigate('/analysis/simulation/generating', {
      state: { styleId: selectedStyle.id, uploadedImagePath: primaryPhoto.linkedImage.imageUrl, uploadedImageUrl },
    })
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="현재 집 사진 업로드" onBack={() => navigate('/analysis/style')} />
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          <AnalysisStepIndicator currentStep={4} completedContent="number" showDivider />
          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">현재 집 사진을 업로드해주세요.</h1>
            <p className="mx-auto mt-2 max-w-[285px] break-keep text-[10px] leading-[17px] text-[#657187]">
              여러 각도의 사진을 최대 {maximumPhotoCount}장까지 추가할 수 있습니다.<br />첫 번째 사진을 기준으로 AI 이미지를 생성합니다.
            </p>
          </section>

          <section className="mt-[18px] pb-6">
            <div className="flex h-14 items-center gap-2 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4">
              <span className="text-[12px] font-medium leading-5 text-[#2563eb]">선택 스타일</span>
              <strong className="text-[14px] font-bold leading-5 text-[#0f172a]">· {selectedStyle.name}</strong>
            </div>

            <input ref={fileInputRef} id="simulation-photo" type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="sr-only" aria-label="현재 집 사진 선택" onChange={handleFileChange} />
            <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" aria-label="카메라로 현재 집 사진 촬영" onChange={handleFileChange} />

            {photos.length === 0 ? (
              <div className="mt-4 flex h-[252px] w-full flex-col items-center rounded-[12px] border border-dashed border-[#bfdbfe] bg-[#f8fafc]">
                <img src={simulationImageUploadIcon} alt="" className="mt-[33px] size-9" />
                <p className="mt-4 text-[15px] font-medium leading-5 text-[#0f172a]">현재 집 사진을 선택해주세요</p>
                <p className="mt-[10px] text-[12px] leading-5 text-[#64748b]">JPG, PNG · 장당 최대 10MB</p>
                <div className="mt-[20px] grid w-full max-w-[238px] grid-cols-2 gap-2 px-2">
                  <button type="button" disabled={isUploading} className="flex h-10 items-center justify-center rounded-[8px] bg-[#eff6ff] text-[13px] font-medium text-[#2563eb] disabled:opacity-60" onClick={() => fileInputRef.current?.click()}>사진 선택</button>
                  <button type="button" disabled={isUploading} className="flex h-10 items-center justify-center rounded-[8px] bg-[#2563eb] text-[13px] font-medium text-white disabled:opacity-60" onClick={() => cameraInputRef.current?.click()}>사진 촬영</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[12px] border border-[#bfdbfe] bg-white p-3">
                <div className="grid grid-cols-2 gap-3" aria-label="업로드한 집 사진">
                  {photos.map((photo, index) => (
                    <article key={photo.linkedImage.id} className="min-w-0">
                      <div className="relative overflow-hidden rounded-[9px] bg-[#f8fafc]">
                        <img src={photo.previewUrl} alt={`업로드한 현재 집 사진 ${index + 1}`} className="h-[128px] w-full object-cover" />
                        {index === 0 ? <span className="absolute left-2 top-2 rounded-full bg-[#2563eb] px-2 py-1 text-[9px] font-bold text-white">AI 기준</span> : null}
                        <button type="button" aria-label={`${photo.file.name} 삭제`} disabled={isUploading} className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-[#0f172a]/70 text-[18px] leading-none text-white disabled:opacity-60" onClick={() => void handleDelete(photo)}>×</button>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-[#475569]">{photo.file.name}</p>
                    </article>
                  ))}
                </div>

                <button type="button" disabled={isUploading || photos.length >= maximumPhotoCount} className="mt-4 flex h-10 w-full items-center justify-center rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] text-[12px] font-bold text-[#2563eb] disabled:cursor-default disabled:opacity-50" onClick={() => fileInputRef.current?.click()}>
                  + 사진 추가 ({photos.length}/{maximumPhotoCount})
                </button>
              </div>
            )}

            <p role="alert" className="mt-2 min-h-[17px] text-center text-[10px] leading-[17px] text-[#ef4444]">{errorMessage}</p>
          </section>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button type="submit" disabled={photos.length === 0 || isUploading} isLoading={isUploading} className={`h-12 w-full !rounded-[5px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none ${photos.length > 0 && !isUploading ? '!border-[#2563eb] !bg-[#2563eb]' : '!border-[#2563eb] !bg-[#cbd5e1] !opacity-100'}`}>
            AI 이미지 생성하기
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
