import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BeforeAfterComparison from './BeforeAfterComparison'

describe('BeforeAfterComparison', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('guides the handle once and returns the comparison to the center', () => {
    vi.useFakeTimers()
    render(<BeforeAfterComparison beforeImageUrl="/before.png" afterImageUrl="/after.png" />)

    const slider = screen.getByRole('slider', { name: 'Before/After 비교 위치' })
    expect(slider).toHaveAttribute('aria-valuenow', '50')

    act(() => vi.advanceTimersByTime(100))
    expect(slider).toHaveAttribute('aria-valuenow', '62')

    act(() => vi.advanceTimersByTime(350))
    expect(slider).toHaveAttribute('aria-valuenow', '38')

    act(() => vi.advanceTimersByTime(350))
    expect(slider).toHaveAttribute('aria-valuenow', '50')

    act(() => vi.advanceTimersByTime(400))
    expect(slider).toHaveAttribute('aria-valuenow', '50')
  })

  it('supports pointer dragging and clamps the comparison between 0 and 100 percent', () => {
    render(<BeforeAfterComparison beforeImageUrl="/before.png" afterImageUrl="/after.png" />)

    const comparison = screen.getByLabelText('Before/After 이미지 비교')
    vi.spyOn(comparison, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 0,
      left: 100,
      right: 500,
      top: 0,
      bottom: 402,
      width: 400,
      height: 402,
      toJSON: () => ({}),
    })
    const slider = screen.getByRole('slider', { name: 'Before/After 비교 위치' })

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 300 })
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 460 })
    expect(slider).toHaveAttribute('aria-valuenow', '90')

    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 600 })
    expect(slider).toHaveAttribute('aria-valuenow', '100')

    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 0 })
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 0 })
  })

  it('opens each full image and closes the preview with Escape', () => {
    render(<BeforeAfterComparison beforeImageUrl="/before.png" afterImageUrl="/after.png" styleName="모던" />)

    fireEvent.click(screen.getByRole('button', { name: '원본 사진 크게 보기' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByAltText('인테리어 적용 전 원본 전체 사진')).toHaveClass('object-contain')
    expect(screen.queryByRole('button', { name: '다운로드' })).not.toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'AI 결과 사진 크게 보기' }))
    expect(screen.getByAltText('모던 스타일 AI 결과 전체 사진')).toHaveAttribute('src', '/after.png')
    expect(screen.getByRole('button', { name: '다운로드' })).toBeInTheDocument()
  })

  it('downloads the existing AI image to the user device without another upload', async () => {
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['image'], { type: 'image/png' }),
    } as Response)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:spaceup-result')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<BeforeAfterComparison beforeImageUrl="/before.png" afterImageUrl="/api/files/images/generated.png" styleName="모던 스타일" />)
    fireEvent.click(screen.getByRole('button', { name: 'AI 결과 사진 크게 보기' }))
    fireEvent.click(screen.getByRole('button', { name: '다운로드' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith('/api/files/images/generated.png', { cache: 'no-store' })
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:spaceup-result')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
