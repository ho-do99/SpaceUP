import { NavLink } from 'react-router-dom'

interface NavigationIconProps {
  className?: string
}

function HomeIcon({ className }: NavigationIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
}

function ClipboardListIcon({ className }: NavigationIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h4" /></svg>
}

function ReceiptTextIcon({ className }: NavigationIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2Z" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h3" /></svg>
}

function CalendarDaysIcon({ className }: NavigationIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /></svg>
}

function WalletCardsIcon({ className }: NavigationIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M16 13h5" /><circle cx="16" cy="13" r="1" /><path d="M5 5V3h12v2" /></svg>
}

const items = [
  { id: 'home', label: '홈', destination: '/contractor', Icon: HomeIcon },
  { id: 'requests', label: '의뢰', destination: '/contractor/requests', Icon: ClipboardListIcon },
  { id: 'quotes', label: '견적', destination: '/contractor/estimates', Icon: ReceiptTextIcon },
  { id: 'schedule', label: '일정', destination: '/contractor/projects', Icon: CalendarDaysIcon },
  { id: 'settlement', label: '정산', destination: '/contractor/settlements', Icon: WalletCardsIcon },
] as const

export default function ContractorBottomNavigation() {
  return (
    <nav aria-label="시공사 주요 메뉴" className="sticky bottom-0 z-20 mt-auto grid h-16 shrink-0 grid-cols-5 border-t border-[#e2e8f0] bg-white">
      {items.map((item) => {
        const { Icon } = item

        return (
          <NavLink
            key={item.id}
            to={item.destination}
            end={item.id === 'home'}
            className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563eb] ${isActive ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b]'}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
