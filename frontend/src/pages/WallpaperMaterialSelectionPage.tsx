import { useNavigate } from 'react-router-dom'
import MaterialSelectionScreen from '@/components/user/MaterialSelectionScreen'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import { wallpaperMaterialProducts } from '@/mocks/estimateMaterials'

export default function WallpaperMaterialSelectionPage() {
  const navigate = useNavigate()
  const { selectedWallpaperId, selectWallpaper } = useEstimateFlow()

  const handleConfirm = (id: string) => {
    selectWallpaper(id)
    navigate('/estimate/summary')
  }

  return (
    <MaterialSelectionScreen
      title="벽지 선택"
      products={wallpaperMaterialProducts}
      initialProductId={selectedWallpaperId}
      onBack={() => navigate('/estimate/summary')}
      onConfirm={handleConfirm}
    />
  )
}
