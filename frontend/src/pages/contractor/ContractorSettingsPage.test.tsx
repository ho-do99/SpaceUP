import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ContractorSettingsPage from './ContractorSettingsPage'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'

describe('ContractorSettingsPage logout', () => {
  beforeEach(() => {
    sessionStorage.setItem('accessToken', 'contractor-token')
    sessionStorage.setItem('memberId', '42')
    sessionStorage.setItem('role', 'CONTRACTOR')
    sessionStorage.setItem('unrelated-setting', 'keep')
  })
  afterEach(() => { cleanup(); sessionStorage.clear() })

  it('clears only auth session values and replaces the page with login', async () => {
    render(
      <MemoryRouter initialEntries={['/contractor/settings']}>
        <Routes>
          <Route path="/contractor/settings" element={<ContractorPortalFlowProvider><ContractorSettingsPage /></ContractorPortalFlowProvider>} />
          <Route path="/login" element={<p>login destination</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    const dialog = screen.getByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByText('login destination')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(sessionStorage.getItem('memberId')).toBeNull()
    expect(sessionStorage.getItem('role')).toBeNull()
    expect(sessionStorage.getItem('unrelated-setting')).toBe('keep')
  })
})
