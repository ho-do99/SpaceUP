import { Navigate, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEstimateInfoRow from '@/components/contractor/ContractorEstimateInfoRow'
import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import ContractorSettlementStatusBadge from '@/components/contractor/ContractorSettlementStatusBadge'
import { findContractorSettlement } from '@/mocks/contractorPortalMockData'
import ContractorSettlementNotFound from './ContractorSettlementNotFound'

export default function ContractorSettlementBreakdownPage() {
  const { settlementId } = useParams()
  const settlement = findContractorSettlement(settlementId)
  if (!settlement) return <ContractorSettlementNotFound />
  if (settlement.status !== 'SCHEDULED' || !settlement.scheduledDate) return <Navigate to={`/contractor/settlements/${settlement.settlementId}`} replace />

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="정산 예정 내역" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <div className="flex min-w-0 items-center justify-between gap-3"><p className="break-all text-sm font-bold text-[#2563eb]">{settlement.settlementId}</p><ContractorSettlementStatusBadge status={settlement.status} /></div>
        <p className="mt-2 break-words text-xs leading-5 text-[#64748b]">{settlement.projectName}</p>
        <ContractorSectionCard className="mt-3" title="정산 예정 금액">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="고객 결제">{formatWon(settlement.breakdown.customerPaymentAmount)}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label={`플랫폼 수수료 (${settlement.breakdown.platformFeeRate}%)`}>-{formatWon(settlement.breakdown.platformFeeAmount)}</ContractorEstimateInfoRow>
            <div className="border-t border-[#e2e8f0] pt-2"><ContractorEstimateInfoRow label="최종 지급 예정 금액" emphasize>{formatWon(settlement.breakdown.settlementAmount)}</ContractorEstimateInfoRow></div>
          </dl>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="지급 예정 정보">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="지급 예정일">{settlement.scheduledDate.replace(/-/g, '.')}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="정산 계좌">{settlement.statement.bankName} {settlement.statement.maskedAccountNumber}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="세금계산서">{settlement.statement.taxInvoiceStatus}</ContractorEstimateInfoRow>
          </dl>
        </ContractorSectionCard>
        <p className="mt-3 rounded-xl bg-[#eff6ff] px-4 py-3 text-xs leading-5 text-[#1d4ed8]">지급 예정일과 금액은 현재 정산 상태를 기준으로 표시됩니다.</p>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
