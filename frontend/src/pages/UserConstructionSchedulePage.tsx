import {
  useEffect,
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { getProject } from '@/api/projectApi'
import type { Project } from '@/types/backendContractor'

interface ScheduleStep {
  date: string
  title: string
  description: string
  status:
    | 'completed'
    | 'current'
    | 'upcoming'
}

interface ApprovedEstimateState {
  status: string
  approvedAt?: string
  contractorId?: string
  contractorName?: string
  contractorMeta?: string
  estimateNumber?: string
  totalAmount?: string
  startDate?: string
  endDate?: string
  durationDays?: number
}

const activeConstructionSteps: ScheduleStep[] = [
  {
    date: '07.23',
    title: '기존 마감재 철거',
    description: '기존 장판 및 벽지 철거',
    status: 'completed',
  },
  {
    date: '07.24',
    title: '장판 시공',
    description: '거실 및 주요 공간 장판 시공 완료',
    status: 'completed',
  },
  {
    date: '07.24',
    title: '벽지 시공',
    description: '침실 및 주요 공간 벽지 시공 중',
    status: 'current',
  },
  {
    date: '07.25',
    title: '마감 및 검수',
    description: '전체 마감 확인 및 최종 검수 예정',
    status: 'upcoming',
  },
]

const approvedConstructionSteps: ScheduleStep[] = [
  {
    date: '08.05',
    title: '기존 마감재 철거',
    description: '기존 바닥재 및 벽지 철거 예정',
    status: 'upcoming',
  },
  {
    date: '08.05',
    title: '바닥재 시공',
    description: '거실 및 주요 공간 바닥재 시공 예정',
    status: 'upcoming',
  },
  {
    date: '08.06',
    title: '벽지 시공',
    description: '침실 및 주요 공간 벽지 시공 예정',
    status: 'upcoming',
  },
  {
    date: '08.07',
    title: '마감 및 최종 검수',
    description: '전체 마감 확인 및 최종 검수 예정',
    status: 'upcoming',
  },
]

function getApprovedEstimate(
  requestId?: string,
): ApprovedEstimateState | null {
  if (!requestId) return null

  const raw = sessionStorage.getItem(
    `spaceup-estimate-${requestId}`,
  )

  if (!raw) return null

  try {
    const parsed = JSON.parse(
      raw,
    ) as ApprovedEstimateState

    if (
      parsed.status !== 'APPROVED'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function CompanyIcon() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="5.5"
          y="3.5"
          width="13"
          height="17"
          rx="1.5"
          stroke="#2563EB"
          strokeWidth="1.7"
        />

        <path
          d="M9 7H11M13 7H15M9 11H11M13 11H15M9 15H11M13 15H15"
          stroke="#2563EB"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        <path
          d="M10 20V17H14V20"
          stroke="#2563EB"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 12L10.5 15.5L17 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ApprovalIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#2563EB"
        strokeWidth="1.8"
      />

      <path
        d="M8 12L10.7 14.7L16 9.5"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function UserConstructionSchedulePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [liveProject, setLiveProject] = useState<Project | null>(null)
  const [projectError, setProjectError] = useState('')

  const {
    requestId,
    contractorId,
  } = useParams<{
    requestId: string
    contractorId: string
  }>()

  const approvedEstimate =
    getApprovedEstimate(requestId)

  useEffect(() => {
    const projectId = Number(searchParams.get('projectId'))
    if (!Number.isInteger(projectId) || projectId <= 0) return
    getProject(projectId)
      .then(setLiveProject)
      .catch((error) => setProjectError(error instanceof Error ? error.message : '프로젝트 정보를 불러오지 못했습니다.'))
  }, [searchParams])

  const isApprovedWaiting =
    Boolean(approvedEstimate)

  const contractorName =
    liveProject?.contractorName ?? approvedEstimate?.contractorName ??
    '하우스업 인테리어'

  const contractorMeta =
    approvedEstimate?.contractorMeta ??
    '광주 서구 · 장판·벽지 전문'

  const progress =
    isApprovedWaiting ? 0 : 65

  const currentStage =
    liveProject?.status === 'COMPLETION_REQUESTED' ? '완료 확인 대기' : isApprovedWaiting
      ? '시공 시작 대기'
      : '벽지 시공 중'

  const nextStage =
    isApprovedWaiting
      ? '기존 마감재 철거'
      : '마감 및 검수'

  const constructionPeriod =
    liveProject
      ? `${liveProject.startDate?.replace(/-/g, '.') || '미정'} ~ ${liveProject.completionDate?.replace(/-/g, '.') || '미정'}`
      : isApprovedWaiting
      ? '2026.08.05 ~ 2026.08.07'
      : '2026.07.23 ~ 2026.07.26'

  const scheduleSteps =
    isApprovedWaiting
      ? approvedConstructionSteps
      : activeConstructionSteps

  const returnToChat = () => {
    navigate(
      `/mypage/requests/${requestId}/chat/${contractorId}`,
    )
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="시공 일정"
        onBack={() =>
          navigate('/mypage/requests')
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5">
          {projectError ? <p role="alert" className="mb-3 text-[11px] font-semibold text-[#dc2626]">{projectError}</p> : null}
          <section>
            <h1 className="text-[18px] font-bold leading-[26px] text-[#1e293b]">
              시공 진행 상황
            </h1>

            <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
              현재 시공 일정과 진행 상태를 확인하세요.
            </p>
          </section>

          {/* 승인 직후 안내 */}
          {isApprovedWaiting ? (
            <section className="mt-5 rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
              <div className="flex items-center gap-2">
                <ApprovalIcon />

                <h2 className="text-[14px] font-bold text-[#2563eb]">
                  견적 승인 완료
                </h2>
              </div>

              <p className="mt-2 text-[11px] leading-[18px] text-[#475569]">
                견적 승인이 정상적으로 완료되었습니다.
                현재 시공 시작 전 준비 단계입니다.
              </p>

              <div className="mt-3 rounded-[8px] bg-white px-3 py-2.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#64748b]">
                    시작 예정일
                  </span>

                  <strong className="text-[#1e293b]">
                    2026.08.05
                  </strong>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-[#64748b]">
                    승인 견적
                  </span>

                  <strong className="text-[#2563eb]">
                    5,500,000원
                  </strong>
                </div>
              </div>
            </section>
          ) : null}

          {/* 시공사 */}
          <section className="mt-5 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <p className="text-[10px] text-[#64748b]">
              시공사
            </p>

            <div className="mt-3 flex items-center">
              <CompanyIcon />

              <div className="ml-3 min-w-0 flex-1">
                <h2 className="truncate text-[14px] font-bold leading-5 text-[#1e293b]">
                  {contractorName}
                </h2>

                <p className="mt-1 text-[10px] leading-4 text-[#64748b]">
                  {contractorMeta}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`size-[7px] rounded-full ${
                    isApprovedWaiting
                      ? 'bg-[#f59e0b]'
                      : 'bg-[#22c55e]'
                  }`}
                />

                <span
                  className={`text-[10px] ${
                    isApprovedWaiting
                      ? 'text-[#b45309]'
                      : 'text-[#16a34a]'
                  }`}
                >
                  {isApprovedWaiting
                    ? '시공 준비 중'
                    : '시공 중'}
                </span>
              </div>
            </div>
          </section>

          {/* 진행률 */}
          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#1e293b]">
                전체 진행률
              </h2>

              <strong className="text-[15px] font-bold text-[#2563eb]">
                {progress}%
              </strong>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full bg-[#2563eb] transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <dl className="mt-5 space-y-3">
              <div className="grid grid-cols-[90px_1fr]">
                <dt className="text-[10px] text-[#64748b]">
                  시공 기간
                </dt>

                <dd className="text-[10px] font-bold text-[#1e293b]">
                  {constructionPeriod}
                </dd>
              </div>

              <div className="grid grid-cols-[90px_1fr]">
                <dt className="text-[10px] text-[#64748b]">
                  현재 단계
                </dt>

                <dd
                  className={`text-[10px] font-bold ${
                    isApprovedWaiting
                      ? 'text-[#b45309]'
                      : 'text-[#2563eb]'
                  }`}
                >
                  {currentStage}
                </dd>
              </div>

              <div className="grid grid-cols-[90px_1fr]">
                <dt className="text-[10px] text-[#64748b]">
                  다음 단계
                </dt>

                <dd className="text-[10px] font-bold text-[#1e293b]">
                  {nextStage}
                </dd>
              </div>
            </dl>
          </section>

          {/* 시공 일정 */}
          <section className="mt-5">
            <h2 className="text-[14px] font-bold text-[#1e293b]">
              시공 일정
            </h2>

            <div className="mt-3 rounded-[12px] border border-[#e2e8f0] bg-white px-4 py-2">
              {scheduleSteps.map(
                (step, index) => {
                  const completed =
                    step.status ===
                    'completed'

                  const current =
                    step.status ===
                    'current'

                  const upcoming =
                    step.status ===
                    'upcoming'

                  return (
                    <div
                      key={`${step.date}-${step.title}`}
                      className="relative flex min-h-[86px] gap-3 py-3"
                    >
                      {index <
                      scheduleSteps.length -
                        1 ? (
                        <div className="absolute left-[14px] top-[41px] h-[58px] w-px bg-[#dbe3ee]" />
                      ) : null}

                      <div className="relative z-10 flex w-7 shrink-0 justify-center pt-[2px]">
                        {completed ? (
                          <span className="flex size-7 items-center justify-center rounded-full bg-[#2563eb] text-white">
                            <CheckIcon />
                          </span>
                        ) : current ? (
                          <span className="flex size-7 items-center justify-center rounded-full border-[2px] border-[#2563eb] bg-white">
                            <span className="size-[9px] rounded-full bg-[#2563eb]" />
                          </span>
                        ) : (
                          <span className="flex size-7 items-center justify-center rounded-full border border-[#cbd5e1] bg-white">
                            <span className="size-[7px] rounded-full bg-[#cbd5e1]" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-medium text-[#64748b]">
                              {step.date}
                            </p>

                            <h3
                              className={`mt-1 text-[12px] font-bold ${
                                current
                                  ? 'text-[#2563eb]'
                                  : 'text-[#1e293b]'
                              }`}
                            >
                              {step.title}
                            </h3>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${
                              completed
                                ? 'bg-[#ecfdf5] text-[#059669]'
                                : current
                                  ? 'bg-[#eff6ff] text-[#2563eb]'
                                  : 'bg-[#f1f5f9] text-[#64748b]'
                            }`}
                          >
                            {completed
                              ? '완료'
                              : current
                                ? '진행 중'
                                : upcoming
                                  ? '예정'
                                  : ''}
                          </span>
                        </div>

                        <p className="mt-1 text-[10px] leading-[17px] text-[#64748b]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </section>

          <section className="mt-4 rounded-[10px] bg-[#f8fafc] px-4 py-3">
            <p className="text-[10px] leading-[17px] text-[#64748b]">
              {isApprovedWaiting
                ? '시공 시작 전 일정은 시공사와 최종 조율될 수 있습니다. 변경 사항은 채팅을 통해 안내됩니다.'
                : '시공 일정은 현장 상황에 따라 변경될 수 있습니다. 일정 변경 또는 진행 상황 문의는 시공사와 채팅으로 확인해주세요.'}
            </p>
          </section>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            onClick={returnToChat}
            className="h-12 w-full rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white"
          >
            시공사와 채팅하기
          </button>
        </footer>
      </div>
    </UserScreenShell>
  )
}
