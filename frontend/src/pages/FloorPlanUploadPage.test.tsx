import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { uploadAndAttachRequestImage } from '@/utils/requestImageFlow'
import { setActiveRequestId } from '@/utils/requestFlow'
import FloorPlanUploadPage from './FloorPlanUploadPage'

vi.mock('@/utils/requestImageFlow', () => ({
  uploadAndAttachRequestImage: vi.fn(),
  replaceRequestImage: vi.fn(),
}))
vi.mock('@/api/requestApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/requestApi')>()
  return { ...actual, deleteRequestImage: vi.fn() }
})

const uploadAndAttach = vi.mocked(uploadAndAttachRequestImage)

function AnalysisStateProbe() {
  const { state } = useLocation()
  const floorPlanFile = (state as { floorPlanFile?: File } | null)?.floorPlanFile
  return <p>{floorPlanFile ? `analysis:${floorPlanFile.name}` : 'missing file'}</p>
}

describe('FloorPlanUploadPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    uploadAndAttach.mockReset().mockResolvedValue({
      id: 91,
      imageUrl: '/api/files/images/villa-floor-plan.png',
    })
  })
  afterEach(cleanup)

  it('reuses the uploaded File in the shared analysis route without uploading it twice', async () => {
    setActiveRequestId(77)
    const file = new File(['villa'], 'villa-floor-plan.png', { type: 'image/png' })
    const { container } = render(
      <MemoryRouter initialEntries={['/upload']}>
        <Routes>
          <Route path="/upload" element={<FloorPlanUploadPage />} />
          <Route path="/analysis/loading" element={<AnalysisStateProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    const input = container.querySelector<HTMLInputElement>('#villa-floor-plan')
    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { files: [file] } })
    await waitFor(() => expect(uploadAndAttach).toHaveBeenCalledWith(
      77,
      file,
      'FLOOR_PLAN',
      expect.any(AbortSignal),
    ))

    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    expect(await screen.findByText('analysis:villa-floor-plan.png')).toBeInTheDocument()
    expect(uploadAndAttach).toHaveBeenCalledTimes(1)
  })
})
