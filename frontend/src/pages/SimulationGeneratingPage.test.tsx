import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { generateInteriorImages } from '@/api/analysisApi'
import { saveSimulationResult } from '@/utils/simulationResult'
import SimulationGeneratingPage from './SimulationGeneratingPage'

vi.mock('@/api/analysisApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/analysisApi')>()
  return { ...actual, generateInteriorImages: vi.fn() }
})
vi.mock('@/utils/requestFlow', () => ({ getActiveRequestId: () => 7 }))
vi.mock('@/utils/apiAssetUrl', () => ({ resolveApiAssetUrl: (path: string) => `https://spaceup.test${path}` }))
vi.mock('@/utils/simulationResult', () => ({ saveSimulationResult: vi.fn() }))

const generate = vi.mocked(generateInteriorImages)

function renderGeneratingPage(strictMode = false) {
  const routes = (
    <MemoryRouter initialEntries={[{
      pathname: '/analysis/simulation/generating',
      state: { styleId: 'modern', uploadedImagePath: '/api/files/images/room.png' },
    }]}
    >
      <Routes>
        <Route path="/analysis/simulation/generating" element={<SimulationGeneratingPage />} />
        <Route path="/analysis/simulation/result" element={<p>generated result</p>} />
      </Routes>
    </MemoryRouter>
  )
  return render(strictMode ? <StrictMode>{routes}</StrictMode> : routes)
}

describe('SimulationGeneratingPage', () => {
  beforeEach(() => { generate.mockReset(); vi.mocked(saveSimulationResult).mockReset() })
  afterEach(cleanup)

  it('calls the real generator once and saves the backend image URL', async () => {
    generate.mockResolvedValue({ imageUrls: ['/api/files/images/generated.png'] })
    renderGeneratingPage(true)

    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(generate).toHaveBeenCalledTimes(1)
    expect(generate).toHaveBeenCalledWith(7, {
      style: expect.any(String),
      referenceImageUrl: '/api/files/images/room.png',
    }, expect.any(AbortSignal))
    expect(saveSimulationResult).toHaveBeenCalledWith(expect.objectContaining({
      beforeImageUrl: 'https://spaceup.test/api/files/images/room.png',
      afterImagePath: '/api/files/images/generated.png',
      afterImageUrl: 'https://spaceup.test/api/files/images/generated.png',
    }))
  })

  it('shows an API failure and retries only after the user asks', async () => {
    generate
      .mockRejectedValueOnce(new Error('AI service unavailable'))
      .mockResolvedValueOnce({ imageUrls: ['/api/files/images/retry.png'] })
    renderGeneratingPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('AI service unavailable')
    expect(generate).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }))
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('generated result')).toBeInTheDocument()
  })

  it('does not treat an empty generated image list as success', async () => {
    generate.mockResolvedValue({ imageUrls: [] })
    renderGeneratingPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('AI 생성 이미지 결과를 확인할 수 없습니다.')
    expect(saveSimulationResult).not.toHaveBeenCalled()
  })
})
