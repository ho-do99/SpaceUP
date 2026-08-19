import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SimulationPhotoUploadPage from './SimulationPhotoUploadPage'

const api = vi.hoisted(() => ({
  uploadAndAttachRequestImage: vi.fn(),
  deleteRequestImage: vi.fn(),
}))

vi.mock('@/utils/requestImageFlow', () => ({ uploadAndAttachRequestImage: api.uploadAndAttachRequestImage }))
vi.mock('@/api/requestApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/requestApi')>()
  return { ...actual, deleteRequestImage: api.deleteRequestImage }
})

describe('SimulationPhotoUploadPage', () => {
  beforeEach(() => {
    sessionStorage.setItem('spaceup.activeRequestId', '77')
    api.uploadAndAttachRequestImage.mockReset()
      .mockResolvedValueOnce({ id: 1, imageUrl: '/api/files/images/living-1.jpg' })
      .mockResolvedValueOnce({ id: 2, imageUrl: '/api/files/images/living-2.jpg' })
    api.deleteRequestImage.mockReset().mockResolvedValue(undefined)
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((file: File) => `blob:${file.name}`) })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  })

  afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks() })

  it('adds multiple home photos while keeping the first photo as the AI reference', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/analysis/simulation/upload', state: { styleId: 'wood' } }]}>
        <Routes>
          <Route path="/analysis/simulation/upload" element={<SimulationPhotoUploadPage />} />
          <Route path="/analysis/simulation/generating" element={<p>generating page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    const input = screen.getByLabelText('현재 집 사진 선택')
    const first = new File(['first'], 'living-1.jpg', { type: 'image/jpeg' })
    const second = new File(['second'], 'living-2.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [first] } })
    expect(await screen.findByRole('button', { name: /사진 추가 .*1\/5/ })).toBeInTheDocument()
    fireEvent.change(input, { target: { files: [second] } })

    expect(await screen.findByRole('img', { name: '업로드한 현재 집 사진 2' })).toBeInTheDocument()
    expect(api.uploadAndAttachRequestImage).toHaveBeenNthCalledWith(1, 77, first, 'PHOTO', expect.any(AbortSignal))
    expect(api.uploadAndAttachRequestImage).toHaveBeenNthCalledWith(2, 77, second, 'PHOTO', expect.any(AbortSignal))

    const generateButton = screen.getByRole('button', { name: 'AI 이미지 생성하기' })
    await waitFor(() => expect(generateButton).toBeEnabled())
    fireEvent.click(generateButton)
    expect(await screen.findByText('generating page')).toBeInTheDocument()
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem('spaceup.simulationGenerationContext') ?? '{}')).toEqual(expect.objectContaining({ uploadedImagePath: '/api/files/images/living-1.jpg' })))
  })
})
