import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ContractorCompanyRegionsPage from './ContractorCompanyRegionsPage'
import { getMyContractorProfile, updateMyContractorProfile } from '@/api/contractorApi'

vi.mock('@/api/contractorApi', () => ({ getMyContractorProfile: vi.fn(), updateMyContractorProfile: vi.fn() }))
vi.mock('@/components/contractor/ContractorAppBar', () => ({ default: () => <header>업체 정보</header> }))
vi.mock('@/components/contractor/ContractorBottomNavigation', () => ({ default: () => <nav>시공사 메뉴</nav> }))

const getProfile = vi.mocked(getMyContractorProfile)
const updateProfile = vi.mocked(updateMyContractorProfile)

describe('ContractorCompanyRegionsPage', () => {
  beforeEach(() => {
    getProfile.mockReset().mockResolvedValue({ id: 1, memberId: 2, memberName: '담당자', activityRegions: '광주광역시,전라남도', travelDistanceKm: 30 })
    updateProfile.mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('selects the profile travel distance and saves it as a number with activity regions', async () => {
    render(<MemoryRouter><ContractorCompanyRegionsPage /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('button', { name: '30km' })).toHaveAttribute('aria-pressed', 'true'))
    fireEvent.click(screen.getByRole('button', { name: '시공 지역 저장' }))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ activityRegions: '광주광역시,전라남도', travelDistanceKm: 30 }))
    expect(typeof updateProfile.mock.calls[0][0].travelDistanceKm).toBe('number')
  })
})
