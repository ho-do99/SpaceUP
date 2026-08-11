import { useEffect, useState, type FormEvent } from 'react'
import Button from '@/components/Button'
import MaterialFilterChips from '@/components/user/MaterialFilterChips'
import MaterialProductCard from '@/components/user/MaterialProductCard'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import {
  sortMaterialProducts,
  type MaterialFilterId,
  type MaterialProduct,
} from '@/mocks/estimateMaterials'

interface MaterialSelectionScreenProps {
  title: string
  products: ReadonlyArray<MaterialProduct>
  initialProductId: string
  onBack: () => void
  onConfirm: (id: string) => void
  loading?: boolean
  error?: string
  onRetry?: () => void
}

export default function MaterialSelectionScreen({
  title,
  products,
  initialProductId,
  onBack,
  onConfirm,
  loading = false,
  error = '',
  onRetry,
}: MaterialSelectionScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<MaterialFilterId>('recommended')
  const [selectedProductId, setSelectedProductId] = useState(initialProductId)
  const sortedProducts = sortMaterialProducts(products, selectedFilter)

  useEffect(() => {
    if (products.length > 0 && !products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(products[0].id)
    }
  }, [products, selectedProductId])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onConfirm(selectedProductId)
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title={title} onBack={onBack} />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5">
          <section className="pt-[18px]">
            <h1 className="text-[20px] font-bold leading-[26px] text-[#1e293b]">{title}</h1>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[#64748b]">
              AI 추천 자재와 다른 옵션을 비교해보세요.
            </p>
          </section>

          <div className="mt-2">
            <MaterialFilterChips value={selectedFilter} onChange={setSelectedFilter} />
          </div>

          <fieldset className="mt-2 min-w-0 border-0 p-0 pb-6">
            <legend className="sr-only">{title} 제품</legend>
            <div className="space-y-2.5">
              {loading ? <p role="status" className="py-10 text-center text-xs text-[#64748b]">자재를 불러오는 중입니다.</p> : null}
              {error ? <div className="py-8 text-center"><p role="alert" className="text-xs font-semibold text-[#dc2626]">{error}</p>{onRetry ? <button type="button" onClick={onRetry} className="mt-3 h-10 rounded-lg border border-[#2563eb] px-4 text-xs font-bold text-[#2563eb]">다시 시도</button> : null}</div> : null}
              {!loading && !error && sortedProducts.length === 0 ? <p className="py-10 text-center text-xs text-[#64748b]">조건에 맞는 자재가 없습니다.</p> : null}
              {sortedProducts.map((product) => (
                <MaterialProductCard
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
            disabled={loading || Boolean(error) || products.length === 0}
            className="h-[52px] w-full !rounded-[8px] !border !border-[#2563eb] !bg-[#2563eb] !px-4 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            이 자재로 선택
          </Button>
        </footer>
      </form>
    </UserScreenShell>
  )
}
