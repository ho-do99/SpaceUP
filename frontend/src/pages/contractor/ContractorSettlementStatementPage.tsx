import { useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEstimateInfoRow from '@/components/contractor/ContractorEstimateInfoRow'
import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import ContractorSettlementStatusBadge from '@/components/contractor/ContractorSettlementStatusBadge'
import { findContractorSettlement } from '@/mocks/contractorPortalMockData'
import ContractorSettlementNotFound from './ContractorSettlementNotFound'

export default function ContractorSettlementStatementPage() {
  const { settlementId } = useParams()
  const settlement = findContractorSettlement(settlementId)
  if (!settlement) return <ContractorSettlementNotFound />

  const statement = settlement.statement
  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="정산 명세서" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <div className="flex min-w-0 items-center justify-between gap-3"><p className="break-all text-sm font-bold text-[#2563eb]">{settlement.settlementId}</p><ContractorSettlementStatusBadge status={settlement.status} /></div>
        {statement.settlementPeriod ? <p className="mt-2 text-xs text-[#64748b]">정산 기간 {statement.settlementPeriod}</p> : null}
        <ContractorSectionCard className="mt-3" title="프로젝트 정보">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="프로젝트">{settlement.projectName}</ContractorEstimateInfoRow>
            {statement.contractNumber ? <ContractorEstimateInfoRow label="계약번호">{statement.contractNumber}</ContractorEstimateInfoRow> : null}
            {statement.contractDate ? <ContractorEstimateInfoRow label="계약일">{statement.contractDate.replace(/-/g, '.')}</ContractorEstimateInfoRow> : null}
            {statement.constructionCompletedDate ? <ContractorEstimateInfoRow label="시공 완료일">{statement.constructionCompletedDate.replace(/-/g, '.')}</ContractorEstimateInfoRow> : null}
          </dl>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="정산 내역">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="고객 결제">{formatWon(settlement.breakdown.customerPaymentAmount)}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label={`플랫폼 수수료 (${settlement.breakdown.platformFeeRate}%)`}>-{formatWon(settlement.breakdown.platformFeeAmount)}</ContractorEstimateInfoRow>
            <div className="border-t border-[#e2e8f0] pt-2"><ContractorEstimateInfoRow label={settlement.status === 'PAID' ? '최종 지급 금액' : '최종 정산 금액'} emphasize>{formatWon(settlement.breakdown.settlementAmount)}</ContractorEstimateInfoRow></div>
          </dl>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="지급 정보">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="은행">{statement.bankName}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="예금주">{statement.accountHolder ?? settlement.contractorName}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="계좌번호">{statement.maskedAccountNumber}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label={settlement.status === 'PAID' ? '지급 완료일' : '지급 예정일'}>{(settlement.paidDate ?? settlement.scheduledDate)?.replace(/-/g, '.') ?? '-'}</ContractorEstimateInfoRow>
          </dl>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="세금계산서">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="상태">{statement.taxInvoiceStatus}</ContractorEstimateInfoRow>
            {statement.businessNumber ? <ContractorEstimateInfoRow label="사업자번호">{statement.businessNumber}</ContractorEstimateInfoRow> : null}
            {statement.taxInvoiceIssuedDate ? <ContractorEstimateInfoRow label="발행일">{statement.taxInvoiceIssuedDate.replace(/-/g, '.')}</ContractorEstimateInfoRow> : null}
          </dl>
        </ContractorSectionCard>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
