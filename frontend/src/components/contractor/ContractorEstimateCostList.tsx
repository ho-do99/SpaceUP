import type { ContractorEstimateCategory } from '@/types/contractorPortal'
import { formatWon } from './contractorEstimateUtils'
import ContractorEstimateInfoRow from './ContractorEstimateInfoRow'

export default function ContractorEstimateCostList({ category }: { category: ContractorEstimateCategory }) {
  return (
    <div>
      <p className="text-xs leading-5 text-[#64748b]">{category.productName}</p>
      <p className="mb-3 text-xs text-[#64748b]">{category.area}㎡ · {formatWon(category.unitPrice)}/㎡</p>
      <dl className="space-y-2">
        {category.costs.map((cost) => <ContractorEstimateInfoRow key={cost.id} label={cost.label}>{formatWon(cost.amount)}</ContractorEstimateInfoRow>)}
        <ContractorEstimateInfoRow label="항목 합계" emphasize>{formatWon(category.sectionTotal)}</ContractorEstimateInfoRow>
      </dl>
    </div>
  )
}
