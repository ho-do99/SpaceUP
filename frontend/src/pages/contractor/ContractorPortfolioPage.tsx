import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import { deletePortfolio, getMyPortfolios } from '@/api/portfolioApi'
import { resolveApiAssetUrl } from '@/utils/apiAssetUrl'

interface PortfolioItem {
  id: string
  title: string
  location: string
  propertyType: string
  area: string
  visibility: '공개' | '비공개'
  imageUrl?: string
}

interface DeleteDialogProps {
  portfolio: PortfolioItem | null
  onCancel: () => void
  onConfirm: () => void
}

function PortfolioDeleteDialog({
  portfolio,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!portfolio) {
      return
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

      if (
        !focusableElements ||
        focusableElements.length === 0
      ) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement =
        focusableElements[
          focusableElements.length - 1
        ]

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      previousActiveElement?.focus()
    }
  }, [portfolio, onCancel])

  if (!portfolio) {
    return null
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="portfolio-delete-title"
        aria-describedby="portfolio-delete-description"
        className="w-full max-w-[329px] rounded-2xl bg-white p-6 shadow-xl"
      >
        <div
          aria-hidden="true"
          className="text-[28px] leading-[34px] text-[#ef4444]"
        >
          ⚠
        </div>

        <h2
          id="portfolio-delete-title"
          className="mt-4 text-lg font-bold leading-[26px] text-[#1e293b]"
        >
          포트폴리오를 삭제할까요?
        </h2>

        <p
          id="portfolio-delete-description"
          className="mt-4 text-xs leading-5 text-[#64748b]"
        >
          선택한 포트폴리오는 목록에서 제거됩니다.
          <br />
          이 동작은 Prototype 시각 상태로만 반영됩니다.
        </p>

        <div className="mt-4 flex gap-[10px]">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-[10px] border border-[#cbd5e1] bg-white text-sm font-bold text-[#334155] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-12 flex-1 rounded-[10px] bg-[#ef4444] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dc2626]"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContractorPortfolioPage() {
  const navigate = useNavigate()

  const [portfolios, setPortfolios] =
    useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getMyPortfolios().then((items) => {
      if (!active) return
      setPortfolios(items.map((item) => ({ id: String(item.id), title: item.projectName, location: item.region, propertyType: item.propertyType, area: `${item.areaM2}㎡`, visibility: item.isPublic ? '공개' : '비공개', imageUrl: resolveApiAssetUrl(item.mainImageUrl) || undefined })))
    }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : '포트폴리오를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const [
    portfolioPendingDeletion,
    setPortfolioPendingDeletion,
  ] = useState<PortfolioItem | null>(null)

  const handleDeleteConfirm = async () => {
    if (!portfolioPendingDeletion) {
      return
    }

    const id = Number(portfolioPendingDeletion.id)
    if (!Number.isInteger(id)) return
    try {
      await deletePortfolio(id)
      setPortfolios((current) => current.filter((portfolio) => portfolio.id !== portfolioPendingDeletion.id))
      setPortfolioPendingDeletion(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '포트폴리오 삭제에 실패했습니다.')
    }
  }

  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="포트폴리오" />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">
          등록한 시공 사례와 공개 상태를 관리하세요.
        </p>

        <section
          aria-label="포트폴리오 현황"
          className="mt-3 grid h-[88px] grid-cols-3 rounded-xl border border-[#e2e8f0] bg-white px-[15px] py-[13px]"
        >
          <div>
            <p className="text-[11px] text-[#64748b]">
              전체 포트폴리오
            </p>

            <p className="mt-1 text-xl font-bold text-[#1e293b]">
              {portfolios.length}건
            </p>
          </div>

          <div>
            <p className="text-[11px] text-[#64748b]">
              공개
            </p>

            <p className="mt-1 text-xl font-bold text-[#2563eb]">
              {portfolios.filter((item) => item.visibility === '공개').length}건
            </p>
          </div>

          <div>
            <p className="text-[11px] text-[#64748b]">
              비공개
            </p>

            <p className="mt-1 text-xl font-bold text-[#64748b]">
              {portfolios.filter((item) => item.visibility === '비공개').length}건
            </p>
          </div>
        </section>

        <section
          aria-label="포트폴리오 목록"
          className="mt-4 space-y-3"
        >
          {portfolios.map((portfolio) => (
            <article
              key={portfolio.id}
              className="rounded-xl border border-[#e2e8f0] bg-white p-[13px]"
            >
              <div className="flex gap-[14px]">
                {portfolio.imageUrl ? <img src={portfolio.imageUrl} alt="" className="h-24 w-28 shrink-0 rounded-[10px] object-cover" /> : <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-xs font-bold text-[#2563eb]">IMAGE</div>}

                <div className="min-w-0 flex-1 pt-0.5">
                  <h2 className="break-words text-sm font-bold leading-5 text-[#1e293b]">
                    {portfolio.title}
                  </h2>

                  <p className="mt-2 break-words text-[11px] leading-[18px] text-[#64748b]">
                    {portfolio.location} ·{' '}
                    {portfolio.propertyType} ·{' '}
                    {portfolio.area}
                  </p>

                  <p
                    className={`mt-2 text-[11px] font-bold ${
                      portfolio.visibility === '공개'
                        ? 'text-[#2563eb]'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {portfolio.visibility}
                  </p>
                </div>
              </div>

              <div className="mt-[34px] flex gap-[15px]">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/contractor/portfolio/${portfolio.id}/edit`,
                    )
                  }
                  className="h-12 flex-1 rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                >
                  수정
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPortfolioPendingDeletion(
                      portfolio,
                    )
                  }
                  className="h-12 flex-1 rounded-lg border border-[#ef4444] bg-white text-sm font-bold text-[#ef4444] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ef4444]"
                >
                  삭제
                </button>
              </div>
            </article>
          ))}

          {loading ? <p className="py-10 text-center text-xs text-[#64748b]">포트폴리오를 불러오는 중입니다.</p> : null}
          {error ? <p role="alert" className="py-6 text-center text-xs text-[#dc2626]">{error}</p> : null}
          {!loading && !error && portfolios.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white px-5 text-center">
              <p className="text-sm font-bold text-[#1e293b]">
                등록된 포트폴리오가 없습니다.
              </p>

              <p className="mt-2 text-xs leading-5 text-[#64748b]">
                포트폴리오를 등록하면 이곳에서 관리할
                수 있습니다.
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <ContractorBottomNavigation />

      <PortfolioDeleteDialog
        portfolio={portfolioPendingDeletion}
        onCancel={() =>
          setPortfolioPendingDeletion(null)
        }
        onConfirm={handleDeleteConfirm}
      />
    </ContractorMobileShell>
  )
}
