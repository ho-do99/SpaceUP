import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { getLandlordProjects } from '@/api/projectApi'
import type { Project } from '@/types/backendContractor'
import { getAccessToken } from '@/utils/authSession'

type ConstructionFilter =
  | 'all'
  | 'active'
  | 'completed'

interface ConstructionHistoryItem {
  id: string
  contractorName: string
  contractorMeta: string
  workItems: string
  period: string
  status: 'active' | 'completed'
  amount?: string
  progressLabel?: string
  requestId?: number
  contractorId?: number
}

const constructionItems: ConstructionHistoryItem[] = [
  {
    id: 'space-design',
    contractorName: '공간디자인 인테리어',
    contractorMeta: '광주 북구 · 장판·벽지 전문',
    workItems:
      '거실 및 방 장판 교체 · 전체 벽지 시공',
    period: '2026.07.18 ~ 2026.07.21',
    status: 'completed',
    amount: '2,450,000원',
  },
  {
    id: 'house-up',
    contractorName: '하우스업 인테리어',
    contractorMeta: '광주 서구 · 장판·벽지 전문',
    workItems:
      '거실 장판 교체 · 침실 벽지 시공',
    period: '2026.07.23 ~ 2026.07.26',
    status: 'active',
    progressLabel: '벽지 시공 중',
  },
]

export default function UserConstructionHistoryPage() {
  const navigate = useNavigate()

  const [filter, setFilter] =
    useState<ConstructionFilter>('all')

  const [items, setItems] = useState<ConstructionHistoryItem[]>(constructionItems)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!getAccessToken()) return
    setLoading(true)
    getLandlordProjects()
      .then((projects) => setItems(projects.map(toHistoryItem)))
      .catch((error) => {
        setItems([])
        setLoadError(error instanceof Error ? error.message : '시공 내역을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  const visibleItems =
    filter === 'all'
      ? items
      : items.filter(
          (item) =>
            item.status === filter,
        )

  const activeCount =
    items.filter(
      (item) =>
        item.status === 'active',
    ).length

  const completedCount =
    items.filter(
      (item) =>
        item.status === 'completed',
    ).length

  const openConstruction = (
    item: ConstructionHistoryItem,
  ) => {
    if (item.status === 'active') {
      navigate(
        item.requestId && item.contractorId
          ? `/mypage/requests/${item.requestId}/schedule/${item.contractorId}?projectId=${item.id}`
          : '/mypage/requests/2/schedule/2',
      )
      return
    }

    navigate(
      `/mypage/constructions/${item.id}`,
    )
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="시공 내역"
        onBack={() =>
          navigate('/mypage')
        }
      />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5">
        <section>
          <h1 className="text-[22px] font-bold leading-8 text-[#1e293b]">
            시공 내역
          </h1>

          <p className="mt-3 text-[13px] leading-5 text-[#64748b]">
            진행 중이거나 완료된 시공을 확인하세요.
          </p>
        </section>

        <section
          className="mt-4 flex h-9 items-start gap-2"
          aria-label="시공 내역 필터"
        >
          <button
            type="button"
            onClick={() =>
              setFilter('all')
            }
            className={`flex h-6 w-[76px] items-center justify-center rounded-full border text-[10px] font-bold ${
              filter === 'all'
                ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'
                : 'border-[#e2e8f0] bg-white text-[#64748b]'
            }`}
          >
            전체 {items.length}
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter('active')
            }
            className={`flex h-6 w-[92px] items-center justify-center rounded-full border text-[10px] font-bold ${
              filter === 'active'
                ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'
                : 'border-[#e2e8f0] bg-white text-[#64748b]'
            }`}
          >
            진행 중 {activeCount}
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter('completed')
            }
            className={`flex h-6 w-[76px] items-center justify-center rounded-full border text-[10px] font-bold ${
              filter === 'completed'
                ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'
                : 'border-[#e2e8f0] bg-white text-[#64748b]'
            }`}
          >
            완료 {completedCount}
          </button>
        </section>

        <section className="space-y-4">
          {loading ? <p role="status" className="py-10 text-center text-[12px] text-[#64748b]">시공 내역을 불러오는 중입니다.</p> : null}
          {loadError ? <p role="alert" className="py-10 text-center text-[12px] text-[#dc2626]">{loadError}</p> : null}
          {!loading && !loadError && visibleItems.length === 0 ? <p className="py-10 text-center text-[12px] text-[#64748b]">시공 내역이 없습니다.</p> : null}
          {visibleItems.map((item) => {
            const completed =
              item.status === 'completed'

            return (
              <article
                key={item.id}
                className="rounded-[12px] border border-[#e2e8f0] bg-white p-[15px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-bold leading-6 text-[#1e293b]">
                      {item.contractorName}
                    </h2>

                    <p className="mt-[3px] text-[12px] leading-[18px] text-[#64748b]">
                      {item.contractorMeta}
                    </p>
                  </div>

                  <span
                    className={`flex h-6 w-[78px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      completed
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : 'bg-[#eff6ff] text-[#2563eb]'
                    }`}
                  >
                    {completed
                      ? '시공 완료'
                      : '시공 중'}
                  </span>
                </div>

                <dl className="mt-[18px] space-y-[10px]">
                  <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                    <dt className="text-[12px] leading-5 text-[#64748b]">
                      시공 항목
                    </dt>

                    <dd className="text-[13px] font-medium leading-5 text-[#334155]">
                      {item.workItems}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                    <dt className="text-[12px] leading-5 text-[#64748b]">
                      시공 기간
                    </dt>

                    <dd className="text-[13px] font-medium leading-5 text-[#334155]">
                      {item.period}
                    </dd>
                  </div>

                  <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                    <dt className="text-[12px] leading-5 text-[#64748b]">
                      {completed
                        ? '최종 금액'
                        : '진행 단계'}
                    </dt>

                    <dd
                      className={`text-[13px] font-medium leading-5 ${
                        completed
                          ? 'text-[#2563eb]'
                          : 'text-[#334155]'
                      }`}
                    >
                      {completed
                        ? item.amount
                        : item.progressLabel}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() =>
                    openConstruction(item)
                  }
                  className={`mt-[17px] flex h-10 w-full items-center justify-center rounded-[8px] text-[13px] font-bold ${
                    completed
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-[#eff6ff] text-[#2563eb]'
                  }`}
                >
                  {completed
                    ? '상세 보기'
                    : '진행 상황 보기'}
                </button>
              </article>
            )
          })}
        </section>
      </main>
    </UserScreenShell>
  )
}

function toHistoryItem(project: Project): ConstructionHistoryItem {
  const completed = project.status === 'COMPLETED'
  const formatDate = (value?: string | null) => value ? value.replace(/-/g, '.') : '미정'
  return {
    id: String(project.id),
    requestId: project.requestId,
    contractorId: project.contractorId,
    contractorName: project.contractorName || '시공사 정보 확인 중',
    contractorMeta: project.address || project.requestCode || '',
    workItems: project.constructionItems || '시공 항목 협의 중',
    period: `${formatDate(project.startDate)} ~ ${formatDate(project.completionDate)}`,
    status: completed ? 'completed' : 'active',
    amount: completed && project.contractAmount != null ? `${project.contractAmount.toLocaleString('ko-KR')}원` : undefined,
    progressLabel: project.status === 'COMPLETION_REQUESTED' ? '완료 확인 대기' : project.status === 'IN_PROGRESS' ? '시공 중' : '시공 시작 예정',
  }
}
