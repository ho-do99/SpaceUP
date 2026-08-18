import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface BeforeAfterComparisonProps {
  beforeImageUrl: string
  afterImageUrl: string
  styleName?: string
}

type PreviewKind = 'before' | 'after'

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function extensionFor(contentType: string) {
  if (contentType.includes('jpeg')) return 'jpg'
  if (contentType.includes('webp')) return 'webp'
  return 'png'
}

export default function BeforeAfterComparison({
  beforeImageUrl,
  afterImageUrl,
  styleName = '모던',
}: BeforeAfterComparisonProps) {
  const [preview, setPreview] = useState<PreviewKind | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!preview) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [preview])

  const openPreview = (kind: PreviewKind) => {
    setDownloadError('')
    setPreview(kind)
  }

  const downloadAfterImage = async () => {
    if (downloading) return
    setDownloading(true)
    setDownloadError('')

    try {
      const response = await fetch(afterImageUrl, { cache: 'no-store' })
      if (!response.ok) throw new Error('download failed')
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) throw new Error('invalid image')

      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const safeStyleName = styleName.replace(/[^0-9A-Za-z가-힣_-]/g, '-') || 'result'
      anchor.href = objectUrl
      anchor.download = `spaceup-ai-${safeStyleName}.${extensionFor(blob.type)}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setDownloadError('이미지를 다운로드하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setDownloading(false)
    }
  }

  const previewImageUrl = preview === 'before' ? beforeImageUrl : afterImageUrl
  const previewTitle = preview === 'before' ? '원본 사진 전체 보기' : 'AI 결과 전체 보기'

  return (
    <>
      <figure className="relative grid h-[402px] grid-cols-2 overflow-hidden rounded-xl border border-[#cbd5e1] bg-white">
        <button type="button" aria-label="원본 사진 크게 보기" onClick={() => openPreview('before')} className="h-full min-w-0 cursor-zoom-in overflow-hidden focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563eb]">
          <img
            src={beforeImageUrl}
            alt="인테리어 적용 전 공간"
            className="h-full w-full object-cover"
          />
        </button>
        <button type="button" aria-label="AI 결과 사진 크게 보기" onClick={() => openPreview('after')} className="h-full min-w-0 cursor-zoom-in overflow-hidden focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563eb]">
          <img
            src={afterImageUrl}
            alt={`${styleName} 스타일 적용 후 공간`}
            className="h-full w-full object-cover"
          />
        </button>

        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#2563eb] bg-white"
        >
          <span className="size-2.5 rotate-45 border-b-2 border-l-2 border-[#2563eb]" />
          <span className="size-2.5 -rotate-45 border-b-2 border-r-2 border-[#2563eb]" />
        </div>
      </figure>

      {preview && createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="image-preview-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null) }} className="fixed inset-0 z-[100] flex flex-col bg-black/90 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
          <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-3 pb-3 text-white">
            <h2 id="image-preview-title" className="min-w-0 flex-1 truncate text-sm font-bold">{previewTitle}</h2>
            <div className="flex shrink-0 items-center gap-2">
              {preview === 'after' ? (
                <button type="button" disabled={downloading} onClick={() => void downloadAfterImage()} className="flex h-9 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                  <DownloadIcon />
                  {downloading ? '저장 중' : '다운로드'}
                </button>
              ) : null}
              <button ref={closeButtonRef} type="button" aria-label="전체 사진 닫기" onClick={() => setPreview(null)} className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <CloseIcon />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center">
            <img src={previewImageUrl} alt={preview === 'before' ? '인테리어 적용 전 원본 전체 사진' : `${styleName} 스타일 AI 결과 전체 사진`} className="max-h-full max-w-full object-contain" />
          </div>
          {downloadError ? <p role="alert" className="mx-auto mt-2 rounded-lg bg-black/60 px-3 py-2 text-center text-xs text-[#fecaca]">{downloadError}</p> : null}
        </div>,
        document.body,
      )}
    </>
  )
}
