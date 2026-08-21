import type { ContractorVisitStatus } from '@/types/contractorPortal'

const tabs: readonly { status: ContractorVisitStatus; label: string }[] = [
  { status: 'UNSCHEDULED', label: '미등록' },
  { status: 'SCHEDULED', label: '방문 예정' },
  { status: 'CHANGE_REQUESTED', label: '변경 요청' },
  { status: 'COMPLETED', label: '방문 완료' },
]

interface ContractorVisitStatusTabsProps {
  status: ContractorVisitStatus
  availableStatuses: readonly ContractorVisitStatus[]
  onSelect: (status: ContractorVisitStatus) => void
  changeRequestLabel?: string
}

export default function ContractorVisitStatusTabs({ status, availableStatuses, onSelect, changeRequestLabel }: ContractorVisitStatusTabsProps) {
  return (
    <div className="grid grid-cols-4 gap-1" aria-label="현장 방문 상태">
      {tabs.map((tab) => {
        const active = status === tab.status
        const enabled = availableStatuses.includes(tab.status)
        return (
          <button
            key={tab.status}
            type="button"
            aria-current={active ? 'step' : undefined}
            disabled={!enabled}
            onClick={() => onSelect(tab.status)}
            className={`h-[34px] rounded-full border px-1 text-[10px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] ${active ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748b]'} disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {tab.status === 'CHANGE_REQUESTED' && changeRequestLabel ? changeRequestLabel : tab.label}
          </button>
        )
      })}
    </div>
  )
}
