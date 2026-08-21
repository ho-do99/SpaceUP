import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ContractorDetailPage from './ContractorDetailPage'
import { getContractor } from '@/api/contractorApi'
import type { ContractorSummary } from '@/mocks/contractors'

vi.mock('@/api/contractorApi', () => ({ getContractor: vi.fn() }))

const mockedGetContractor = vi.mocked(getContractor)

const recommendation: ContractorSummary = {
  id: '7',
  companyName: '마블건축',
  initial: '마',
  region: '요청 지역 시공 가능',
  experienceLabel: 'SpaceUP 추천 시공사',
  rating: 4.8,
  reviewCount: 30,
  matchingScore: 90,
  reviewScore: 35,
  priceScore: 35,
  responseSpeedScore: 20,
  similarProjectCount: 0,
  specialties: ['바닥재', '도배', '조명'],
  recommendation: '리뷰 35점 · 가격 35점 · 응답속도 20점',
  description: '추천 시공사입니다.',
  budgetRangeLabel: '10,000,000~20,000,000원',
  availableDateLabel: '2026-08-28 이후',
  responseTimeLabel: '빠른 응답 가능',
  recommendationReasons: ['리뷰 평점과 후기 수 반영', '예산 범위 적합', '응답속도 기준 반영'],
  iconSrc: '/building.svg',
  portfolioSrc: '/portfolio.png',
  portfolioAlt: '마블건축 포트폴리오',
}

describe('ContractorDetailPage recommendation breakdown', () => {
  beforeEach(() => {
    mockedGetContractor.mockReset().mockResolvedValue({
      id: 1,
      memberId: 7,
      memberName: '시연용',
      companyName: '마블건축',
      activityRegions: '광주 전지역',
      specialties: '바닥재,도배,조명',
      rating: 4.8,
      reviewCount: 30,
      estimateMin: 10_000_000,
      estimateMax: 20_000_000,
      availableFromDate: '2026-08-28',
    })
  })

  afterEach(cleanup)

  it('keeps and explains the selected contractor recommendation scores', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/contractors/7', state: { contractor: recommendation } }]}>
        <Routes>
          <Route path="/contractors/:contractorId" element={<ContractorDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('매칭 점수 90점')).toBeInTheDocument()
    expect(screen.getByText('리뷰 35점')).toBeInTheDocument()
    expect(screen.getByText('가격 35점')).toBeInTheDocument()
    expect(screen.getByText('응답속도 20점')).toBeInTheDocument()
    expect(screen.queryByText('일정 20점')).not.toBeInTheDocument()
  })
})
