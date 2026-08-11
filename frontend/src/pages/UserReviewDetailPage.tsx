import {
  useState,
} from 'react'
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
    return JSON.parse(raw) as StoredReview
  } catch {
    return null
  }
}

function getRatingLabel(rating: number) {
  switch (rating) {
    case 1:
      return '매우 아쉬워요'
    case 2:
      return '아쉬워요'
    case 3:
      return '보통이에요'
    case 4:
      return '만족해요'
    case 5:
      return '매우 만족해요'
    default:
      return ''
  }
}

export default function UserReviewDetailPage() {
  const navigate = useNavigate()

  const {
    constructionId,
  } = useParams<{
    constructionId: string
  }>()

  const review =
    getStoredReview(constructionId)

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false)

  const deleteReview = () => {
    if (!constructionId) return

    sessionStorage.removeItem(
      `spaceup-construction-review-${constructionId}`,
    )

    setDeleteModalOpen(false)

    navigate(
      `/mypage/constructions/${constructionId}`,
    )
  }

  if (!review) {
    return (
      <UserScreenShell className="h-dvh">
        <UserHeader
          variant="detail"
          title="작성한 리뷰"
          onBack={() =>
            navigate(
              `/mypage/constructions/${constructionId}`,
            )
          }
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <h1 className="text-[18px] font-bold text-[#1e293b]">
              작성한 리뷰가 없습니다
            </h1>

            <p className="mt-2 text-[12px] text-[#64748b]">
              시공 완료 상세에서 리뷰를 작성해주세요.
            </p>
          </main>

          <footer className="shrink-0 bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/mypage/constructions/${constructionId}`,
                )
              }
              className="h-12 w-full rounded-[8px] bg-[#2563eb] text-[14px] font-bold text-white"
            >
              시공 완료 상세로
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
        title="작성한 리뷰"
        onBack={() =>
          navigate(
            `/mypage/constructions/${constructionId}`,
          )
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5">
          <h1 className="text-[22px] font-bold leading-8 text-[#1e293b]">
            작성한 리뷰
          </h1>

          <p className="mt-4 text-[13px] leading-5 text-[#64748b]">
            작성한 별점과 후기를 확인하세요.
          </p>

          {/* 시공사 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-[15px]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-bold leading-[22px] text-[#1e293b]">
                공간디자인 인테리어
              </h2>

              <span className="flex h-6 w-[78px] shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[10px] font-bold text-[#16a34a]">
                시공 완료
              </span>
            </div>

            <p className="mt-2 text-[12px] leading-[18px] text-[#64748b]">
              장판·벽지 시공
            </p>

            <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
              시공 완료일&nbsp;&nbsp;2026.07.21
            </p>
          </section>

          {/* 별점 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <div className="flex items-center gap-5">
              <strong className="text-[24px] font-bold leading-8 text-[#1e293b]">
                {review.rating.toFixed(1)}
              </strong>

              <p className="text-[24px] font-bold leading-8 tracking-[5px] text-[#fbbf24]">
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </p>
            </div>

            <p className="mt-2 text-[13px] font-medium leading-5 text-[#2563eb]">
              {getRatingLabel(
                review.rating,
              )}
            </p>

            <p className="mt-3 text-[11px] leading-[18px] text-[#64748b]">
              작성일&nbsp;&nbsp;
              {review.createdAt}
            </p>
          </section>

          {/* 키워드 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <h2 className="text-[14px] font-bold leading-[22px] text-[#1e293b]">
              선택한 리뷰 키워드
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              {review.keywords.map(
                (keyword) => (
                  <span
                    key={keyword}
                    className="flex h-8 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 text-[11px] font-medium text-[#2563eb]"
                  >
                    {keyword}
                  </span>
                ),
              )}
            </div>
          </section>

          {/* 후기 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <h2 className="text-[14px] font-bold leading-[22px] text-[#1e293b]">
              작성한 후기
            </h2>

            <p className="mt-2 whitespace-pre-line text-[12px] leading-[22px] text-[#475569]">
              {review.content}
            </p>
          </section>
        </main>

        <footer className="grid shrink-0 grid-cols-[1fr_1.08fr] gap-3 border-t border-[#e2e8f0] bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-[9px]">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/mypage/constructions/${constructionId}/review/edit`,
              )
            }
            className="h-12 rounded-[8px] border border-[#cbd5e1] bg-white text-[14px] font-bold text-[#475569]"
          >
            리뷰 수정
          </button>

          <button
            type="button"
            onClick={() =>
              setDeleteModalOpen(true)
            }
            className="h-12 rounded-[8px] bg-[#ef4444] text-[14px] font-bold text-white"
          >
            리뷰 삭제
          </button>
        </footer>
      </div>

      {deleteModalOpen ? (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-[#0f172a]/40 px-6">
          <div className="w-full max-w-[345px] rounded-[16px] bg-white p-5 shadow-xl">
            <h2 className="text-[17px] font-bold text-[#1e293b]">
              리뷰를 삭제하시겠어요?
            </h2>

            <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
              삭제한 리뷰는 다시 복구할 수 없습니다.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteModalOpen(false)
                }
                className="h-11 rounded-[8px] border border-[#cbd5e1] bg-white text-[12px] font-bold text-[#475569]"
              >
                취소
              </button>

              <button
                type="button"
                onClick={deleteReview}
                className="h-11 rounded-[8px] bg-[#ef4444] text-[12px] font-bold text-white"
              >
                리뷰 삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </UserScreenShell>
  )
}