import { NavLink } from 'react-router-dom'
import homeIcon from '@/assets/user/icons/investment-analysis.svg'
import requestIcon from '@/assets/user/icons/management/request-list.svg'
import quoteIcon from '@/assets/user/icons/request-complete.svg'
import scheduleIcon from '@/assets/user/icons/management/construction.svg'
import settlementIcon from '@/assets/user/icons/management/settings.svg'
import type { ContractorNavigationItem } from '@/types/contractorPortal'

const items: readonly ContractorNavigationItem[] = [
  { id: 'home', label: '홈', destination: '/contractor', icon: homeIcon },
  { id: 'requests', label: '의뢰', destination: '/contractor/requests', icon: requestIcon },
  { id: 'quotes', label: '견적', destination: '/contractor/estimates', icon: quoteIcon },
  { id: 'schedule', label: '일정', icon: scheduleIcon },
  { id: 'settlement', label: '정산', icon: settlementIcon },
]

export default function ContractorBottomNavigation() {
  return (
    <nav aria-label="시공사 주요 메뉴" className="sticky bottom-0 z-20 mt-auto grid h-16 shrink-0 grid-cols-5 border-t border-[#e2e8f0] bg-white">
      {items.map((item) => {
        if (!item.destination) {
          return (
            <button key={item.id} type="button" disabled aria-disabled="true" className="flex flex-col items-center justify-center gap-1 text-[10px] text-[#94a3b8] disabled:cursor-not-allowed">
              <img src={item.icon} alt="" className="h-5 w-5 opacity-55" />
              {item.label}
            </button>
          )
        }

        return (
          <NavLink
            key={item.id}
            to={item.destination}
            end={item.id === 'home'}
            className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563eb] ${isActive ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b]'}`}
          >
            <img src={item.icon} alt="" className="h-5 w-5" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
