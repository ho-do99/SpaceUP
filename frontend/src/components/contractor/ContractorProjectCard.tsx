import { Link } from 'react-router-dom'
import type { ContractorProject } from '@/types/contractorPortal'
import { formatWon } from './contractorEstimateUtils'

export default function ContractorProjectCard({ project }: { project: ContractorProject }) {
  const dateLine = project.status === 'VISIT_SCHEDULED'
    ? `방문 예정 ${project.schedule.visitDate?.slice(5).replace('-', '.')} ${project.schedule.visitTime}`
    : project.status === 'COMPLETED'
      ? `완료 ${project.schedule.completionDate.slice(5).replace('-', '.')}`
      : `착수 ${project.schedule.startDate.slice(5).replace('-', '.')} · 완료 예정 ${project.schedule.completionDate.slice(5).replace('-', '.')}`
  const destination = project.status === 'VISIT_SCHEDULED'
    ? `/contractor/requests/${project.requestId}/visit`
    : `/contractor/projects/${project.projectId}`

  return (
    <article>
      <div className="rounded-xl border border-[#dbe3ef] bg-white p-[14px]">
        <h2 className={`min-w-0 break-words text-sm font-bold leading-5 ${project.status === 'START_SCHEDULED' ? 'text-[#2563eb]' : 'text-[#0f172a]'}`}>{project.name}</h2>
        <p className="mt-1 text-xs leading-[17px] text-[#64748b]">계약 {formatWon(project.contractAmount)} · {project.readOnlyPaymentLabel ?? `담당 ${project.managerName}`}<br />{dateLine}<br />상태 · {project.status === 'VISIT_SCHEDULED' ? '방문 예정' : project.status === 'START_SCHEDULED' ? '착수 예정' : project.status === 'COMPLETED' ? '완료' : '진행 중'}</p>
      </div>
      <Link to={destination} className="mt-3 flex h-12 items-center justify-center rounded-lg border border-[#dbe3ef] bg-white text-sm font-bold text-[#0b2b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">{project.status === 'VISIT_SCHEDULED' ? '방문 일정 확인' : '프로젝트 상세'}</Link>
    </article>
  )
}
