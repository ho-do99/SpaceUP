import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SpaceInformationPage from './SpaceInformationPage'
import type { AnalysisSpaceResponse, FloorplanVisualization } from '@/types/analysis'

const api = vi.hoisted(() => ({
  getAnalysis: vi.fn(),
  getAnalysisSpaces: vi.fn(),
  replaceAnalysisSpaces: vi.fn(),
  updateAnalysis: vi.fn(),
  getFloorplanVisualization: vi.fn(),
}))

vi.mock('@/components/user/FloorPlan3DViewer', () => ({
  default: ({ visualization }: { visualization: FloorplanVisualization }) => (
    <p>저장된 3D 모델 {visualization.image_width}</p>
  ),
}))

vi.mock('@/api/analysisApi', () => api)

const spaces: AnalysisSpaceResponse[] = [
  { id: 1, sortOrder: 1, spaceName: '안방', spaceAreaM2: 12, floorAreaM2: 12, wallpaperAreaM2: 28, selectedForConstruction: true },
  { id: 2, sortOrder: 2, spaceName: '침실1', spaceAreaM2: 9.5, floorAreaM2: 9.5, wallpaperAreaM2: 22, selectedForConstruction: false },
  { id: 3, sortOrder: 3, spaceName: '드레스룸', spaceAreaM2: 8, floorAreaM2: 8, wallpaperAreaM2: 18, selectedForConstruction: true },
  { id: 4, sortOrder: 4, spaceName: '복도', spaceAreaM2: 4, floorAreaM2: 4, wallpaperAreaM2: 10, selectedForConstruction: false },
  { id: 5, sortOrder: 5, spaceName: '다용도실', spaceAreaM2: null, floorAreaM2: null, wallpaperAreaM2: null, selectedForConstruction: false },
  { id: 6, sortOrder: 6, spaceName: '침실2', spaceAreaM2: 7, floorAreaM2: 7, wallpaperAreaM2: 16, selectedForConstruction: false },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/analysis/spaces', state: { floorPlanPreviewUrl: '/api/floorplans/variants/1/image' } }]}>
      <Routes>
        <Route path="/analysis/spaces" element={<SpaceInformationPage />} />
        <Route path="/analysis/style" element={<p>style page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SpaceInformationPage', () => {
  beforeEach(() => {
    sessionStorage.setItem('spaceup.activeRequestId', '77')
    api.getAnalysis.mockReset().mockResolvedValue({
      requestId: 77,
      status: 'COMPLETED',
      roomCount: 3,
      bathroomCount: 1,
      hasBalcony: true,
      kitchenType: '분리형',
      ceilingHeightM: 2.4,
    })
    api.getAnalysisSpaces.mockReset().mockResolvedValue(spaces)
    api.getFloorplanVisualization.mockReset().mockResolvedValue({ image_width: 100, image_height: 100, total_area_pixel_count: 5000, rooms: [] })
    api.replaceAnalysisSpaces.mockReset().mockResolvedValue(undefined)
    api.updateAnalysis.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    sessionStorage.clear()
  })

  it('renders every backend space name, area, selection state, summary, and preview', async () => {
    renderPage()

    for (const space of spaces) {
      expect(await screen.findByText(space.spaceName)).toBeInTheDocument()
    }
    expect(screen.getByText('12㎡ (3.63평)')).toBeInTheDocument()
    expect(screen.getByText('면적 산정 제외')).toBeInTheDocument()
    expect(screen.getByText('20㎡ (6.05평)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /안방/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /침실1/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('3개')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: '원본' }))
    expect(screen.getByRole('img', { name: '분석한 평면도' })).toHaveAttribute('src', '/api/floorplans/variants/1/image')
  })
  it('loads the saved AI geometry and selects the 3D result by default', async () => {
    renderPage()

    await waitFor(() => expect(api.getFloorplanVisualization).toHaveBeenCalledOnce())
    expect(api.getFloorplanVisualization).toHaveBeenCalledWith(77)
    expect(screen.getByRole('tab', { name: '3D 분석' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('img', { name: '분석한 평면도' })).not.toBeInTheDocument()
    expect(await screen.findByText('저장된 3D 모델 100')).toBeInTheDocument()
  })


  it('preserves all backend spaces in PUT, reloads them, and moves only after refresh succeeds', async () => {
    const refreshedSpaces = spaces.map((space) => ({ ...space, selectedForConstruction: true }))
    api.getAnalysisSpaces
      .mockResolvedValueOnce(spaces)
      .mockResolvedValueOnce(refreshedSpaces)
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /침실1/ }))
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => expect(api.replaceAnalysisSpaces).toHaveBeenCalledOnce())
    expect(api.replaceAnalysisSpaces).toHaveBeenCalledWith(77, expect.arrayContaining([
      expect.objectContaining({ spaceName: '침실1', selectedForConstruction: true }),
      expect.objectContaining({ spaceName: '드레스룸', selectedForConstruction: true }),
      expect.objectContaining({ spaceName: '복도', selectedForConstruction: false }),
      expect.objectContaining({ spaceName: '다용도실', selectedForConstruction: false }),
      expect.objectContaining({ spaceName: '침실2', selectedForConstruction: false }),
    ]))
    expect(api.replaceAnalysisSpaces.mock.calls[0][1]).toHaveLength(spaces.length)
    await waitFor(() => expect(api.getAnalysisSpaces).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('style page')).toBeInTheDocument()
  })

  it('does not move when PUT fails', async () => {
    api.replaceAnalysisSpaces.mockRejectedValue(new Error('공간 저장 실패'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '다음' }))

    expect(await screen.findByText('공간 저장 실패')).toBeInTheDocument()
    expect(screen.queryByText('style page')).not.toBeInTheDocument()
    expect(api.getAnalysisSpaces).toHaveBeenCalledOnce()
  })

  it('keeps the page and distinguishes a refresh failure after PUT succeeds', async () => {
    api.getAnalysisSpaces
      .mockResolvedValueOnce(spaces)
      .mockRejectedValueOnce(new Error('재조회 실패'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '다음' }))

    expect(await screen.findByText('공간 정보는 저장되었지만 최신 정보를 불러오지 못했습니다. 재조회 실패')).toBeInTheDocument()
    expect(screen.queryByText('style page')).not.toBeInTheDocument()
  })
})
