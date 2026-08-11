import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getImageUploadErrorMessage,
} from '@/api/fileApi'
import { deleteRequestImage } from '@/api/requestApi'

import simulationImageUploadIcon from '@/assets/user/icons/simulation-image-upload.svg'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

import { interiorStyleOptions } from '@/mocks/interiorStyles'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'
import { getActiveRequestId } from '@/utils/requestFlow'
import {
  replaceRequestImage,
  uploadAndAttachRequestImage,
  type LinkedRequestImage,
} from '@/utils/requestImageFlow'
import { clearSimulationResult } from '@/utils/simulationResult'

const acceptedImageTypes = ['image/jpeg', 'image/png']
const maximumImageSize = 10 * 1024 * 1024

function validateSimulationImage(file: File) {
  if (!acceptedImageTypes.includes(file.type)) {
    return 'JPG 또는 PNG 파일만 업로드할 수 있습니다.'
  }

  if (file.size > maximumImageSize) {
    return '이미지 파일은 최대 10MB까지 업로드할 수 있습니다.'
  }

  return ''
}

export default function SimulationPhotoUploadPage() {
  const navigate = useNavigate()
  const { state } = useLocation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)
  const [linkedImage, setLinkedImage] =
    useState<LinkedRequestImage | null>(null)

  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const routeStyleId =
    typeof state === 'object' && state !== null
      ? Reflect.get(state, 'styleId')
      : undefined

  const selectedStyle =
    interiorStyleOptions.find(
      (option) => option.id === routeStyleId,
    ) ?? interiorStyleOptions[0]

  const previewUrl = useMemo(
    () =>
      selectedFile
        ? URL.createObjectURL(selectedFile)
        : null,
    [selectedFile],
  )

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const fileError = validateSimulationImage(file)

    if (fileError) {
      setErrorMessage(fileError)
      event.target.value = ''
      return
    }

    const requestId = getActiveRequestId()
    if (!requestId) {
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      event.target.value = ''
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setErrorMessage('')
    setIsUploading(true)

    try {
      const nextLinkedImage = linkedImage
        ? await replaceRequestImage(requestId, linkedImage.id, file, 'PHOTO', abortController.signal)
        : await uploadAndAttachRequestImage(requestId, file, 'PHOTO', abortController.signal)
      setSelectedFile(file)
      setLinkedImage(nextLinkedImage)
    } catch (error) {
      if (!abortController.signal.aborted) setErrorMessage(getImageUploadErrorMessage(error))
    } finally {
      if (!abortController.signal.aborted) setIsUploading(false)
      if (abortControllerRef.current === abortController) abortControllerRef.current = null
      event.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!linkedImage || isUploading) return
    const requestId = getActiveRequestId()
    if (!requestId) {
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    setIsUploading(true)
    setErrorMessage('')
    try {
      await deleteRequestImage(requestId, linkedImage.id)
      setSelectedFile(null)
      setLinkedImage(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '이미지 삭제에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!selectedFile || !linkedImage || isUploading) {
      return
    }
    clearSimulationResult()

    const uploadedImageUrl = resolveApiAssetUrl(linkedImage.imageUrl)
    if (!uploadedImageUrl) {
      setErrorMessage('서버 응답을 확인할 수 없습니다.')
      return
    }

    navigate('/analysis/simulation/generating', {
      state: {
        styleId: selectedStyle.id,
        uploadedImagePath: linkedImage.imageUrl,
        uploadedImageUrl,
      },
    })
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="현재 집 사진 업로드"
        onBack={() => navigate('/analysis/style')}
      />

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit}
      >
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          <AnalysisStepIndicator
            currentStep={4}
            completedContent="number"
            showDivider
          />

          {/* 페이지 제목 */}
          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">
              현재 집 사진을 업로드해주세요.
            </h1>

            <p className="mx-auto mt-2 max-w-[265px] break-keep text-[10px] leading-[17px] text-[#657187]">
              선택한 공간이 잘 보이는 사진을 올려주세요.
              <br />
              AI가 선택한 스타일로 인테리어 이미지를 생성합니다.
            </p>
          </section>

          <section className="mt-[18px] pb-6">
            {/* 선택 스타일 */}
            <div className="flex h-14 items-center gap-2 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4">
              <span className="text-[12px] font-medium leading-5 text-[#2563eb]">
                선택 스타일
              </span>

              <strong className="text-[14px] font-bold leading-5 text-[#0f172a]">
                · {selectedStyle.name}
              </strong>
            </div>

            {/* 실제 파일 input */}
            <input
              ref={fileInputRef}
              id="simulation-photo"
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              aria-label="현재 집 사진 선택"
              onChange={handleFileChange}
            />

            {/* 사진 미선택 */}
            {!selectedFile ? (
              <div className="mt-4 flex h-[252px] w-full flex-col items-center rounded-[12px] border border-dashed border-[#bfdbfe] bg-[#f8fafc]">
                <img
                  src={simulationImageUploadIcon}
                  alt=""
                  className="mt-[33px] size-9"
                />

                <p className="mt-4 text-[15px] font-medium leading-5 text-[#0f172a]">
                  현재 집 사진을 선택해주세요
                </p>

                <p className="mt-[10px] text-[12px] leading-5 text-[#64748b]">
                  JPG, PNG · 최대 10MB
                </p>

                <button
                  type="button"
                  disabled={isUploading}
                  className="mt-[20px] flex h-10 w-[110px] items-center justify-center rounded-[8px] bg-[#eff6ff] text-[14px] font-medium text-[#2563eb] disabled:cursor-default disabled:opacity-60"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  사진 선택
                </button>
              </div>
            ) : (
              /* 사진 선택 완료 */
              <div className="mt-4 overflow-hidden rounded-[12px] border border-[#bfdbfe] bg-white p-3">
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-[10px] bg-[#f8fafc]">
                    <img
                      src={previewUrl}
                      alt="선택한 현재 집 사진"
                      className="h-[210px] w-full object-cover"
                    />

                    <button
                      type="button"
                      aria-label="선택한 사진 삭제"
                      disabled={isUploading}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-[#0f172a]/70 text-[18px] leading-none text-white disabled:cursor-default disabled:opacity-60"
                      onClick={handleDelete}
                    >
                      ×
                    </button>
                  </div>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-[#1e293b]">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-[10px] text-[#64748b]">
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(1)}
                      MB
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUploading}
                    className="shrink-0 rounded-[6px] border border-[#bfdbfe] bg-white px-3 py-2 text-[11px] font-medium text-[#2563eb] disabled:cursor-default disabled:opacity-60"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    사진 변경
                  </button>
                </div>
              </div>
            )}

            <p
              role="alert"
              className="mt-2 min-h-[17px] text-center text-[10px] leading-[17px] text-[#ef4444]"
            >
              {errorMessage}
            </p>
          </section>
        </main>

        {/* 하단 고정 버튼 */}
        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!selectedFile || !linkedImage || isUploading}
            isLoading={isUploading}
            className={`h-12 w-full !rounded-[5px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              selectedFile && linkedImage && !isUploading
                ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]'
                : '!border-[#2563eb] !bg-[#cbd5e1] !opacity-100'
            }`}
          >
            AI 이미지 생성하기
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
