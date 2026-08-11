import { useEffect, useMemo, useState } from 'react'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorProjectCard from '@/components/contractor/ContractorProjectCard'
import type { ContractorProject, ContractorProjectFilter, ContractorProjectStatus } from '@/types/contractorPortal'
import { getContractorProjects } from '@/api/projectApi'

const filters: readonly { id: ContractorProjectFilter; label: string; statuses?: readonly ContractorProjectStatus[] }[] = [
  { id: 'all', label: '전체' }, { id: 'visit_scheduled', label: '방문 예정', statuses: ['VISIT_SCHEDULED'] },
  { id: 'start_scheduled', label: '착수 예정', statuses: ['START_SCHEDULED'] },
  { id: 'in_progress', label: '시공 중', statuses: ['IN_PROGRESS', 'COMPLETION_REQUESTED'] },
  { id: 'completed', label: '완료', statuses: ['COMPLETED'] },
]

export default function ContractorProjectListPage() {
  const [projects, setProjects] = useState<ContractorProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getContractorProjects().then((page) => {
      if (!active) return
      setProjects(page.content.map((project) => ({
        projectId: String(project.id), estimateId: String(project.quoteId), requestId: String(project.requestId),
        name: project.requestCode || project.address || `프로젝트 #${project.id}`,
        customerName: project.customerName || '고객', managerName: project.contractorName || '담당자', address: project.address || '-',
        contractAmount: project.contractAmount || 0, contractDate: project.contractDate || '-',
        constructionItems: project.constructionItems?.split(',').map((item) => item.trim()).filter(Boolean) || [],
        lightingNotice: '', status: project.status,
        schedule: { startDate: project.startDate || '-', completionDate: project.completionDate || '-' },
        checklist: project.checklist?.map((item) => ({ ...item, id: String(item.id) })) || [],
        customerRequest: project.customerRequest || '',
      })))
    }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : '프로젝트 목록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])
  const [filter, setFilter] = useState<ContractorProjectFilter>('all')
  const selected = filters.find((item) => item.id === filter)
  const visible = useMemo(() => selected?.statuses ? projects.filter((project) => selected.statuses?.includes(project.status)) : projects, [projects, selected])
  const count = (statuses: readonly ContractorProjectStatus[]) => projects.filter((project) => statuses.includes(project.status)).length
  return <ContractorMobileShell innerClassName="h-dvh min-h-0"><ContractorAppBar title="계약 · 시공 목록" /><main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3"><p className="text-xs leading-5 text-[#64748b]">계약과 시공 진행 상태를 관리하세요.</p><section aria-label="프로젝트 현황" className="mt-2 grid grid-cols-2 gap-[10px]"><div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">착수 예정</p><p className="mt-1 text-[19px] font-bold text-[#0b2b59]">{count(['START_SCHEDULED'])}건</p></div><div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">진행 중</p><p className="mt-1 text-[19px] font-bold text-[#0b2b59]">{count(['IN_PROGRESS', 'COMPLETION_REQUESTED'])}건</p></div><div className="h-[86px] rounded-[10px] border border-[#e2e8f0] bg-white p-3"><p className="text-[11px] text-[#64748b]">완료</p><p className="mt-1 text-[19px] font-bold text-[#0b2b59]">{count(['COMPLETED'])}건</p></div></section><div role="group" aria-label="프로젝트 상태 필터" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">{filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`h-9 shrink-0 rounded-full border px-3 text-xs font-bold ${filter === item.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}>{item.label}</button>)}</div><div className="mt-3 space-y-3">{loading ? <p className="py-10 text-center text-xs text-[#64748b]">프로젝트를 불러오는 중입니다.</p> : error ? <div className="py-8 text-center"><p role="alert" className="text-xs text-[#dc2626]">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded-lg border border-[#2563eb] px-3 py-2 text-xs font-bold text-[#2563eb]">다시 시도</button></div> : visible.length ? visible.map((project) => <ContractorProjectCard key={project.projectId} project={project} />) : <ContractorEmptyState title="해당 상태의 프로젝트가 없습니다" description="다른 상태 필터를 선택해 주세요." />}</div></main><ContractorBottomNavigation /></ContractorMobileShell>
}
