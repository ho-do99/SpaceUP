import type { Project } from '@/types/backendContractor'
import type { ContractorProject, ContractorProjectStatus } from '@/types/contractorPortal'

export function projectToPortal(project: Project): ContractorProject {
  return {
    projectId: String(project.id),
    estimateId: String(project.quoteId),
    requestId: String(project.requestId),
    name: project.requestCode || `프로젝트 #${project.id}`,
    customerName: project.customerName || '사용자',
    managerName: project.contractorName || '담당자 미등록',
    address: project.address || '주소 미등록',
    contractAmount: project.contractAmount ?? 0,
    contractDate: project.contractDate || '-',
    constructionItems: project.constructionItems?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
    lightingNotice: '조명 공사는 현장 조건에 따라 변경될 수 있습니다.',
    status: project.status as ContractorProjectStatus,
    schedule: {
      startDate: project.startDate || '-',
      completionDate: project.completionDate || '-',
    },
    checklist: project.checklist?.map((item) => ({ id: String(item.id), label: item.label, completed: item.completed })) ?? [],
    customerRequest: project.customerRequest || '등록된 요청 사항이 없습니다.',
  }
}
