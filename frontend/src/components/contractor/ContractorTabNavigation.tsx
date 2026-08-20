import { NavLink } from 'react-router-dom'
import type { ContractorRequestDetailTab } from '@/types/contractorPortal'

interface ContractorTabNavigationProps {
  requestId: string
  activeTab: ContractorRequestDetailTab
}

const tabs: readonly { id: ContractorRequestDetailTab; label: string; suffix: string }[] = [
  { id: 'summary', label: '요약', suffix: '' },
  { id: 'floor-plan', label: '평면도', suffix: '/floor-plan' },
  { id: 'photos', label: '희망 시공 사진', suffix: '/photos' },
]

export default function ContractorTabNavigation({ requestId, activeTab }: ContractorTabNavigationProps) {
  return (
    <nav aria-label="의뢰 상세 자료" className="grid h-[38px] grid-cols-3 gap-1.5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={`/contractor/requests/${requestId}${tab.suffix}`}
          end={tab.id === 'summary'}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`flex h-[34px] min-w-0 items-center justify-center rounded-[17px] border px-1 text-center font-bold leading-[16px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${tab.id === 'photos' ? 'text-[10px]' : 'text-[11px]'} ${activeTab === tab.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
