import { useNavigate } from 'react-router-dom'
import MaterialSelectionScreen from '@/components/user/MaterialSelectionScreen'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import { useMaterialProducts } from '@/hooks/useMaterialCatalog'
import { getMaterialTheme } from '@/utils/materialTheme'

export default function FloorMaterialSelectionPage() {
  const navigate = useNavigate()
  const { selectedFloorId, selectFloor } = useEstimateFlow()
  const { products, loading, error, retry } = useMaterialProducts(getMaterialTheme(), 'FLOORING')

  const handleConfirm = (id: string) => {
    selectFloor(id)
    navigate('/estimate/summary')
  }

  return (
    <MaterialSelectionScreen
      title="바닥재 선택"
      products={products}
      initialProductId={selectedFloorId}
      onBack={() => navigate('/estimate/summary')}
      onConfirm={handleConfirm}
      loading={loading}
      error={error}
      onRetry={retry}
    />
  )
}
