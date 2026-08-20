import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { deleteEstimateRequest, getMyEstimateRequests } from '@/api/requestApi'
import EstimateRequestHistoryPage from './EstimateRequestHistoryPage'

vi.mock('@/api/requestApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/requestApi')>()
  return { ...actual, deleteEstimateRequest: vi.fn(), getMyEstimateRequests: vi.fn() }
})

const getRequests = vi.mocked(getMyEstimateRequests)
const deleteRequest = vi.mocked(deleteEstimateRequest)

function renderPage() {
  return render(<MemoryRouter><EstimateRequestHistoryPage /></MemoryRouter>)
}

describe('EstimateRequestHistoryPage request deletion', () => {
  beforeEach(() => {
    getRequests.mockReset().mockResolvedValue({
      content: [{
        id: 17,
        requestCode: 'REQ-260820-000017',
        region: '광주 북구',
        propertyType: 'APARTMENT',
        areaM2: 84,
        requestedItems: '바닥재, 벽지, 조명',
        status: 'QUOTE_REQUESTED',
        createdAt: '2026-08-20T09:00:00',
        contractorNames: ['마블건축'],
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 100,
    })
    deleteRequest.mockReset().mockResolvedValue(undefined)
    sessionStorage.setItem('spaceup.activeRequestId', '17')
  })

  afterEach(() => {
    cleanup()
    sessionStorage.clear()
  })

  it('confirms deletion, calls the owner DELETE API, and removes the card', async () => {
    renderPage()
    expect(await screen.findByText('마블건축')).toBeInTheDocument()
    expect(screen.getByText('총 1건')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '마블건축 견적 요청 삭제' }))
    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText('견적 요청을 삭제하시겠어요?')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteRequest).toHaveBeenCalledWith(17))
    await waitFor(() => expect(screen.queryByText('마블건축')).not.toBeInTheDocument())
    expect(screen.getByText('총 0건')).toBeInTheDocument()
    expect(sessionStorage.getItem('spaceup.activeRequestId')).toBeNull()
  })

  it('keeps the card and shows the server message when deletion fails', async () => {
    deleteRequest.mockRejectedValue(new Error('진행 중인 요청은 삭제할 수 없습니다.'))
    renderPage()
    expect(await screen.findByText('마블건축')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '마블건축 견적 요청 삭제' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('진행 중인 요청은 삭제할 수 없습니다.')
    expect(screen.getByRole('button', { name: '마블건축 견적 요청 삭제' })).toBeInTheDocument()
    expect(screen.getByText('총 1건')).toBeInTheDocument()
  })
})
