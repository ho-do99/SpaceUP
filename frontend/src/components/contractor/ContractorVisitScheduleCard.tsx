import type { ContractorVisitSchedule } from '@/types/contractorPortal'

export default function ContractorVisitScheduleCard({ schedule }: { schedule: ContractorVisitSchedule }) {
  const fields = [
    ['방문 날짜', schedule.date.replace(/-/g, '.')],
    ['방문 시간', schedule.time],
    ['방문 주소', schedule.address],
    ['담당자', schedule.managerName],
    ['방문 메모', schedule.note || '등록된 메모가 없습니다.'],
  ] as const

  return (
    <dl className="space-y-3">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="mb-1 text-[11px] font-bold text-[#1e293b]">{label}</dt>
          <dd className="min-h-12 break-words rounded-lg border border-[#e2e8f0] bg-white px-3 py-3 text-xs leading-5 text-[#64748b]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
