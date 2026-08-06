import { Link } from 'react-router-dom'

export type ContractorCompanyTab =
  | 'basic'
  | 'specialties'
  | 'regions'
  | 'settlement'

interface ContractorCompanyTabsProps {
  activeTab: ContractorCompanyTab
}

const companyTabs: readonly {
  id: ContractorCompanyTab
  label: string
  path: string
}[] = [
  {
    id: 'basic',
    label: '기본 정보',
    path: '/contractor/company',
  },
  {
    id: 'specialties',
    label: '전문 분야',
    path: '/contractor/company/specialties',
  },
  {
    id: 'regions',
    label: '시공 지역',
    path: '/contractor/company/regions',
  },
  {
    id: 'settlement',
    label: '정산',
    path: '/contractor/company/settlement',
  },
]

export default function ContractorCompanyTabs({
  activeTab,
}: ContractorCompanyTabsProps) {
  return (
    <nav
      aria-label="업체 정보 메뉴"
      className="flex w-full gap-[5px] overflow-x-auto"
    >
      {companyTabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <Link
            key={tab.id}
            to={tab.path}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-[34px] min-w-[86px] flex-1 shrink-0 items-center justify-center rounded-full border px-2 text-[10px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
              isActive
                ? 'border-[#2563eb] bg-[#2563eb] text-white'
                : 'border-[#e2e8f0] bg-white text-[#64748b]'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}