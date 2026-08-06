import type { ChangeEvent } from 'react'
import simulationImageUploadIcon from '@/assets/user/icons/simulation-image-upload.svg'

interface SimulationPhotoUploadZoneProps {
  file: File | null
  previewUrl: string | null
  errorMessage: string
  disabled: boolean
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDelete: () => void
}

const inputId = 'simulation-photo'
const helpId = 'simulation-photo-help'
const errorId = 'simulation-photo-error'

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(1)}MB`
}

export default function SimulationPhotoUploadZone({
  file,
  previewUrl,
  errorMessage,
  disabled,
  onFileChange,
  onDelete,
}: SimulationPhotoUploadZoneProps) {
  const describedBy = errorMessage ? `${helpId} ${errorId}` : file ? undefined : helpId

  const fileInput = (
    <input
      id={inputId}
      type="file"
      accept="image/*"
      disabled={disabled}
      className="sr-only"
      aria-describedby={describedBy}
      aria-invalid={Boolean(errorMessage)}
      onChange={onFileChange}
    />
  )

  return (
    <div>
      {file && previewUrl ? (
        <div className="rounded-xl border border-[#cbd5e1] bg-white p-3">
          <img
            src={previewUrl}
            alt="업로드한 현재 집 사진 미리보기"
            className="h-[226px] w-full rounded-lg object-cover"
          />

          <div className="mt-3 min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 text-[#1e293b]">
              {file.name}
            </p>
            <p className="text-[11px] leading-[17px] text-[#64748b]">
              {formatFileSize(file.size)}
            </p>
          </div>

          <div className="mt-3 flex justify-end gap-3">
            <label
              htmlFor={inputId}
              aria-disabled={disabled}
              className={`flex h-9 w-24 items-center justify-center rounded-lg bg-[#eff6ff] text-[12px] font-semibold text-[#2563eb] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2563eb] ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              {fileInput}
              사진 변경
            </label>
            <button
              type="button"
              disabled={disabled}
              className="h-9 w-24 rounded-lg border border-[#cbd5e1] bg-white text-[12px] font-semibold text-[#475569] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
              onClick={onDelete}
            >
              사진 삭제
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-[252px] flex-col items-center rounded-xl border border-dashed border-[#bfdbfe] bg-[#f8fafc] pt-[34px]">
          <img src={simulationImageUploadIcon} alt="" className="size-9" />
          <p className="mt-4 text-[14px] font-semibold leading-5 text-[#334155]">
            현재 집 사진을 선택해주세요
          </p>
          <p id={helpId} className="mt-2 text-[11px] leading-[17px] text-[#94a3b8]">
            PNG, JPEG, GIF, WebP 등 · 최대 20MB
          </p>
          <label
            htmlFor={inputId}
            aria-disabled={disabled}
            className={`mt-6 flex h-10 w-[110px] items-center justify-center rounded-lg bg-[#eff6ff] text-[12px] font-semibold text-[#2563eb] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2563eb] ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            {fileInput}
            사진 선택
          </label>
        </div>
      )}

      {errorMessage && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-[12px] leading-[18px] text-[#dc2626]"
        >
          {errorMessage}
        </p>
      )}
    </div>
  )
}
