import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface BeforeAfterComparisonProps {
  beforeImageUrl: string
  afterImageUrl: string
  styleName?: string
  afterLoading?: boolean
}

type PreviewKind = 'before' | 'after'

const INITIAL_SLIDER_POSITION = 50
const DRAG_STEP = 2

function clampSliderPosition(position: number) {
  return Math.min(100, Math.max(0, position))
}

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
  afterLoading = false,
}: BeforeAfterComparisonProps) {
  const [preview, setPreview] = useState<PreviewKind | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [sliderPosition, setSliderPosition] = useState(INITIAL_SLIDER_POSITION)
  const [isDragging, setIsDragging] = useState(false)
  const [isIntroAnimating, setIsIntroAnimating] = useState(true)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const comparisonRef = useRef<HTMLElement>(null)
  const introTimerRefs = useRef<number[]>([])
  const activePointerRef = useRef<number | null>(null)

  const clearIntroTimers = useCallback(() => {
    introTimerRefs.current.forEach((timerId) => window.clearTimeout(timerId))
    introTimerRefs.current = []
  }, [])

  const stopIntroAnimation = useCallback(() => {
    clearIntroTimers()
    setIsIntroAnimating(false)
  }, [clearIntroTimers])

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setIsIntroAnimating(false)
      return
    }

    introTimerRefs.current = [
      window.setTimeout(() => setSliderPosition(62), 100),
      window.setTimeout(() => setSliderPosition(38), 450),
      window.setTimeout(() => setSliderPosition(INITIAL_SLIDER_POSITION), 800),
      window.setTimeout(() => setIsIntroAnimating(false), 1_200),
    ]

    return clearIntroTimers
  }, [clearIntroTimers])

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

  const updateSliderFromPointer = (clientX: number) => {
    const bounds = comparisonRef.current?.getBoundingClientRect()
    if (!bounds?.width) return
    setSliderPosition(clampSliderPosition(((clientX - bounds.left) / bounds.width) * 100))
  }

  const finishDragging = (pointerId: number, target: HTMLButtonElement) => {
    if (activePointerRef.current !== pointerId) return
    if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId)
    activePointerRef.current = null
    setIsDragging(false)
  }

  const adjustSliderWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextPosition: number | null = null
    if (event.key === 'ArrowLeft') nextPosition = sliderPosition - DRAG_STEP
    if (event.key === 'ArrowRight') nextPosition = sliderPosition + DRAG_STEP
    if (event.key === 'Home') nextPosition = 0
    if (event.key === 'End') nextPosition = 100
    if (nextPosition === null) return

    event.preventDefault()
    stopIntroAnimation()
    setSliderPosition(clampSliderPosition(nextPosition))
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
      <figure ref={comparisonRef} aria-label="Before/After 이미지 비교" className="relative h-[402px] touch-pan-y select-none overflow-hidden rounded-xl border border-[#cbd5e1] bg-white">
        <button type="button" aria-label="AI 결과 사진 크게 보기" disabled={afterLoading} onClick={() => openPreview('after')} className="absolute inset-0 h-full w-full cursor-zoom-in overflow-hidden focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563eb] disabled:cursor-wait">
          <img
            src={afterImageUrl}
            alt={`${styleName} 스타일 적용 후 공간`}
            draggable="false"
            className="pointer-events-none h-full w-full select-none object-cover"
          />
        </button>
        <button
          type="button"
          aria-label="원본 사진 크게 보기"
          onClick={() => openPreview('before')}
          className="absolute inset-0 z-10 h-full w-full cursor-zoom-in overflow-hidden focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563eb]"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            transition: isIntroAnimating ? 'clip-path 300ms ease-in-out' : undefined,
          }}
        >
          <img
            src={beforeImageUrl}
            alt="인테리어 적용 전 공간"
            draggable="false"
            className="pointer-events-none h-full w-full select-none object-cover"
          />
        </button>

        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-3 z-20 rounded bg-black/55 px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-white backdrop-blur-sm">BEFORE</span>
        <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 z-20 rounded bg-black/55 px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-white backdrop-blur-sm">AFTER</span>

        {afterLoading ? (
          <div role="status" aria-live="polite" className="absolute inset-y-0 right-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-white/80 px-3 text-center backdrop-blur-[2px]" style={{ left: `${sliderPosition}%` }}>
            <span aria-hidden="true" className="size-8 animate-spin rounded-full border-[3px] border-[#bfdbfe] border-t-[#2563eb] motion-reduce:animate-none" />
            <p className="mt-3 text-[11px] font-bold leading-4 text-[#2563eb]">새 스타일 생성 중</p>
            <p className="mt-1 text-[9px] leading-4 text-[#64748b]">Before 이미지는 그대로 유지됩니다.</p>
          </div>
        ) : null}

        <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 z-30 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_4px_rgba(15,23,42,0.45)] ${isIntroAnimating ? 'transition-[left] duration-300 ease-in-out' : ''}`} style={{ left: `${sliderPosition}%` }} />
        <button
          type="button"
          role="slider"
          aria-label="Before/After 비교 위치"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPosition)}
          aria-valuetext={`Before ${Math.round(sliderPosition)}%, After ${Math.round(100 - sliderPosition)}%`}
          disabled={afterLoading}
          onKeyDown={adjustSliderWithKeyboard}
          onPointerDown={(event) => {
            if (afterLoading) return
            event.preventDefault()
            stopIntroAnimation()
            activePointerRef.current = event.pointerId
            event.currentTarget.setPointerCapture?.(event.pointerId)
            setIsDragging(true)
            updateSliderFromPointer(event.clientX)
          }}
          onPointerMove={(event) => {
            if (activePointerRef.current === event.pointerId) updateSliderFromPointer(event.clientX)
          }}
          onPointerUp={(event) => finishDragging(event.pointerId, event.currentTarget)}
          onPointerCancel={(event) => finishDragging(event.pointerId, event.currentTarget)}
          className={`absolute top-1/2 z-40 flex size-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full bg-transparent outline-none ${afterLoading ? 'cursor-wait' : 'cursor-ew-resize'} ${isIntroAnimating ? 'transition-[left] duration-300 ease-in-out' : ''}`}
          style={{ left: `${sliderPosition}%` }}
        >
          <span aria-hidden="true" className={`flex size-9 items-center justify-center rounded-full border-2 border-[#2563eb] bg-white text-[#2563eb] shadow-[0_2px_8px_rgba(15,23,42,0.2)] transition-transform ${isDragging ? 'scale-110' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
              <path d="m8 7-5 5 5 5M16 7l5 5-5 5M3 12h18" />
            </svg>
          </span>
        </button>
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
