import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import LightingProductCard from '@/components/user/LightingProductCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import useEstimateFlow from '@/contexts/useEstimateFlow'
import {
  lightingFilters,
  lightingProducts,
  type LightingFilterId,
} from '@/mocks/estimateMaterials'
import { useLightingProducts } from '@/hooks/useMaterialCatalog'
import { getMaterialTheme } from '@/utils/materialTheme'

export default function LightingMaterialSelectionPage() {
  const navigate = useNavigate()
  const { selectedLightingId, selectLighting } = useEstimateFlow()
  const [selectedFilter, setSelectedFilter] = useState<LightingFilterId>('recommended')
  const [selectedProductId, setSelectedProductId] = useState(selectedLightingId)
  const catalogProducts = useLightingProducts(getMaterialTheme(), lightingProducts)

  useEffect(() => {
    if (
      catalogProducts.length > 0 &&
      !catalogProducts.some((product) => product.id === selectedProductId)
    ) {
      setSelectedProductId(catalogProducts[0].id)
    }
  }, [catalogProducts, selectedProductId])

  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'recommended' || selectedFilter === 'all') {
      return catalogProducts
    }

    return catalogProducts.filter((product) => product.filterId === selectedFilter)
  }, [catalogProducts, selectedFilter])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    selectLighting(selectedProductId)
    navigate('/estimate/summary')
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="조명 선택"
        onBack={() => navigate('/estimate/summary')}
      />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          <section className="pt-[18px]">
            <h1 className="text-[22px] font-bold leading-[29px] text-[#1e293b]">조명 선택</h1>
            <p className="mt-1 text-[12px] leading-[18px] text-[#64748b]">
              공간에 설치할 조명을 선택해주세요.
            </p>
          </section>

          <div
            role="radiogroup"
            aria-label="조명 필터"
            className="scrollbar-hide -mx-5 mt-2 flex h-11 gap-2 overflow-x-auto px-5 py-1.5"
          >
            {lightingFilters.map((filter) => {
              const isSelected = filter.id === selectedFilter

              return (
                <button
                  key={filter.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`h-8 shrink-0 rounded-[8px] border px-[18px] text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb] ${
                    isSelected
                      ? 'border-[#bfdbfe] bg-[#eff6ff] font-bold text-[#2563eb]'
                      : 'border-[#e2e8f0] bg-white font-medium text-[#64748b]'
                  }`}
                  onClick={() => setSelectedFilter(filter.id)}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          <fieldset className="mt-3 min-w-0 border-0 p-0 pb-6">
            <legend className="sr-only">조명 제품</legend>
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <LightingProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProductId === product.id}
                  onChange={setSelectedProductId}
                />
              ))}
            </div>
          </fieldset>
        </main>

        <footer className="shrink-0 bg-white px-5 pb-[calc(15px+env(safe-area-inset-bottom))] pt-2">
          <Button
            type="submit"
            disabled={!selectedProductId}
            className="h-[52px] w-full !rounded-[8px] !border !border-[#2563eb] !bg-[#2563eb] !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            조명 선택 완료
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
