import { useRef, type ChangeEvent } from 'react'
import uploadCloudIcon from '@/assets/user/icons/upload-cloud.svg'

interface FloorPlanUploadZoneProps {
  file: File | null
  previewUrl: string | null
  errorMessage: string
  disabled: boolean
  onFileChange: (file: File | null) => void
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
  previewUrl,
  errorMessage,
  disabled,
  onFileChange,
}: FloorPlanUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    onFileChange(selectedFile)
  }

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }

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
        accept="image/*"
        disabled={disabled}
        aria-describedby={`floor-plan-file-hint${errorMessage ? ' floor-plan-file-error' : ''}`}
        aria-invalid={Boolean(errorMessage)}
        className="peer sr-only"
        onChange={handleFileChange}
      />

      <div
        className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-3.5 ${file ? 'h-[136px]' : 'h-36'
          }`}
      >
        <img
          src={file && previewUrl ? previewUrl : uploadCloudIcon}
          alt={file && previewUrl ? '선택한 평면도 미리보기' : ''}
          className={`size-8 shrink-0 ${file && previewUrl ? 'rounded object-cover' : ''}`}
        />

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
                aria-disabled={disabled}
                className={`flex h-8 w-[84px] items-center justify-center rounded-[8px] bg-[#eff6ff] text-[11px] font-bold text-[#2563eb] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2563eb] ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                onClick={prepareFileChange}
              >
                변경
              </label>
              <button
                type="button"
                disabled={disabled}
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
              PNG, JPEG, GIF, WebP 등 / 최대 20MB
            </p>
            <label
              htmlFor="villa-floor-plan"
              aria-disabled={disabled}
              className={`flex h-10 w-28 items-center justify-center rounded-[8px] bg-[#eff6ff] text-[12px] font-bold text-[#2563eb] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2563eb] ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              파일 선택
            </label>
          </>
        )}
      </div>

      {errorMessage && (
        <p
          id="floor-plan-file-error"
          role="alert"
          className="mt-2 text-center text-[11px] leading-4 text-red-600"
        >
          {errorMessage}
        </p>
      )}
    </div>
  )
}
