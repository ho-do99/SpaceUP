import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import LandingPage from './LandingPage'
import { shouldShowInitialLanding } from '@/utils/initialLanding'

function LocationProbe() {
  return <p>{useLocation().pathname}</p>
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('LandingPage', () => {
  it('shows only for an unauthenticated initial root entry', () => {
    expect(shouldShowInitialLanding('/', null)).toBe(true)
    expect(shouldShowInitialLanding('/', 'existing-access-token')).toBe(false)
    expect(shouldShowInitialLanding('/login', null)).toBe(false)
    expect(shouldShowInitialLanding('/signup/landlord', null)).toBe(false)
  })

  it('shows only the SpaceUP brand and replaces the entry with login after 1500ms', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage onComplete={onComplete} />} />
          <Route path="/login" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'SpaceUP' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1499))
    expect(onComplete).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByText('/login')).toBeInTheDocument()
  })
})
