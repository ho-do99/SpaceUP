import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

interface StoredReview {
  rating: number
  keywords: string[]
  content: string
  createdAt: string
}

function getStoredReview(
  constructionId?: string,
): StoredReview | null {
  if (!constructionId) return null

  const raw = sessionStorage.getItem(
    `spaceup-construction-review-${constructionId}`,
  )

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredReview

    if (
      typeof parsed.rating !== 'number' ||
      !Array.isArray(parsed.keywords) ||
      typeof parsed.content !== 'string'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function InformationRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3">
      <dt className="text-[12px] leading-[18px] text-[#64748b]">
        {label}
      </dt>

      <dd className="text-right text-[12px] font-medium leading-[18px] text-[#334155]">
        {value}
      </dd>
    </div>
  )
}

export default function UserConstructionCompletedDetailPage() {
  const navigate = useNavigate()

  const {
    constructionId,
  } = useParams<{
    constructionId: string
  }>()

  const review =
    getStoredReview(constructionId)

  const validConstruction =
    constructionId === 'space-design'

  if (!validConstruction) {
    return (
      <UserScreenShell className="h-dvh">
        <UserHeader
          variant="detail"
          title="시공 완료 상세"
          onBack={() =>
            navigate('/mypage/constructions')
          }
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <h1 className="text-[18px] font-bold text-[#1e293b]">
              시공 내역을 찾을 수 없습니다
            </h1>

            <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
              시공 내역에서 다시 확인해주세요.
            </p>
          </main>

          <footer className="shrink-0 bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() =>
                navigate('/mypage/constructions')
              }
              className="h-12 w-full rounded-[8px] bg-[#2563eb] text-[14px] font-bold text-white"
            >
              시공 내역으로
            </button>
          </footer>
        </div>
      </UserScreenShell>
    )
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="시공 완료 상세"
        onBack={() =>
          navigate('/mypage/constructions')
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5">
          <h1 className="text-[22px] font-bold leading-8 text-[#1e293b]">
            시공 완료 상세
          </h1>

          <p className="mt-4 text-[13px] leading-5 text-[#64748b]">
            완료된 시공 정보와 결과를 확인하세요.
          </p>

          {/* 완료 요약 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-[15px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-bold leading-6 text-[#1e293b]">
                  공간디자인 인테리어
                </h2>

                <p className="mt-[3px] text-[12px] leading-[18px] text-[#64748b]">
                  광주 북구
                </p>
              </div>

              <span className="flex h-6 w-[78px] shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[10px] font-bold text-[#16a34a]">
                시공 완료
              </span>
            </div>

            <p className="mt-3 text-[13px] font-medium leading-5 text-[#334155]">
              완료일&nbsp;&nbsp;2026.07.21
            </p>

            <p className="mt-3 text-[12px] leading-[18px] text-[#64748b]">
              요청하신 시공이 정상적으로 완료되었습니다.
            </p>
          </section>

          {/* 시공 정보 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <h2 className="text-[15px] font-bold leading-[22px] text-[#1e293b]">
              시공 정보
            </h2>

            <dl className="mt-3 space-y-[6px]">
              <InformationRow
                label="시공 항목"
                value="장판 교체, 벽지 시공"
              />

              <InformationRow
                label="시공 공간"
                value="거실, 침실 2개"
              />

              <InformationRow
                label="시공 시작일"
                value="2026.07.18"
              />

              <InformationRow
                label="시공 완료일"
                value="2026.07.21"
              />

              <InformationRow
                label="총 시공 기간"
                value="4일"
              />
            </dl>
          </section>

          {/* 사용 자재 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <h2 className="text-[15px] font-bold leading-[22px] text-[#1e293b]">
              사용 자재
            </h2>

            <div className="mt-3 space-y-1 text-[12px] leading-6 text-[#475569]">
              <p>
                장판&nbsp;&nbsp;LX하우시스 지아자연애 2.2T
              </p>

              <p>
                벽지&nbsp;&nbsp;LX하우시스 베스띠 실크벽지
              </p>

              <p>
                면적&nbsp;&nbsp;장판 59㎡ / 벽지 168㎡
              </p>
            </div>
          </section>

          {/* 최종 금액 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <h2 className="text-[15px] font-bold leading-[22px] text-[#1e293b]">
              최종 시공 금액
            </h2>

            <p className="mt-1 text-[22px] font-bold leading-8 text-[#2563eb]">
              2,450,000원
            </p>

            <div className="mt-1 space-y-0 text-[12px] leading-[22px] text-[#475569]">
              <p>
                장판 자재 및 시공&nbsp;&nbsp;1,280,000원
              </p>

              <p>
                벽지 자재 및 시공&nbsp;&nbsp;1,050,000원
              </p>

              <p>
                기타 비용&nbsp;&nbsp;120,000원
              </p>
            </div>
          </section>

          {/* 리뷰 */}
          {review ? (
            <section className="mt-4 rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] p-[15px]">
              <h2 className="text-[14px] font-bold leading-[22px] text-[#2563eb]">
                소중한 리뷰를 남겨주셨어요
              </h2>

              <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
                작성한 별점과 리뷰를 확인할 수 있습니다.
              </p>

              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-[16px] leading-7 text-[#fbbf24]">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </p>

                <p className="text-[11px] text-[#64748b]">
                  리뷰 작성일&nbsp;&nbsp;
                  {review.createdAt}
                </p>
              </div>
            </section>
          ) : (
            <section className="mt-4 rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] p-[15px]">
              <h2 className="text-[14px] font-bold leading-[22px] text-[#2563eb]">
                시공 결과는 만족스러우셨나요?
              </h2>

              <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
                이용 경험을 별점과 리뷰로 남겨주세요.
              </p>

              <p className="mt-1 text-right text-[24px] leading-7 text-[#2563eb]">
                ☆
              </p>
            </section>
          )}
        </main>

        <footer className="grid shrink-0 grid-cols-[112px_minmax(0,1fr)] gap-3 border-t border-[#e2e8f0] bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-[9px]">
          <button
            type="button"
            onClick={() =>
              navigate('/mypage/constructions')
            }
            className="h-12 rounded-[8px] border border-[#cbd5e1] bg-white text-[14px] font-bold text-[#475569]"
          >
            목록으로
          </button>

          <button
            type="button"
            onClick={() => {
              if (review) {
                navigate(
                  `/mypage/constructions/${constructionId}/review/detail`,
                )
                return
              }

              navigate(
                `/mypage/constructions/${constructionId}/review`,
              )
            }}
            className="h-12 rounded-[8px] bg-[#2563eb] text-[14px] font-bold text-white"
          >
            {review
              ? '작성한 리뷰 보기'
              : '별점과 리뷰 작성하기'}
          </button>
        </footer>
      </div>
    </UserScreenShell>
  )
}