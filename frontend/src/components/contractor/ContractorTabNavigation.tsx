import { NavLink } from 'react-router-dom'
import type { ContractorRequestDetailTab } from '@/types/contractorPortal'

interface ContractorTabNavigationProps {
  requestId: string
  activeTab: ContractorRequestDetailTab
}

const tabs: readonly { id: ContractorRequestDetailTab; label: string; suffix: string }[] = [
  { id: 'summary', label: '요약', suffix: '' },
  { id: 'floor-plan', label: '평면도', suffix: '/floor-plan' },
  { id: 'photos', label: '집 사진', suffix: '/photos' },
  { id: 'analysis', label: 'AI 분석', suffix: '/analysis' },
]

export default function ContractorTabNavigation({ requestId, activeTab }: ContractorTabNavigationProps) {
  return (
    <nav aria-label="의뢰 상세 자료" className="grid grid-cols-4 gap-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={`/contractor/requests/${requestId}${tab.suffix}`}
          end={tab.id === 'summary'}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`flex h-9 items-center justify-center rounded-full border text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${activeTab === tab.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#cbd5e1] bg-white text-[#64748b]'}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
