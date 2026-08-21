import { describe, expect, it } from 'vitest'
import { recommendationToSummary } from './contractorAdapter'

describe('recommendationToSummary', () => {
  it('presents the recommendation breakdown as review, price, and response speed', () => {
    const summary = recommendationToSummary({
      contractorId: 7,
      companyName: '마블건축',
      rating: 4.8,
      reviewCount: 30,
      estimateMin: 10_000_000,
      estimateMax: 20_000_000,
      availableDate: '2026-08-28',
      reviewScore: 34.72,
      priceScore: 35,
      scheduleScore: 20,
      matchScore: 89.72,
      recommendationRank: 1,
    })

    expect(summary.matchingScore).toBe(90)
    expect(summary.reviewScore).toBe(35)
    expect(summary.priceScore).toBe(35)
    expect(summary.responseSpeedScore).toBe(20)
    expect(summary.recommendation).toBe('리뷰 35점 · 가격 35점 · 응답속도 20점')
    expect(summary.recommendation).not.toContain('일정')
  })
})
