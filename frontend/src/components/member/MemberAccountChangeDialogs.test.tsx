import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemberPasswordChangeDialog, MemberPhoneChangeDialog } from './MemberAccountChangeDialogs'

afterEach(cleanup)

describe('member account change dialogs', () => {
  it('submits only a normalized phone number and keeps the dialog on failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('변경 실패'))
    render(<MemberPhoneChangeDialog open onClose={vi.fn()} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('새 휴대폰 번호'), { target: { value: '01012345678' } })
    fireEvent.click(screen.getByRole('button', { name: '변경하기' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('010-1234-5678'))
    expect(screen.getByRole('dialog', { name: '휴대폰 번호 변경' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('변경 실패')
  })

  it('does not submit mismatched passwords or persist password values', async () => {
    const onSubmit = vi.fn()
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    render(<MemberPasswordChangeDialog open onClose={vi.fn()} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'current-secret' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'new-secret' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'different-secret' } })
    fireEvent.click(screen.getByRole('button', { name: '변경하기' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('새 비밀번호가 일치하지 않습니다.')
    expect(storageSpy).not.toHaveBeenCalled()
    expect(consoleSpy).not.toHaveBeenCalled()
    storageSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  it('sends only current and new passwords and closes after success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<MemberPasswordChangeDialog open onClose={onClose} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'current-secret' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'new-secret' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'new-secret' } })
    fireEvent.click(screen.getByRole('button', { name: '변경하기' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ currentPassword: 'current-secret', newPassword: 'new-secret' }))
    expect(onClose).toHaveBeenCalled()
  })
})
