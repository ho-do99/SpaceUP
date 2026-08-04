import { useContext } from 'react'
import { ContractorPortalFlowContext } from './contractorPortalFlowContext'

export default function useContractorPortalFlow() {
  const context = useContext(ContractorPortalFlowContext)
  if (!context) throw new Error('ContractorPortalFlowProvider가 필요합니다.')
  return context
}
