import { Link, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import ContractorEstimateInfoRow from '@/components/contractor/ContractorEstimateInfoRow'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import ContractorSettlementStatusBadge from '@/components/contractor/ContractorSettlementStatusBadge'
import { findContractorSettlement } from '@/mocks/contractorPortalMockData'
import ContractorSettlementNotFound from './ContractorSettlementNotFound'

export default function ContractorSettlementDetailPage() {
  const { settlementId } = useParams()
  const settlement = findContractorSettlement(settlementId)
  if (!settlement) return <ContractorSettlementNotFound />

  const dateLabel = settlement.status === 'PAID' ? '지급 완료일' : settlement.status === 'ON_HOLD' ? '보류 발생일' : '지급 예정일'
  const date = settlement.paidDate ?? settlement.holdDate ?? settlement.scheduledDate

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="정산 상세" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <p className="text-xs leading-5 text-[#64748b]">계약별 정산 명세를 확인하세요.</p>
        <ContractorSectionCard className="mt-3">
          <div className="flex min-w-0 items-start justify-between gap-2"><p className="min-w-0 break-all text-sm font-bold text-[#2563eb]">{settlement.settlementId}</p><ContractorSettlementStatusBadge status={settlement.status} /></div>
          <p className="mt-2 break-words text-xs leading-5 text-[#64748b]">{settlement.projectName}</p>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="정산 금액">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="고객 결제">{formatWon(settlement.breakdown.customerPaymentAmount)}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="플랫폼 수수료율">{settlement.breakdown.platformFeeRate}%</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="플랫폼 수수료">-{formatWon(settlement.breakdown.platformFeeAmount)}</ContractorEstimateInfoRow>
            <div className="border-t border-[#e2e8f0] pt-2"><ContractorEstimateInfoRow label={settlement.status === 'PAID' ? '지급 금액' : '최종 정산 금액'} emphasize>{formatWon(settlement.breakdown.settlementAmount)}</ContractorEstimateInfoRow></div>
          </dl>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title="처리 정보">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label={dateLabel}>{date?.replace(/-/g, '.') ?? '-'}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="정산 계좌">{settlement.statement.bankName} {settlement.statement.maskedAccountNumber}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="세금계산서">{settlement.statement.taxInvoiceStatus}</ContractorEstimateInfoRow>
          </dl>
        </ContractorSectionCard>
        {settlement.status === 'ON_HOLD' && settlement.holdReason ? <ContractorSectionCard className="mt-3 border-[#fecaca] bg-[#fef2f2]" title="보류 사유"><p className="whitespace-pre-line break-words text-xs leading-5 text-[#b91c1c]">{settlement.holdReason}</p></ContractorSectionCard> : null}
        {settlement.status === 'SCHEDULED' ? <Link to={`/contractor/settlements/${settlement.settlementId}/breakdown`} className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]">정산 예정 내역 보기</Link> : null}
        {settlement.status === 'PAID' ? <Link to={`/contractor/settlements/${settlement.settlementId}/statement`} className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]">정산 명세서 보기</Link> : null}
        {settlement.status === 'ON_HOLD' ? <button type="button" disabled aria-disabled="true" className="mt-4 h-12 w-full rounded-xl bg-[#e2e8f0] text-sm font-bold text-[#64748b] disabled:cursor-not-allowed">정산 계좌 정보 확인</button> : null}
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
