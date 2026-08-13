import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUploadErrorMessage, validateImageFile } from '@/api/fileApi'
import { deleteRequestImage } from '@/api/requestApi'
import { requestAnalysis } from '@/api/analysisApi'
import Button from '@/components/Button'
import AnalysisStepIndicator from '@/components/user/AnalysisStepIndicator'
import FloorPlanUploadZone from '@/components/user/FloorPlanUploadZone'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'
import { createFloorPlanAnalysisNavigationState } from '@/utils/floorPlanAnalysisFlow'
import { getActiveRequestId } from '@/utils/requestFlow'
import {
  replaceRequestImage,
  uploadAndAttachRequestImage,
  type LinkedRequestImage,
} from '@/utils/requestImageFlow'

export default function FloorPlanUploadPage() {
  const navigate = useNavigate()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [linkedImage, setLinkedImage] = useState<LinkedRequestImage | null>(null)
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

  const handleFileChange = async (nextFile: File | null) => {
    if (!nextFile) {
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
        setFile(null)
        setLinkedImage(null)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '평면도 삭제에 실패했습니다.')
      } finally {
        setIsUploading(false)
      }
      return
    }

    const supportedFloorPlanTypes = new Set(['image/png', 'image/jpeg'])
    const fileError = supportedFloorPlanTypes.has(nextFile.type)
      ? validateImageFile(nextFile)
      : '평면도는 PNG, JPEG, JPG 파일만 업로드할 수 있습니다.'

    if (fileError) {
      setErrorMessage(fileError)
      return
    }

    const requestId = getActiveRequestId()
    if (!requestId) {
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setErrorMessage('')
    setIsUploading(true)

    try {
      const nextLinkedImage = linkedImage
        ? await replaceRequestImage(requestId, linkedImage.id, nextFile, 'FLOOR_PLAN', abortController.signal)
        : await uploadAndAttachRequestImage(requestId, nextFile, 'FLOOR_PLAN', abortController.signal)
      setFile(nextFile)
      setLinkedImage(nextLinkedImage)
    } catch (error) {
      if (!abortController.signal.aborted) setErrorMessage(getImageUploadErrorMessage(error))
    } finally {
      if (!abortController.signal.aborted) setIsUploading(false)
      if (abortControllerRef.current === abortController) abortControllerRef.current = null
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file || !linkedImage || isUploading) {
      return
    }

    const uploadedImageUrl = resolveApiAssetUrl(linkedImage.imageUrl)
    if (!uploadedImageUrl) {
      setErrorMessage('서버 응답을 확인할 수 없습니다.')
      return
    }

    const requestId = getActiveRequestId()
    if (!requestId) {
      setErrorMessage('진행 중인 의뢰 정보를 찾을 수 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    setIsUploading(true)
    try {
      await requestAnalysis(requestId)
      navigate('/analysis/loading', {
        state: createFloorPlanAnalysisNavigationState(file, linkedImage, uploadedImageUrl),
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '분석 요청 생성에 실패했습니다.')
      setIsUploading(false)
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
            disabled={!file || !linkedImage || isUploading}
            isLoading={isUploading}
            className={`h-12 w-full !rounded-[8px] !border !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              file && linkedImage && !isUploading
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
