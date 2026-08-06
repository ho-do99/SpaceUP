import { Link } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

export default function ContractorProjectNotFound() {
  return <ContractorMobileShell><ContractorAppBar title="프로젝트 상세" back /><main className="flex flex-1 flex-col justify-center px-4 py-10"><ContractorEmptyState title="프로젝트를 찾을 수 없습니다" description="프로젝트 번호를 확인하거나 계약·시공 목록에서 다시 선택해 주세요." /><Link to="/contractor/projects" className="mt-4 flex h-11 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white">계약·시공 목록으로 이동</Link></main><ContractorBottomNavigation /></ContractorMobileShell>
}
