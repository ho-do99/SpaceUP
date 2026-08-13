import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { getMember, updateMember } from '@/api/memberApi'
import MyPage from './MyPage'

vi.mock('@/api/memberApi', () => ({ getMember: vi.fn(), updateMember: vi.fn() }))

const getMemberRequest = vi.mocked(getMember)
const updateMemberRequest = vi.mocked(updateMember)
const member = {
  id: 17, email: 'before@spaceup.test', name: '기존 이름', phoneNumber: '010-1234-5678',
  phoneVerified: true, emailVerified: true, role: 'LANDLORD' as const, approvalStatus: 'APPROVED' as const,
  applicationNumber: null, approvalNumber: null, revisionMessage: null, revisionDeadline: null,
  createdAt: '2026-08-12T00:00:00',
}

describe('MyPage landlord profile editing', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem('memberId', '17')
    getMemberRequest.mockReset()
      .mockResolvedValueOnce(member)
      .mockResolvedValueOnce({ ...member, name: '새 이름', email: 'after@spaceup.test' })
    updateMemberRequest.mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('updates the editable backend fields and renders the re-fetched member', async () => {
    render(<MemoryRouter><MyPage /></MemoryRouter>)
    expect(await screen.findByText('before@spaceup.test')).toBeInTheDocument()

    const editButton = screen.getByRole('button', { name: '개인정보 수정' })
    expect(editButton).toBeEnabled()
    fireEvent.click(editButton)
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '새 이름' } })
    fireEvent.change(screen.getByLabelText('로그인 이메일'), { target: { value: 'after@spaceup.test' } })
    fireEvent.click(screen.getByRole('button', { name: '수정하기' }))

    await waitFor(() => expect(updateMemberRequest).toHaveBeenCalledWith(17, {
      name: '새 이름', email: 'after@spaceup.test',
    }))
    expect(getMemberRequest).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('after@spaceup.test')).toBeInTheDocument()
    expect(screen.getByText('새 이름')).toBeInTheDocument()
  })
})
