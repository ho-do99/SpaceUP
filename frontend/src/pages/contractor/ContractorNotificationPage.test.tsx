import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ContractorNotificationPage from './ContractorNotificationPage'
import type { RequestResponse } from '@/types/request'

const mocks = vi.hoisted(() => ({
  getNotifications: vi.fn(), readNotification: vi.fn(), readAllNotifications: vi.fn(), getAssignedRequests: vi.fn(), refresh: vi.fn(),
}))
vi.mock('@/api/notificationApi', () => ({ getNotifications: mocks.getNotifications, readNotification: mocks.readNotification, readAllNotifications: mocks.readAllNotifications }))
vi.mock('@/api/contractorApi', () => ({ getAssignedRequests: mocks.getAssignedRequests }))
vi.mock('@/contexts/useRealtime', () => ({ default: () => ({ latestEvent: null, refreshUnreadNotificationCount: mocks.refresh }) }))

describe('ContractorNotificationPage', () => {
  beforeEach(() => {
    mocks.getNotifications.mockReset().mockResolvedValue({ content: [{ id: 5, type: 'REQUEST', title: '새 의뢰가 도착했습니다', content: 'REQ-99(광주) 의뢰가 배정되었습니다.', read: false, createdAt: new Date().toISOString() }] })
    mocks.getAssignedRequests.mockReset().mockResolvedValue({ content: [{ id: 99, requestCode: 'REQ-99', region: '광주', propertyType: 'APARTMENT', areaM2: 84, status: 'REVIEWING' } as RequestResponse] })
    mocks.readNotification.mockReset().mockResolvedValue(undefined)
    mocks.readAllNotifications.mockReset().mockResolvedValue(undefined)
    mocks.refresh.mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('opens the matching request detail when a request notification is selected', async () => {
    render(<MemoryRouter initialEntries={['/contractor/notifications']}><Routes><Route path="/contractor/notifications" element={<ContractorNotificationPage />} /><Route path="/contractor/requests/:requestId" element={<p>request detail page</p>} /></Routes></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /새 의뢰가 도착했습니다/ }))
    expect(await screen.findByText('request detail page')).toBeInTheDocument()
    expect(mocks.readNotification).toHaveBeenCalledWith(5)
  })
})
