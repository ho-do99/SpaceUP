import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SimulationGeneratingPage from './SimulationGeneratingPage'

vi.mock('@/utils/requestFlow', () => ({
  getActiveRequestId: () => 7,
}))

vi.mock('@/utils/apiAssetUrl', () => ({
  resolveApiAssetUrl: (path: string) => `https://spaceup.test${path}`,
}))

vi.mock('@/utils/simulationResult', () => ({
  saveSimulationResult: vi.fn(),
}))

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
  beforeEach(() => vi.useFakeTimers())

  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('keeps the original disabled-button design while generation is running', async () => {
    renderGeneratingPage()

    const button = screen.getByRole('button', { name: '이미지 생성 중…' })

    expect(button).toBeDisabled()
    expect(button).toHaveClass('!border-[#2563eb]', '!bg-[#cbd5e1]')
    expect(screen.getByText('선택한 스타일로 공간을 바꾸고 있어요')).toBeInTheDocument()
  })

})
