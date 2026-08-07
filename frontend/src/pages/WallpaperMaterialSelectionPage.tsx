import { useNavigate } from 'react-router-dom'
import MaterialSelectionScreen from '@/components/user/MaterialSelectionScreen'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import { wallpaperMaterialProducts } from '@/mocks/estimateMaterials'
import { useMaterialProducts } from '@/hooks/useMaterialCatalog'
import { getMaterialTheme } from '@/utils/materialTheme'

export default function WallpaperMaterialSelectionPage() {
  const navigate = useNavigate()
  const { selectedWallpaperId, selectWallpaper } = useEstimateFlow()
  const products = useMaterialProducts(getMaterialTheme(), 'WALLPAPER', wallpaperMaterialProducts)

  const handleConfirm = (id: string) => {
    selectWallpaper(id)
    navigate('/estimate/summary')
  }

  return (
    <MaterialSelectionScreen
      title="벽지 선택"
      products={products}
      initialProductId={selectedWallpaperId}
      onBack={() => navigate('/estimate/summary')}
      onConfirm={handleConfirm}
    />
  )
}
