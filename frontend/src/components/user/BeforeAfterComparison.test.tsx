import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BeforeAfterComparison from './BeforeAfterComparison'

describe('BeforeAfterComparison', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
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
