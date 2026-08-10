import {
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'

interface UserReviewFormPageProps {
  mode: 'create' | 'edit'
}

interface StoredReview {
  rating: number
  keywords: string[]
  content: string
  createdAt: string
}

const reviewKeywords = [
  '친절해요',
  '상담이 자세해요',
  '일정을 잘 지켰어요',
  '마감이 깔끔해요',
  '소통이 빨라요',
  '가격이 합리적이에요',
] as const

const defaultContent =
  '상담부터 시공 완료까지 안내가 친절했고,\n약속한 일정에 맞춰 깔끔하게 시공해주셨습니다.\n장판과 벽지 마감 상태도 만족스럽습니다.'

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
      return '별점을 선택해주세요'
  }
}

export default function UserReviewFormPage({
  mode,
}: UserReviewFormPageProps) {
  const navigate = useNavigate()

  const {
    constructionId,
  } = useParams<{
    constructionId: string
  }>()

  const existingReview =
    getStoredReview(constructionId)

  const [rating, setRating] =
    useState(
      existingReview?.rating ?? 5,
    )

  const [selectedKeywords, setSelectedKeywords] =
    useState<string[]>(
      existingReview?.keywords ?? [
        '일정을 잘 지켰어요',
        '마감이 깔끔해요',
      ],
    )

  const [content, setContent] =
    useState(
      existingReview?.content ??
        defaultContent,
    )

  const validConstruction =
    constructionId === 'space-design'

  const canSubmit =
    rating > 0 &&
    content.trim().length > 0

  const toggleKeyword = (
    keyword: string,
  ) => {
    setSelectedKeywords((current) =>
      current.includes(keyword)
        ? current.filter(
            (item) => item !== keyword,
          )
        : [...current, keyword],
    )
  }

  const submitReview = () => {
    if (
      !constructionId ||
      !canSubmit
    ) {
      return
    }

    const review: StoredReview = {
      rating,
      keywords: selectedKeywords,
      content: content.trim(),
      createdAt:
        existingReview?.createdAt ??
        '2026.07.23',
    }

    sessionStorage.setItem(
      `spaceup-construction-review-${constructionId}`,
      JSON.stringify(review),
    )

    if (mode === 'edit') {
      navigate(
        `/mypage/constructions/${constructionId}/review/detail`,
      )
      return
    }

    navigate(
      `/mypage/constructions/${constructionId}`,
    )
  }

  if (!validConstruction) {
    return (
      <UserScreenShell className="h-dvh">
        <UserHeader
          variant="detail"
          title={
            mode === 'edit'
              ? '리뷰 수정'
              : '리뷰 작성'
          }
          onBack={() =>
            navigate('/mypage/constructions')
          }
        />

        <main className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
          <p className="text-[13px] text-[#64748b]">
            시공 정보를 찾을 수 없습니다.
          </p>
        </main>
      </UserScreenShell>
    )
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title={
          mode === 'edit'
            ? '리뷰 수정'
            : '리뷰 작성'
        }
        onBack={() => {
          if (mode === 'edit') {
            navigate(
              `/mypage/constructions/${constructionId}/review/detail`,
            )
            return
          }

          navigate(
            `/mypage/constructions/${constructionId}`,
          )
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5">
          <h1 className="text-[22px] font-bold leading-8 text-[#1e293b]">
            리뷰 작성
          </h1>

          <p className="mt-4 text-[13px] leading-5 text-[#64748b]">
            시공 과정과 결과에 대한 경험을 남겨주세요.
          </p>

          {/* 시공사 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-[15px]">
            <h2 className="text-[15px] font-bold leading-[22px] text-[#1e293b]">
              공간디자인 인테리어
            </h2>

            <p className="mt-1 text-[12px] leading-[18px] text-[#64748b]">
              장판·벽지 시공
            </p>

            <p className="mt-1 text-[11px] leading-[18px] text-[#64748b]">
              시공 완료일&nbsp;&nbsp;2026.07.21
            </p>
          </section>

          {/* 별점 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <h2 className="text-[14px] font-bold leading-[22px] text-[#1e293b]">
              시공 결과는 만족스러우셨나요?
            </h2>

            <div
              className="mt-2 flex items-center"
              aria-label="별점 선택"
            >
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star}점`}
                    onClick={() =>
                      setRating(star)
                    }
                    className={`mr-1 text-[36px] font-bold leading-[44px] ${
                      star <= rating
                        ? 'text-[#fbbf24]'
                        : 'text-[#e2e8f0]'
                    }`}
                  >
                    ★
                  </button>
                ),
              )}
            </div>

            <p className="text-[12px] font-medium leading-[18px] text-[#2563eb]">
              {getRatingLabel(rating)}
            </p>
          </section>

          {/* 키워드 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]">
            <h2 className="text-[14px] font-bold leading-[22px] text-[#1e293b]">
              어떤 점이 좋았나요?
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              {reviewKeywords.map(
                (keyword) => {
                  const selected =
                    selectedKeywords.includes(
                      keyword,
                    )

                  return (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() =>
                        toggleKeyword(keyword)
                      }
                      className={`h-8 rounded-full border px-4 text-[11px] font-medium ${
                        selected
                          ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'
                          : 'border-[#e2e8f0] bg-white text-[#64748b]'
                      }`}
                    >
                      {keyword}
                    </button>
                  )
                },
              )}
            </div>
          </section>

          {/* 후기 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <textarea
              value={content}
              maxLength={500}
              onChange={(event) =>
                setContent(
                  event.target.value,
                )
              }
              aria-label="리뷰 내용"
              className="h-[125px] w-full resize-none bg-transparent text-[12px] leading-[22px] text-[#334155] outline-none placeholder:text-[#94a3b8]"
              placeholder="시공 과정과 결과에 대한 경험을 작성해주세요."
            />

            <p className="mt-1 text-right text-[11px] leading-[18px] text-[#94a3b8]">
              {content.length} / 500
            </p>
          </section>
        </main>

        <footer className="shrink-0 border-t border-[#e2e8f0] bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-[9px]">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submitReview}
            className="h-12 w-full rounded-[8px] bg-[#2563eb] text-[14px] font-bold text-white disabled:bg-[#93b4f5]"
          >
            {mode === 'edit'
              ? '리뷰 수정 완료'
              : '리뷰 등록하기'}
          </button>
        </footer>
      </div>
    </UserScreenShell>
  )
}