import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { generateInteriorImages, getInteriorImages } from '@/api/analysisApi'
import { ApiClientError } from '@/api/axiosInstance'
import { saveSimulationResult } from '@/utils/simulationResult'
import SimulationGeneratingPage from './SimulationGeneratingPage'

vi.mock('@/api/analysisApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/analysisApi')>()
  return { ...actual, generateInteriorImages: vi.fn(), getInteriorImages: vi.fn() }
})
vi.mock('@/utils/requestFlow', () => ({ getActiveRequestId: () => 7 }))
vi.mock('@/utils/apiAssetUrl', () => ({ resolveApiAssetUrl: (path: string) => `https://spaceup.test${path}` }))
vi.mock('@/utils/simulationResult', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/simulationResult')>()
  return { ...actual, saveSimulationResult: vi.fn() }
})

const generate = vi.mocked(generateInteriorImages)
const getStatus = vi.mocked(getInteriorImages)

function renderGeneratingPage(strictMode = false, withRouteState = true) {
  const routes = (
    <MemoryRouter initialEntries={[{
      pathname: '/analysis/simulation/generating',
      state: withRouteState ? { styleId: 'modern', uploadedImagePath: '/api/files/images/room.png' } : null,
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

async function advancePoll() {
  await act(async () => { await vi.advanceTimersByTimeAsync(2_500) })
}

describe('SimulationGeneratingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    sessionStorage.clear()
    generate.mockReset()
    getStatus.mockReset()
    vi.mocked(saveSimulationResult).mockReset()
  })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('GETs first, POSTs once for NOT_STARTED, and saves the real result', async () => {
    getStatus.mockResolvedValue({ status: 'NOT_STARTED', imageUrls: [] })
    generate.mockResolvedValue({ imageUrls: ['/api/files/images/generated.png'] })
    renderGeneratingPage(true)

    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(getStatus).toHaveBeenCalledTimes(1)
    expect(generate).toHaveBeenCalledTimes(1)
    expect(saveSimulationResult).toHaveBeenCalledWith(expect.objectContaining({
      beforeImageUrl: 'https://spaceup.test/api/files/images/room.png',
      afterImageUrl: 'https://spaceup.test/api/files/images/generated.png',
    }))
  })

  it('recovers IN_PROGRESS after refresh, polls, and never POSTs', async () => {
    sessionStorage.setItem('spaceup.simulationGenerationContext', JSON.stringify({
      requestId: 7, styleId: 'modern', uploadedImagePath: '/api/files/images/room.png',
      uploadedImageUrl: 'https://spaceup.test/api/files/images/room.png',
    }))
    getStatus
      .mockResolvedValueOnce({ status: 'IN_PROGRESS', imageUrls: [] })
      .mockResolvedValueOnce({ status: 'COMPLETED', imageUrls: ['/api/files/images/recovered.png'] })
    renderGeneratingPage(false, false)

    await waitFor(() => expect(getStatus).toHaveBeenCalledTimes(1))
    expect(generate).not.toHaveBeenCalled()
    await advancePoll()
    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(generate).not.toHaveBeenCalled()
  })

  it('reuses COMPLETED image URLs without POST', async () => {
    getStatus.mockResolvedValue({ status: 'COMPLETED', imageUrls: ['/api/files/images/existing.png'] })
    renderGeneratingPage()
    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(generate).not.toHaveBeenCalled()
  })

  it('switches a POST 409 to GET polling without another POST', async () => {
    getStatus
      .mockResolvedValueOnce({ status: 'NOT_STARTED', imageUrls: [] })
      .mockResolvedValueOnce({ status: 'IN_PROGRESS', imageUrls: [] })
      .mockResolvedValueOnce({ status: 'COMPLETED', imageUrls: ['/api/files/images/conflict.png'] })
    generate.mockRejectedValue(new ApiClientError('already running', 'http', 409))
    renderGeneratingPage()

    await waitFor(() => expect(getStatus).toHaveBeenCalledTimes(2))
    expect(generate).toHaveBeenCalledTimes(1)
    await advancePoll()
    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('uses a completed result immediately after POST 409', async () => {
    getStatus
      .mockResolvedValueOnce({ status: 'NOT_STARTED', imageUrls: [] })
      .mockResolvedValueOnce({ status: 'COMPLETED', imageUrls: ['/api/files/images/conflict-complete.png'] })
    generate.mockRejectedValue(new ApiClientError('conflict', 'http', 409))
    renderGeneratingPage()
    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('does not loop POST when status is NOT_STARTED after a 409', async () => {
    getStatus.mockResolvedValue({ status: 'NOT_STARTED', imageUrls: [] })
    generate.mockRejectedValue(new ApiClientError('conflict', 'http', 409))
    renderGeneratingPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('AI 이미지 생성 상태가 초기화되었습니다.')
    expect(getStatus).toHaveBeenCalledTimes(2)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it.each([403, 404])('stops on a GET %s without POSTing', async (status) => {
    getStatus.mockRejectedValue(new ApiClientError('lookup failed', 'http', status))
    renderGeneratingPage()
    expect(await screen.findByRole('alert')).toHaveTextContent(status === 403 ? '권한이 없습니다' : 'lookup failed')
    expect(getStatus).toHaveBeenCalledTimes(1)
    expect(generate).not.toHaveBeenCalled()
  })

  it('retries with GET first and only POSTs when the refreshed status is NOT_STARTED', async () => {
    getStatus
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ status: 'NOT_STARTED', imageUrls: [] })
    generate.mockResolvedValue({ imageUrls: ['/api/files/images/retry.png'] })
    renderGeneratingPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('network unavailable')
    fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }))
    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(getStatus).toHaveBeenCalledTimes(2)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('retries with GET first and polls instead of POSTing when generation is in progress', async () => {
    getStatus
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ status: 'IN_PROGRESS', imageUrls: [] })
      .mockResolvedValueOnce({ status: 'COMPLETED', imageUrls: ['/api/files/images/retry-recovered.png'] })
    renderGeneratingPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('temporary failure')
    fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }))
    await waitFor(() => expect(getStatus).toHaveBeenCalledTimes(2))
    expect(generate).not.toHaveBeenCalled()
    await advancePoll()
    expect(await screen.findByText('generated result')).toBeInTheDocument()
    expect(generate).not.toHaveBeenCalled()
  })

  it('stops polling after about one minute and waits for an explicit retry', async () => {
    getStatus.mockResolvedValue({ status: 'IN_PROGRESS', imageUrls: [] })
    renderGeneratingPage()
    await waitFor(() => expect(getStatus).toHaveBeenCalledTimes(1))
    await act(async () => { await vi.advanceTimersByTimeAsync(62_500) })
    expect(await screen.findByRole('alert')).toHaveTextContent('AI 이미지 생성 시간이 오래 걸리고 있습니다.')
    expect(getStatus).toHaveBeenCalledTimes(25)
    expect(generate).not.toHaveBeenCalled()
  })

  it('cleans up polling on unmount', async () => {
    getStatus.mockResolvedValue({ status: 'IN_PROGRESS', imageUrls: [] })
    const view = renderGeneratingPage()
    await waitFor(() => expect(getStatus).toHaveBeenCalledTimes(1))
    view.unmount()
    await advancePoll()
    expect(getStatus).toHaveBeenCalledTimes(1)
    expect(generate).not.toHaveBeenCalled()
  })
})
