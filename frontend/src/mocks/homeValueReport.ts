export interface HomeValueBarItem {
  label: string
  displayValue: string
  widthPercent: number
  tone: 'current' | 'expected'
}

export interface HomeValueMetric {
  label: string
  displayValue: string
  emphasis: 'brand' | 'default' | 'positive'
}

export interface HomeValueReportData {
  title: string
  description: string
  simulationTitle: string
  increaseBadge: string
  bars: ReadonlyArray<HomeValueBarItem>
  simulationDescription: string
  metrics: ReadonlyArray<HomeValueMetric>
  annualRecoveryRate: string
  annualAdditionalIncome: string
  cautions: readonly string[]
}

export const homeValueReport: HomeValueReportData = {
  title: '주택 가치 상승 분석 결과입니다',
  description: '리모델링 후 예상되는 주택 가치 변화를 확인하세요.',
  simulationTitle: '월세 상승 시뮬레이션',
  increaseBadge: '+20만원 / 월',
  bars: [
    {
      label: '현재 월세',
      displayValue: '60만원',
      widthPercent: 70,
      tone: 'current',
    },
    {
      label: '시공 후 예상 월세',
      displayValue: '80만원',
      widthPercent: 100,
      tone: 'expected',
    },
  ],
  simulationDescription: '리모델링 후 월세가 월 20만원 상승할 것으로 예상됩니다.',
  metrics: [
    {
      label: '총 리모델링 예상 비용',
      displayValue: '5,650,000원~7,750,000원',
      emphasis: 'brand',
    },
    {
      label: '예상 비용 회수 기간',
      displayValue: '약 29개월~39개월',
      emphasis: 'default',
    },
  ],
  annualRecoveryRate: '약 31.0%~42.5%',
  annualAdditionalIncome: '연 240만원',
  cautions: [
    '본 리포트는 예상 수치로 실제 결과와 다를 수 있습니다.',
    '시공 상태, 지역 시세 및 시장 상황에 따라 변동될 수 있습니다.',
  ],
}
