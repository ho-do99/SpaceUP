import { useNavigate } from 'react-router-dom'
import MaterialSelectionScreen from '@/components/user/MaterialSelectionScreen'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import { floorMaterialProducts } from '@/mocks/estimateMaterials'

export default function FloorMaterialSelectionPage() {
  const navigate = useNavigate()
  const { selectedFloorId, selectFloor } = useEstimateFlow()

  const handleConfirm = (id: string) => {
    selectFloor(id)
    navigate('/estimate/summary')
  }

  return (
    <MaterialSelectionScreen
      title="바닥재 선택"
      products={floorMaterialProducts}
      initialProductId={selectedFloorId}
      onBack={() => navigate('/estimate/summary')}
      onConfirm={handleConfirm}
    />
  )
}
