import { useEffect, useMemo, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorProjectCard from '@/components/contractor/ContractorProjectCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import type { ContractorProjectFilter, ContractorProjectStatus } from '@/types/contractorPortal'
import type { ContractorProject } from '@/types/contractorPortal'
import { getContractorProjects } from '@/api/projectApi'
import { projectToPortal } from '@/utils/projectAdapter'

const filters: readonly { id: ContractorProjectFilter; label: string; statuses?: readonly ContractorProjectStatus[] }[] = [
  { id: 'all', label: '전체' }, { id: 'visit_scheduled', label: '방문 예정', statuses: ['VISIT_SCHEDULED'] },
  { id: 'start_scheduled', label: '착수 예정', statuses: ['START_SCHEDULED'] },
  { id: 'in_progress', label: '시공 중', statuses: ['IN_PROGRESS', 'COMPLETION_REQUESTED'] },
  { id: 'completed', label: '완료', statuses: ['COMPLETED'] },
]

export default function ContractorProjectListPage() {
  const { projects: mockProjects } = useContractorPortalFlow()
  const [projects, setProjects] = useState<readonly ContractorProject[]>(mockProjects)
  useEffect(() => {
    getContractorProjects().then((page) => {
      const content = Array.isArray(page) ? page : page.content
      setProjects(content.map(projectToPortal))
    }).catch(() => setProjects(mockProjects))
  }, [mockProjects])
  const [filter, setFilter] = useState<ContractorProjectFilter>('all')
  const selected = filters.find((item) => item.id === filter)
  const visible = useMemo(() => selected?.statuses ? projects.filter((project) => selected.statuses?.includes(project.status)) : projects, [projects, selected])
  const count = (statuses: readonly ContractorProjectStatus[]) => projects.filter((project) => statuses.includes(project.status)).length
  return <ContractorMobileShell innerClassName="h-dvh min-h-0"><ContractorAppBar title="계약 · 시공 목록" /><main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3"><p className="text-xs leading-5 text-[#64748b]">계약 및 시공 상태를 한눈에 확인하세요.</p><p className="mt-2 rounded-lg bg-[#eff6ff] px-3 py-2 text-[11px] font-bold text-[#2563eb]">전체 {projects.length} · 방문 {count(['VISIT_SCHEDULED'])} · 착수 {count(['START_SCHEDULED'])} · 진행 {count(['IN_PROGRESS', 'COMPLETION_REQUESTED'])} · 완료 {count(['COMPLETED'])}</p><div role="group" aria-label="프로젝트 상태 필터" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">{filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-9 shrink-0 rounded-full border px-3 text-xs font-bold ${filter === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}>{item.label}</button>)}</div><div className="mt-3 space-y-3">{visible.length ? visible.map((project) => <ContractorProjectCard key={project.projectId} project={project} />) : <ContractorEmptyState title="해당 상태의 프로젝트가 없습니다" description="다른 상태 필터를 선택해 주세요." />}</div></main><ContractorBottomNavigation /></ContractorMobileShell>
}
