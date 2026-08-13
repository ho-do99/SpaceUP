import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getAnalysis, scanFloorPlan, scanStoredFloorPlan } from '@/api/analysisApi'
import { setActiveRequestId } from '@/utils/requestFlow'
import FloorPlanAnalysisLoadingPage from './FloorPlanAnalysisLoadingPage'

vi.mock('@/api/analysisApi', () => ({ scanFloorPlan: vi.fn(), scanStoredFloorPlan: vi.fn(), getAnalysis: vi.fn() }))

const scan = vi.mocked(scanFloorPlan)
const scanStorage = vi.mocked(scanStoredFloorPlan)
const getJob = vi.mocked(getAnalysis)
const floorPlanFile = new File(['floor-plan'], 'floor-plan.png', { type: 'image/png' })
const navigationState = {
  mode: 'multipart',
  floorPlanFile,
  uploadedImagePath: '/api/files/images/floor-plan.png',
  uploadedImageUrl: 'https://spaceup.test/api/files/images/floor-plan.png',
  originalFileName: floorPlanFile.name,
}

function renderLoading(state: unknown = navigationState, strictMode = false) {
  const routes = (
    <MemoryRouter initialEntries={[{ pathname: '/analysis/loading', state }]}>
      <Routes>
        <Route path="/analysis/loading" element={<FloorPlanAnalysisLoadingPage />} />
        <Route path="/analysis/spaces" element={<p>space results</p>} />
        <Route path="/upload" element={<p>upload again</p>} />
        <Route path="/analysis/new/property" element={<p>start again</p>} />
      </Routes>
    </MemoryRouter>
  )

  return render(strictMode ? <StrictMode>{routes}</StrictMode> : routes)
}

describe('FloorPlanAnalysisLoadingPage', () => {
  beforeEach(() => {
    scan.mockReset()
    scanStorage.mockReset()
    getJob.mockReset()
    sessionStorage.clear()
  })
  afterEach(cleanup)

  it('scans once and replaces the route with the space result page when completed', async () => {
    setActiveRequestId(77)
    scan.mockResolvedValue({ requestId: 77, status: 'COMPLETED' })

    renderLoading()

    await waitFor(() => expect(scan).toHaveBeenCalledTimes(1))
    expect(scan).toHaveBeenCalledWith(77, floorPlanFile)
    expect(await screen.findByText('space results')).toBeInTheDocument()
  })

  it('scans only once when React StrictMode re-runs the mount effect', async () => {
    setActiveRequestId(77)
    scan.mockResolvedValue({ requestId: 77, status: 'PENDING' })

    renderLoading(navigationState, true)

    await waitFor(() => expect(scan).toHaveBeenCalledTimes(1))
    expect(scan).toHaveBeenCalledWith(77, floorPlanFile)
  })

  it('does not scan without a request id and lets the user restart', async () => {
    renderLoading()

    expect(await screen.findByRole('alert')).toHaveTextContent('진행 중인 의뢰 정보를 찾을 수 없습니다.')
    expect(scan).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '처음부터 다시 시작' }))
    expect(await screen.findByText('start again')).toBeInTheDocument()
  })

  it('does not scan after route state is lost and lets the user upload again', async () => {
    setActiveRequestId(77)
    renderLoading(null)

    expect(await screen.findByRole('alert')).toHaveTextContent('분석할 평면도 파일을 찾을 수 없습니다.')
    expect(scan).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '평면도 다시 업로드' }))
    expect(await screen.findByText('upload again')).toBeInTheDocument()
  })

  it('shows a failure and only scans again after an explicit retry', async () => {
    setActiveRequestId(77)
    scan
      .mockResolvedValueOnce({ requestId: 77, status: 'FAILED' })
      .mockResolvedValueOnce({ requestId: 77, status: 'COMPLETED' })

    renderLoading()

    expect(await screen.findByRole('alert')).toHaveTextContent('평면도 분석에 실패했습니다.')
    expect(scan).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    await waitFor(() => expect(scan).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('space results')).toBeInTheDocument()
  })

  it('does not poll indefinitely when the synchronous endpoint returns pending', async () => {
    setActiveRequestId(77)
    scan.mockResolvedValue({ requestId: 77, status: 'PENDING' })

    renderLoading()

    expect(await screen.findByRole('alert')).toHaveTextContent('처리 대기 상태입니다.')
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('recovers from an API error without losing the retry file', async () => {
    setActiveRequestId(77)
    scan
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ requestId: 77, status: 'COMPLETED' })

    renderLoading()

    expect(await screen.findByRole('alert')).toHaveTextContent('network unavailable')
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    await waitFor(() => expect(scan).toHaveBeenLastCalledWith(77, floorPlanFile))
  })

  it('uses only the variant id for storage analysis and exposes a persisted FAILED state after 502', async () => {
    setActiveRequestId(77)
    scanStorage.mockRejectedValue(new Error('502'))
    getJob.mockResolvedValue({ requestId: 77, status: 'FAILED' })
    renderLoading({ mode: 'storage', floorPlanVariantId: 1, analysisJobId: 88 })

    expect(await screen.findByRole('alert')).toHaveTextContent('평면도 분석에 실패했습니다.')
    expect(scanStorage).toHaveBeenCalledWith(77, 1)
    expect(scan).not.toHaveBeenCalled()
  })
})
