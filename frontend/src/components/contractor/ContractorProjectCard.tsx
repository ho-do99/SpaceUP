import { Link } from 'react-router-dom'
import type { ContractorProject } from '@/types/contractorPortal'
import { formatWon } from './contractorEstimateUtils'
import ContractorProjectStatusBadge from './ContractorProjectStatusBadge'

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
    <article className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2"><h2 className="min-w-0 break-words text-sm font-bold leading-5 text-[#0f172a]">{project.name}</h2><ContractorProjectStatusBadge status={project.status} /></div>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">계약 {formatWon(project.contractAmount)} · {project.readOnlyPaymentLabel ?? `담당 ${project.managerName}`}<br />{dateLine}</p>
      <Link to={destination} className="mt-3 flex h-10 items-center justify-center rounded-lg border border-[#2563eb] text-xs font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">{project.status === 'VISIT_SCHEDULED' ? '방문 일정 확인' : '프로젝트 상세'}</Link>
    </article>
  )
}
