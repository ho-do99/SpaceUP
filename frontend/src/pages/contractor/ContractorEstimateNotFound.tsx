import { Link } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

export default function ContractorEstimateNotFound() {
  return (
    <ContractorMobileShell>
      <ContractorAppBar title="보낸 견적 상세" back />
      <main className="flex flex-1 flex-col justify-center px-4 py-10">
        <ContractorEmptyState title="견적 정보를 찾을 수 없습니다" description="견적번호를 확인하거나 보낸 견적 목록에서 다시 선택해 주세요." />
        <Link to="/contractor/estimates" className="mt-4 flex h-11 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white">보낸 견적 목록으로 이동</Link>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
