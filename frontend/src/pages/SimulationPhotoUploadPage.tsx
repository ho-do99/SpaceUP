import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getImageUploadErrorMessage, uploadImage, validateImageFile } from '@/api/fileApi'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import SimulationPhotoUploadZone from '@/components/user/SimulationPhotoUploadZone'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { interiorStyleOptions } from '@/mocks/interiorStyles'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'

export default function SimulationPhotoUploadPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const routeStyleId =
    typeof state === 'object' && state !== null ? Reflect.get(state, 'styleId') : undefined
  const selectedStyle =
    interiorStyleOptions.find((option) => option.id === routeStyleId) ?? interiorStyleOptions[0]
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const fileError = validateImageFile(file)

    if (fileError) {
      setSelectedFile(null)
      setErrorMessage(fileError)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setErrorMessage('')
  }

  const handleDelete = () => {
    setSelectedFile(null)
    setErrorMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile || isUploading) {
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setErrorMessage('')
    setIsUploading(true)

    try {
      const uploadResponse = await uploadImage(selectedFile, abortController.signal)
      const uploadedImageUrl = resolveApiAssetUrl(uploadResponse.imageUrl)

      if (!uploadedImageUrl) {
        setErrorMessage('서버 응답을 확인할 수 없습니다.')
        return
      }

      navigate('/analysis/simulation/generating', {
        state: {
          styleId: selectedStyle.id,
          uploadedImagePath: uploadResponse.imageUrl,
          uploadedImageUrl,
        },
      })
    } catch (error: unknown) {
      if (!abortController.signal.aborted) {
        setErrorMessage(getImageUploadErrorMessage(error))
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsUploading(false)
      }

      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="현재 집 사진 업로드"
        onBack={() => navigate('/analysis/style')}
      />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          <AnalysisStepIndicator currentStep={4} completedContent="number" showDivider />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-[22px] text-[#15284c]">
              현재 집 사진을 업로드해주세요.
            </h1>
            <p className="mx-auto mt-2 max-w-[265px] break-keep text-[10px] leading-[17px] text-[#657187]">
              선택한 공간이 잘 보이는 사진을 올려주세요. AI가 선택한 스타일로 인테리어 이미지를 생성합니다.
            </p>
          </section>

          <section className="mt-[18px] pb-6">
            <div className="flex h-14 items-center gap-2 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4 text-[13px] leading-5">
              <span className="font-medium text-[#475569]">선택 스타일</span>
              <strong className="font-semibold text-[#2563eb]">· {selectedStyle.name}</strong>
            </div>

            <div className="mt-4">
              <SimulationPhotoUploadZone
                file={selectedFile}
                previewUrl={previewUrl}
                errorMessage={errorMessage}
                disabled={isUploading}
                onFileChange={handleFileChange}
                onDelete={handleDelete}
              />
            </div>
          </section>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
            className={`h-12 w-full !rounded-[5px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              selectedFile && !isUploading
                ? '!border-[#2563eb] !bg-[#2563eb] hover:!bg-[#2563eb]'
                : '!border-[#cbd5e1] !bg-[#cbd5e1] !opacity-100'
            }`}
          >
            AI 이미지 생성하기
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
