import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SpaceSelectionCard from './SpaceSelectionCard'
import type { AnalyzedSpaceOption } from '@/mocks/analysisSpaces'

const option: AnalyzedSpaceOption = {
  id: 'living-room',
  name: '거실',
  icon: 'living',
  isRecommendationSupported: true,
}

describe('SpaceSelectionCard', () => {
  afterEach(cleanup)

  it('shows the backend area without changing the existing toggle id', () => {
    const onToggle = vi.fn()
    render(
      <SpaceSelectionCard
        option={option}
        areaM2={28}
        isSelected
        onToggle={onToggle}
      />,
    )

    expect(screen.getByText('28㎡ (8.47평)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /거실/ }))
    expect(onToggle).toHaveBeenCalledWith('living-room')
  })

  it('shows excluded areas without rendering a zero value', () => {
    render(
      <SpaceSelectionCard
        option={option}
        areaM2={null}
        isSelected={false}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByText('면적 산정 제외')).toBeInTheDocument()
    expect(screen.queryByText(/0㎡/)).not.toBeInTheDocument()
  })
})
