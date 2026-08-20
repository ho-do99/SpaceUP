import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { generateInteriorImages } from '@/api/analysisApi'
import { getSimulationResult } from '@/utils/simulationResult'
import SimulationResultPage from './SimulationResultPage'

vi.mock('@/api/analysisApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/analysisApi')>()
  return { ...actual, generateInteriorImages: vi.fn() }
})
vi.mock('@/utils/apiAssetUrl', () => ({ resolveApiAssetUrl: (path: string) => `https://spaceup.test${path}` }))

const generate = vi.mocked(generateInteriorImages)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/analysis/simulation/result']}>
      <Routes><Route path="/analysis/simulation/result" element={<SimulationResultPage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('SimulationResultPage style regeneration', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem('spaceup.simulationResult', JSON.stringify({
      requestId: 7,
      styleId: 'marble',
      beforeImageUrl: 'https://spaceup.test/api/files/images/original.png',
      afterImagePath: '/api/files/images/marble.png',
      afterImageUrl: 'https://spaceup.test/api/files/images/marble.png',
    }))
    sessionStorage.setItem('spaceup.simulationGenerationContext', JSON.stringify({
      requestId: 7,
      styleId: 'marble',
      uploadedImagePath: '/api/files/images/original.png',
      uploadedImageUrl: 'https://spaceup.test/api/files/images/original.png',
    }))
    generate.mockReset().mockResolvedValue({ imageUrls: ['/api/files/images/wood.png'] })
  })

  afterEach(cleanup)

  it('offers the four styles and replaces only the After image after regeneration', async () => {
    let resolveGeneration!: (value: { imageUrls: string[] }) => void
    generate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGeneration = resolve
        }),
    )

    renderPage()
    const styleSelect = await screen.findByRole('combobox', { name: 'AI 인테리어 스타일 선택' })
    expect(Array.from((styleSelect as HTMLSelectElement).options).map((option) => option.text)).toEqual([
      '선택 스타일 · 대리석', '선택 스타일 · 우드', '선택 스타일 · 화이트', '선택 스타일 · 모던',
    ])
    const beforeImage = screen.getByAltText('인테리어 적용 전 공간')
    expect(beforeImage).toHaveAttribute('src', 'https://spaceup.test/api/files/images/original.png')

    fireEvent.change(styleSelect, { target: { value: 'wood' } })
    expect(await screen.findByText('새 스타일 생성 중')).toBeInTheDocument()
    expect(generate).toHaveBeenCalledWith(7, {
      style: '우드',
      referenceImageUrl: '/api/files/images/original.png',
    }, expect.any(AbortSignal))

    await act(async () => {
      resolveGeneration({ imageUrls: ['/api/files/images/wood.png'] })
    })

    await waitFor(() => expect(screen.getByAltText('우드 스타일 적용 후 공간')).toHaveAttribute(
      'src', 'https://spaceup.test/api/files/images/wood.png',
    ))
    expect(beforeImage).toHaveAttribute('src', 'https://spaceup.test/api/files/images/original.png')
    expect(getSimulationResult()).toMatchObject({ styleId: 'wood', afterImagePath: '/api/files/images/wood.png' })
    expect(sessionStorage.getItem('spaceup-material-theme')).toBe('WOOD')
  })

  it('keeps the previous result and style when regeneration fails', async () => {
    generate.mockRejectedValue(new Error('새 스타일 생성에 실패했습니다.'))
    renderPage()
    const styleSelect = await screen.findByRole('combobox', { name: 'AI 인테리어 스타일 선택' })

    fireEvent.change(styleSelect, { target: { value: 'modern' } })

    expect(await screen.findByRole('alert')).toHaveTextContent('새 스타일 생성에 실패했습니다.')
    expect(styleSelect).toHaveValue('marble')
    expect(screen.getByAltText('대리석 스타일 적용 후 공간')).toHaveAttribute(
      'src', 'https://spaceup.test/api/files/images/marble.png',
    )
  })
})
