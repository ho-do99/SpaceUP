import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
  generateInteriorImages,
  getInteriorImageGenerationErrorMessage,
} from '@/api/analysisApi'
import SimulationGeneratingPage from './SimulationGeneratingPage'

vi.mock('@/api/analysisApi', () => ({
  generateInteriorImages: vi.fn(),
  getInteriorImageGenerationErrorMessage: vi.fn(),
}))

vi.mock('@/utils/requestFlow', () => ({
  getActiveRequestId: () => 7,
}))

vi.mock('@/utils/apiAssetUrl', () => ({
  resolveApiAssetUrl: (path: string) => `https://spaceup.test${path}`,
}))

vi.mock('@/utils/simulationResult', () => ({
  saveSimulationResult: vi.fn(),
}))

const mockedGenerateInteriorImages = vi.mocked(generateInteriorImages)
const mockedGetErrorMessage = vi.mocked(getInteriorImageGenerationErrorMessage)

function renderGeneratingPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/analysis/simulation/generating',
          state: {
            styleId: 'modern',
            uploadedImagePath: '/api/files/images/room.png',
          },
        },
      ]}
    >
      <Routes>
        <Route path="/analysis/simulation/generating" element={<SimulationGeneratingPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SimulationGeneratingPage', () => {
  beforeEach(() => {
    mockedGenerateInteriorImages.mockReset()
    mockedGetErrorMessage.mockReset()
  })

  afterEach(() => cleanup())

  it('keeps the original disabled-button design while generation is running', async () => {
    mockedGenerateInteriorImages.mockReturnValue(new Promise(() => undefined))

    renderGeneratingPage()

    await waitFor(() => expect(mockedGenerateInteriorImages).toHaveBeenCalledTimes(1))
    const button = screen.getByRole('button', { name: '이미지 생성 중…' })

    expect(button).toBeDisabled()
    expect(button).toHaveClass('!border-[#2563eb]', '!bg-[#cbd5e1]')
    expect(screen.getByText('선택한 스타일로 공간을 바꾸고 있어요')).toBeInTheDocument()
  })

  it('shows a retry action when generation fails', async () => {
    mockedGenerateInteriorImages.mockRejectedValue(new Error('provider failed'))
    mockedGetErrorMessage.mockReturnValue('AI 이미지 생성 중 오류가 발생했습니다.')

    renderGeneratingPage()

    expect(await screen.findByText('AI 이미지 생성 중 오류가 발생했습니다.')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: '다시 시도하기' })

    expect(button).toBeEnabled()
    expect(button).toHaveClass('!border-[#2563eb]', '!bg-[#2563eb]')
  })
})
