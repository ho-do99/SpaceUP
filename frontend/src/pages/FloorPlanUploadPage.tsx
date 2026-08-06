import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUploadErrorMessage, uploadImage, validateImageFile } from '@/api/fileApi'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import FloorPlanUploadZone from '@/components/user/FloorPlanUploadZone'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'

export default function FloorPlanUploadPage() {
  const navigate = useNavigate()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null)
      setErrorMessage('')
      return
    }

    const fileError = validateImageFile(nextFile)

    if (fileError) {
      setFile(null)
      setErrorMessage(fileError)
      return
    }

    setFile(nextFile)
    setErrorMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file || isUploading) {
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setErrorMessage('')
    setIsUploading(true)

    try {
      const uploadResponse = await uploadImage(file, abortController.signal)
      const uploadedImageUrl = resolveApiAssetUrl(uploadResponse.imageUrl)

      if (!uploadedImageUrl) {
        setErrorMessage('서버 응답을 확인할 수 없습니다.')
        return
      }

      navigate('/analysis/loading', {
        state: {
          uploadedImagePath: uploadResponse.imageUrl,
          uploadedImageUrl,
          originalFileName: file.name,
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
    <UserScreenShell>
      <UserHeader
        variant="detail"
        title="평면도 업로드"
        onBack={() => navigate(-1)}
      />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4">
          <AnalysisStepIndicator currentStep={2} />

          <section className="pt-5 text-center">
            <h1 className="break-keep text-[18px] font-bold leading-6 text-[#1e293b]">
              빌라 평면도를 업로드해주세요
            </h1>
            <p className="mt-1.5 min-h-[38px] break-keep text-[12px] leading-[19px] text-[#64748b]">
              원룸·빌라 등 자동 조회가 어려운 주택은 평면도를 직접 업로드해주세요.
            </p>
          </section>

          <div className="mt-3">
            <FloorPlanUploadZone
              file={file}
              previewUrl={previewUrl}
              errorMessage={errorMessage}
              disabled={isUploading}
              onFileChange={handleFileChange}
            />
          </div>
        </main>

        <footer className="shrink-0 bg-white px-4 pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!file || isUploading}
            isLoading={isUploading}
            className={`h-12 w-full !rounded-[8px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              file && !isUploading
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
