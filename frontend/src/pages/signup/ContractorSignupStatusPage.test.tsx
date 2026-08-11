import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContractorSignupStatusView } from './ContractorSignupStatusPage'
import type { MemberResponse } from '@/types/member'

afterEach(cleanup)

const baseMember: MemberResponse = {
  id: 12,
  email: 'contractor@spaceup.co.kr',
  emailVerified: false,
  name: '김현수',
  phoneNumber: '010-1234-5678',
  phoneVerified: true,
  role: 'CONTRACTOR',
  approvalStatus: 'PENDING',
  applicationNumber: 'ON-260811-000012',
  approvalNumber: null,
  revisionMessage: null,
  revisionDeadline: null,
  createdAt: '2026-08-11T14:32:00',
}

const actions = { onBack: vi.fn(), onEdit: vi.fn(), onResubmit: vi.fn(), onStart: vi.fn() }

describe('contractor approval status mapping', () => {
  it('maps PENDING to the review waiting screen', () => {
    render(<ContractorSignupStatusView member={baseMember} {...actions} />)
    expect(screen.getByText('입점 심사 중입니다')).toBeInTheDocument()
    expect(screen.getByText(/ON-260811-000012/)).toBeInTheDocument()
  })

  it('maps NEEDS_REVISION and calls the real resubmit interaction', () => {
    render(<ContractorSignupStatusView member={{ ...baseMember, approvalStatus: 'NEEDS_REVISION', revisionMessage: '사업장 주소를 확인해 주세요.', revisionDeadline: '2026-08-20T18:00:00' }} {...actions} />)
    expect(screen.getByText('심사 단계에서 보완이 필요합니다')).toBeInTheDocument()
    expect(screen.getByText('사업장 주소를 확인해 주세요.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '보완 자료 재제출' }))
    expect(actions.onResubmit).toHaveBeenCalled()
  })

  it('maps APPROVED to completion and dashboard action', () => {
    render(<ContractorSignupStatusView member={{ ...baseMember, approvalStatus: 'APPROVED', approvalNumber: 'AP-260811-004' }} {...actions} />)
    expect(screen.getByText('파트너 승인이 완료되었습니다')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '대시보드 시작' }))
    expect(actions.onStart).toHaveBeenCalled()
  })
})
