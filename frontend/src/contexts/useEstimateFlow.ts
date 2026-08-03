import { useContext } from 'react'
import { EstimateFlowContext } from '@/contexts/estimateFlowContext'

export default function useEstimateFlow() {
  const context = useContext(EstimateFlowContext)

  if (!context) {
    throw new Error('useEstimateFlow must be used inside EstimateFlowProvider')
  }

  return context
}
