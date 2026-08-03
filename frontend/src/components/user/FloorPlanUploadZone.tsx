import { useRef, useState, type ChangeEvent } from 'react'
import uploadCloudIcon from '@/assets/user/icons/upload-cloud.svg'

interface FloorPlanUploadZoneProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

const fileAccept = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'
const maxFileSize = 10 * 1024 * 1024
const allowedExtensionPattern = /\.(jpe?g|png|pdf)$/i
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf'])

function getFileError(file: File) {
  const hasAllowedExtension = allowedExtensionPattern.test(file.name)
  const hasAllowedMimeType = file.type === '' || allowedMimeTypes.has(file.type)

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return 'JPG, JPEG, PNG, PDF 파일만 업로드할 수 있습니다.'
  }

  if (file.size > maxFileSize) {
    return '파일 크기는 10MB 이하만 가능합니다.'
  }

  return null
}

function getFileDescription(file: File) {
  const extension = file.name.split('.').pop()?.toUpperCase() ?? 'FILE'
  const sizeInMegabytes = file.size / (1024 * 1024)
  const formattedSize =
    sizeInMegabytes >= 0.1
      ? `${sizeInMegabytes.toFixed(1)}MB`
      : `${Math.max(file.size / 1024, 0.1).toFixed(1)}KB`

  return `${extension} · ${formattedSize}`
}

export default function FloorPlanUploadZone({
  file,
  onFileChange,
}: FloorPlanUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    const nextError = getFileError(selectedFile)

    if (nextError) {
      event.target.value = ''
      setError(nextError)
      onFileChange(null)
      return
    }

    setError(null)
    onFileChange(selectedFile)
  }

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    setError(null)
    onFileChange(null)
  }

  const prepareFileChange = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        id="villa-floor-plan"
        type="file"
        accept={fileAccept}
        aria-describedby={`floor-plan-file-hint${error ? ' floor-plan-file-error' : ''}`}
        aria-invalid={error !== null}
        className="peer sr-only"
        onChange={handleFileChange}
      />

      <div
        className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-3.5 ${
          file ? 'h-[136px]' : 'h-36'
        }`}
      >
        <img src={uploadCloudIcon} alt="" className="size-8 shrink-0" />

        {file ? (
          <>
            <p className="max-w-full truncate text-[12px] font-bold leading-[14px] text-[#1e293b]">
              {file.name}
            </p>
            <p
              id="floor-plan-file-hint"
              className="text-[10px] leading-3 text-[#64748b]"
            >
              {getFileDescription(file)}
            </p>
            <div className="mt-0.5 flex h-8 items-center justify-center gap-2">
              <label
                htmlFor="villa-floor-plan"
                className="flex h-8 w-[84px] cursor-pointer items-center justify-center rounded-[8px] bg-[#eff6ff] text-[11px] font-bold text-[#2563eb] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2563eb]"
                onClick={prepareFileChange}
              >
                변경
              </label>
              <button
                type="button"
                className="flex h-8 w-[84px] items-center justify-center rounded-[8px] border border-[#cbd5e1] bg-white text-[11px] font-bold text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                onClick={handleRemove}
              >
                삭제
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] font-bold leading-[14px] text-[#1e293b]">
              평면도 파일을 선택해주세요
            </p>
            <p
              id="floor-plan-file-hint"
              className="text-[10px] leading-3 text-[#64748b]"
            >
              JPG, PNG, PDF / 최대 10MB
            </p>
            <label
              htmlFor="villa-floor-plan"
              className="flex h-10 w-28 cursor-pointer items-center justify-center rounded-[8px] bg-[#eff6ff] text-[12px] font-bold text-[#2563eb] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2563eb]"
            >
              파일 선택
            </label>
          </>
        )}
      </div>

      {error && (
        <p
          id="floor-plan-file-error"
          role="alert"
          className="mt-2 text-center text-[11px] leading-4 text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}
