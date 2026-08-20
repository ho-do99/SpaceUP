import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ContractorTabNavigation from './ContractorTabNavigation'

describe('ContractorTabNavigation', () => {
  it('shows only summary, floor plan, and before/after photo tabs', () => {
    render(
      <MemoryRouter initialEntries={['/contractor/requests/109']}>
        <ContractorTabNavigation requestId="109" activeTab="summary" />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByRole('link', { name: '요약' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '평면도' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '희망 시공 사진' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'AI 분석' })).not.toBeInTheDocument()
  })
})
