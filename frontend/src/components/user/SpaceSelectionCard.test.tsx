import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SpaceSelectionCard from './SpaceSelectionCard'

describe('SpaceSelectionCard', () => {
  afterEach(cleanup)

  it('shows a backend space name and area and toggles it', () => {
    const onToggle = vi.fn()
    render(
      <SpaceSelectionCard
        spaceName="드레스룸"
        areaM2={28}
        isSelected
        onToggle={onToggle}
      />,
    )

    expect(screen.getByText('28㎡ (8.47평)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /드레스룸/ }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('shows excluded areas without rendering a zero value', () => {
    render(
      <SpaceSelectionCard
        spaceName="복도"
        areaM2={null}
        isSelected={false}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByText('면적 산정 제외')).toBeInTheDocument()
    expect(screen.queryByText(/0㎡/)).not.toBeInTheDocument()
  })
})
