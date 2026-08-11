import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EstimatePage from './EstimatePage'
import { getQuote, requestQuoteRevision } from '@/api/estimateApi'

vi.mock('@/api/estimateApi', () => ({
  getQuote: vi.fn(),
  requestQuoteRevision: vi.fn(),
}))

const mockedGetQuote = vi.mocked(getQuote)
const mockedRequestQuoteRevision = vi.mocked(requestQuoteRevision)

function renderEstimate(routeId = '33') {
  return render(
    <MemoryRouter initialEntries={[`/estimate/${routeId}`]}>
      <Routes>
        <Route path="/estimate/:id" element={<EstimatePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EstimatePage quote revision identity', () => {
  beforeEach(() => {
    mockedGetQuote.mockReset()
    mockedRequestQuoteRevision.mockReset().mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('uses the QuoteResponse.id returned by the backend for revision requests', async () => {
    mockedGetQuote.mockResolvedValue({
      id: 77,
      requestId: 21,
      contractorId: 5,
      contractorName: '스페이스업 인테리어',
      totalAmount: 5_000_000,
      status: 'SUBMITTED',
      revisionCount: 0,
      items: [],
    })
    renderEstimate('33')

    await waitFor(() => expect(mockedGetQuote).toHaveBeenCalledWith(33))
    fireEvent.click(screen.getByRole('button', { name: '수정 요청' }))
    const textarea = screen.getByLabelText('수정 요청 내용')
    const submit = screen.getByRole('button', { name: '수정 요청하기' })
    expect(submit).toBeDisabled()
    fireEvent.change(textarea, { target: { value: '  자재비를 확인해 주세요.  ' } })
    fireEvent.click(submit)

    await waitFor(() => expect(mockedRequestQuoteRevision).toHaveBeenCalledWith(77, { note: '자재비를 확인해 주세요.' }))
    expect(await screen.findByText('견적 수정 요청을 보냈습니다.')).toBeInTheDocument()
  })

  it('does not submit when a QuoteResponse.id cannot be loaded and keeps the dialog input', async () => {
    mockedGetQuote.mockRejectedValue(new Error('not found'))
    renderEstimate('21')

    await waitFor(() => expect(mockedGetQuote).toHaveBeenCalledWith(21))
    fireEvent.click(screen.getByRole('button', { name: '수정 요청' }))
    const textarea = screen.getByLabelText('수정 요청 내용')
    fireEvent.change(textarea, { target: { value: '일정을 수정해 주세요.' } })
    fireEvent.click(screen.getByRole('button', { name: '수정 요청하기' }))

    expect(mockedRequestQuoteRevision).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: '견적 수정 요청' })).toBeInTheDocument()
    expect(textarea).toHaveValue('일정을 수정해 주세요.')
    expect(screen.getByRole('alert')).toHaveTextContent('견적 정보를 확인할 수 없습니다.')
  })
})
