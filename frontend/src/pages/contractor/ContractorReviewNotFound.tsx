import { Link } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorEmptyState from '@/components/contractor/ContractorEmptyState'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

export default function ContractorReviewNotFound() {
  return <ContractorMobileShell innerClassName="h-dvh min-h-0"><ContractorAppBar title="리뷰 상세" back /><main className="flex min-h-0 flex-1 flex-col justify-center px-4 pb-8"><ContractorEmptyState title="리뷰를 찾을 수 없습니다" description="리뷰 번호를 확인한 후 다시 시도해 주세요." /><Link to="/contractor/reviews" className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[#2563eb] text-sm font-bold text-white">받은 리뷰로 이동</Link></main></ContractorMobileShell>
}
