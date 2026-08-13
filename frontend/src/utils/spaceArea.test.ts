import { describe, expect, it } from 'vitest'
import { formatSpaceArea, sumSelectedSpaceAreaM2 } from './spaceArea'

describe('space area presentation', () => {
  it('formats the backend square-meter value with its pyeong equivalent', () => {
    expect(formatSpaceArea(28)).toBe('28㎡ (8.47평)')
    expect(formatSpaceArea(12.5)).toBe('12.5㎡ (3.78평)')
  })

  it('does not convert an excluded area to zero', () => {
    expect(formatSpaceArea(null)).toBe('면적 산정 제외')
  })

  it('sums selected square-meter values before converting the total', () => {
    const spaces = [
      { spaceName: '거실', spaceAreaM2: 28, selectedForConstruction: true },
      { spaceName: '주방', spaceAreaM2: 12.5, selectedForConstruction: true },
      { spaceName: '방1', spaceAreaM2: 15, selectedForConstruction: false },
      { spaceName: '발코니', spaceAreaM2: null, selectedForConstruction: true },
    ]

    const totalAreaM2 = sumSelectedSpaceAreaM2(spaces)

    expect(totalAreaM2).toBe(40.5)
    expect(formatSpaceArea(totalAreaM2!)).toBe('40.5㎡ (12.25평)')
  })
})
