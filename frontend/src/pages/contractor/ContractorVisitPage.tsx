import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorVisitChangeRejectDialog from '@/components/contractor/ContractorVisitChangeRejectDialog'
import ContractorVisitCompletionDialog from '@/components/contractor/ContractorVisitCompletionDialog'
import ContractorVisitScheduleCard from '@/components/contractor/ContractorVisitScheduleCard'
import ContractorVisitScheduleDialog from '@/components/contractor/ContractorVisitScheduleDialog'
import ContractorVisitStatusTabs from '@/components/contractor/ContractorVisitStatusTabs'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import {
  contractorDefaultVisitSchedule,
  findContractorProjectByRequestId,
  findContractorRequestDetail,
} from '@/mocks/contractorPortalMockData'
import type {
  ContractorVisitSchedule,
  ContractorVisitStatus,
} from '@/types/contractorPortal'

import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'
import type { SiteVisit } from '@/types/backendContractor'
import { acceptVisitChange, completeVisit as completeVisitApi, getVisit, proposeVisitChange, registerVisit as registerVisitApi, rejectVisitChange } from '@/api/visitApi'

export default function ContractorVisitPage() {
  const { requestId } = useParams()

  const [searchParams] = useSearchParams()

  const navigate = useNavigate()

  const liveRequest = useContractorRequest(requestId)
  const isLive = /^\d+$/.test(requestId ?? '')
  const request = isLive ? liveRequest.request : findContractorRequestDetail(requestId)
  const linkedProject = findContractorProjectByRequestId(requestId)
  const [liveVisit, setLiveVisit] = useState<SiteVisit | null>(null)

  const {
    visitStatus,
    visitSchedule,
    changeRequest,
    registerVisit,
    showChangeRequest,
    acceptChangeRequest,
    proposeVisit,
    rejectChangeRequest,
    completeVisit,
  } = useContractorPortalFlow()

  const [date, setDate] = useState(
    contractorDefaultVisitSchedule.date,
  )

  const [time, setTime] = useState(
    contractorDefaultVisitSchedule.time,
  )

  const [note, setNote] = useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [proposalOpen, setProposalOpen] =
    useState(false)

  const [rejectOpen, setRejectOpen] =
    useState(false)

  const [completionOpen, setCompletionOpen] =
    useState(false)

  useEffect(() => {
    if (!isLive || !requestId) return
    getVisit(Number(requestId)).then(setLiveVisit).catch(() => setLiveVisit(null))
  }, [isLive, requestId])

  if (!request) {
    return <ContractorRequestNotFound />
  }

  const isCompletedView =
    searchParams.get('mode') === 'completed'

  const projectVisitSchedule: ContractorVisitSchedule | null =
    linkedProject?.status === 'VISIT_SCHEDULED' &&
    linkedProject.schedule.visitDate &&
    linkedProject.schedule.visitTime
      ? {
          date: linkedProject.schedule.visitDate,
          time: linkedProject.schedule.visitTime,
          address: request.property.address,
          managerName: linkedProject.managerName,
          note: '',
        }
      : null

  const effectiveVisitStatus: ContractorVisitStatus =
    isCompletedView
      ? 'COMPLETED'
      : projectVisitSchedule
        ? 'SCHEDULED'
        : (liveVisit?.status as ContractorVisitStatus | undefined) ?? visitStatus

  const completedPreviewSchedule: ContractorVisitSchedule =
    {
      ...contractorDefaultVisitSchedule,
      address: request.property.address,
      note:
        visitSchedule?.note?.trim() ||
        '바닥 상태와 벽지 교체를 위한 치수를 확인했습니다.',
      completedAt:
        visitSchedule?.completedAt ??
        `${contractorDefaultVisitSchedule.date} ${contractorDefaultVisitSchedule.time}`,
    }

  const liveSchedule: ContractorVisitSchedule | null = liveVisit?.visitDate && liveVisit.visitTime ? {
    date: liveVisit.visitDate,
    time: liveVisit.visitTime,
    address: liveVisit.address || request.property.address,
    managerName: liveVisit.managerName || '',
    note: liveVisit.note || '',
    completedAt: liveVisit.completedAt ?? undefined,
  } : null

  const currentSchedule =
    isCompletedView
      ? (liveSchedule?.completedAt || visitSchedule?.completedAt)
        ? (liveSchedule ?? visitSchedule!)
        : completedPreviewSchedule
      : liveSchedule ?? projectVisitSchedule ?? visitSchedule ??
        contractorDefaultVisitSchedule

  const register = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!date || !time) {
      setErrorMessage(
        '방문 날짜와 시간을 모두 입력해 주세요.',
      )
      return
    }

    setErrorMessage('')

    const schedule = {
      ...contractorDefaultVisitSchedule,
      date,
      time,
      address: request.property.address,
      note: note.trim(),
    }
    if (isLive && requestId) {
      try {
        setLiveVisit(await registerVisitApi(Number(requestId), {
          visitDate: date, visitTime: time, managerName: schedule.managerName, note: schedule.note,
        }))
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '방문 일정 등록에 실패했습니다.')
        return
      }
    } else {
      registerVisit(schedule)
    }
  }

  const availableStatuses: readonly ContractorVisitStatus[] =
    effectiveVisitStatus === 'UNSCHEDULED'
      ? ['UNSCHEDULED']
      : effectiveVisitStatus === 'COMPLETED'
        ? ['COMPLETED']
        : ['SCHEDULED', 'CHANGE_REQUESTED']

  const selectStatus = (
    status: ContractorVisitStatus,
  ) => {
    if (isCompletedView) {
      return
    }

    if (status === 'CHANGE_REQUESTED') {
      if (!isLive) showChangeRequest()
    }

    if (
      status === 'SCHEDULED' &&
      visitStatus === 'CHANGE_REQUESTED'
    ) {
      if (!isLive) rejectChangeRequest()
    }
  }

  const acceptChange = async () => {
    if (isLive && liveVisit) {
      try { setLiveVisit(await acceptVisitChange(liveVisit.id)) } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '일정 변경 승인에 실패했습니다.')
      }
    } else acceptChangeRequest()
  }

  const proposeChange = async (schedule: ContractorVisitSchedule) => {
    if (isLive && liveVisit) {
      try {
        setLiveVisit(await proposeVisitChange(liveVisit.id, {
          visitDate: schedule.date, visitTime: schedule.time,
          managerName: schedule.managerName, note: schedule.note,
        }))
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '새 일정 제안에 실패했습니다.')
        return
      }
    } else proposeVisit(schedule)
    setProposalOpen(false)
  }

  const rejectChange = async () => {
    if (isLive && liveVisit) {
      try { setLiveVisit(await rejectVisitChange(liveVisit.id)) } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '일정 변경 거절에 실패했습니다.')
        return
      }
    } else rejectChangeRequest()
    setRejectOpen(false)
  }

  const finishVisit = async () => {
    if (isLive && liveVisit) {
      try { setLiveVisit(await completeVisitApi(liveVisit.id, currentSchedule.note)) } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '방문 완료 처리에 실패했습니다.')
        return
      }
    } else completeVisit()
    setCompletionOpen(false)
    navigate(`/contractor/requests/${request.requestId}/chat/completed`)
  }

  return (
    <>
      <ContractorMobileShell>
        <ContractorAppBar
          title="현장 방문 일정"
          back
        />

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <p className="text-xs leading-5 text-[#64748b]">
            사용자와 일정을 확정하고 실제 현장을
            확인한 뒤 방문 완료를 처리하세요.
          </p>

          <div className="mt-3">
            <ContractorVisitStatusTabs
              status={effectiveVisitStatus}
              availableStatuses={
                availableStatuses
              }
              onSelect={selectStatus}
            />
          </div>

          <section className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-sm font-bold text-[#2563eb]">
              {request.customerName} ·{' '}
              {request.requestId}
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-[#64748b]">
              {request.property.address}
            </p>

            <p className="mt-1 text-xs text-[#64748b]">
              연락처 {request.maskedPhone}
            </p>
          </section>

          {effectiveVisitStatus ===
          'UNSCHEDULED' ? (
            <form
              onSubmit={register}
              className="mt-4 space-y-3"
            >
              <section className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-3 text-[#c2410c]">
                <h2 className="text-[13px] font-bold">
                  등록된 방문 일정이 없습니다
                </h2>

                <p className="mt-1 text-[11px] leading-4">
                  사용자와 협의한 방문 날짜와 시간을
                  등록해 주세요.
                </p>
              </section>

              <label className="block text-[11px] font-bold text-[#1e293b]">
                방문 날짜

                <input
                  type="date"
                  required
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  className="mt-1 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-normal outline-none focus:border-[#2563eb]"
                />
              </label>

              <label className="block text-[11px] font-bold text-[#1e293b]">
                방문 시간

                <input
                  type="time"
                  required
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  className="mt-1 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-normal outline-none focus:border-[#2563eb]"
                />
              </label>

              <label className="block text-[11px] font-bold text-[#1e293b]">
                방문 주소

                <input
                  type="text"
                  readOnly
                  value={request.property.address}
                  className="mt-1 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-normal text-[#64748b]"
                />
              </label>

              <label className="block text-[11px] font-bold text-[#1e293b]">
                담당자

                <input
                  type="text"
                  readOnly
                  value={
                    contractorDefaultVisitSchedule.managerName
                  }
                  className="mt-1 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-normal text-[#64748b]"
                />
              </label>

              <label className="block text-[11px] font-bold text-[#1e293b]">
                방문 메모

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="확인할 내용을 입력하세요."
                  className="mt-1 h-16 w-full resize-none rounded-lg border border-[#e2e8f0] bg-white p-3 text-xs font-normal outline-none focus:border-[#2563eb]"
                />
              </label>

              {errorMessage ? (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#dc2626]"
                >
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                className="h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white"
              >
                방문 일정 등록
              </button>
            </form>
          ) : null}

          {effectiveVisitStatus ===
          'SCHEDULED' ? (
            <div className="mt-4 space-y-3">
              <section className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-[#047857]">
                <h2 className="text-[13px] font-bold">
                  현장 방문 예정
                </h2>

                <p className="mt-1 text-[11px] leading-4">
                  {currentSchedule.date.replace(
                    /-/g,
                    '.',
                  )}{' '}
                  {currentSchedule.time} 방문
                  예정입니다.
                </p>
              </section>

              <ContractorVisitScheduleCard
                schedule={currentSchedule}
              />

              {!isLive ? <button
                type="button"
                onClick={showChangeRequest}
                className="h-12 w-full rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb]"
              >
                일정 변경 요청 확인
              </button> : null}

              <button
                type="button"
                onClick={() =>
                  setCompletionOpen(true)
                }
                className="h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white"
              >
                현장 확인 완료 처리
              </button>
            </div>
          ) : null}

          {effectiveVisitStatus ===
          'CHANGE_REQUESTED' ? (
            <div className="mt-4 space-y-3">
              <section className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-3 text-[#c2410c]">
                <h2 className="text-[13px] font-bold">
                  일정 변경 요청
                </h2>

                <p className="mt-1 text-[11px]">
                  사용자가 현장 방문 일정 변경을
                  요청했습니다.
                </p>
              </section>

              <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <h2 className="text-sm font-bold">
                  기존 일정
                </h2>

                <p className="mt-3 text-xs text-[#64748b]">
                  {changeRequest.previousDate.replace(
                    /-/g,
                    '.',
                  )}{' '}
                  · {changeRequest.previousTime}
                </p>

                <p className="mt-1 break-words text-xs text-[#64748b]">
                  {request.property.address}
                </p>
              </section>

              <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <h2 className="text-sm font-bold">
                  변경 요청
                </h2>

                <p className="mt-3 text-xs text-[#64748b]">
                  요청 날짜{' '}
                  {changeRequest.requestedDate.replace(
                    /-/g,
                    '.',
                  )}
                </p>

                <p className="mt-1 text-xs text-[#64748b]">
                  요청 시간{' '}
                  {changeRequest.requestedTime}
                </p>

                <p className="mt-1 break-words text-xs leading-5 text-[#64748b]">
                  {changeRequest.reason}
                </p>
              </section>

              <button
                type="button"
                onClick={() => { void acceptChange() }}
                className="h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white"
              >
                변경 일정 승인
              </button>

              <button
                type="button"
                onClick={() =>
                  setProposalOpen(true)
                }
                className="h-12 w-full rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb]"
              >
                다른 일정 제안
              </button>

              <button
                type="button"
                onClick={() =>
                  setRejectOpen(true)
                }
                className="h-12 w-full rounded-lg border border-[#ef4444] bg-white text-sm font-bold text-[#ef4444]"
              >
                변경 요청 거절
              </button>
            </div>
          ) : null}

          {effectiveVisitStatus ===
          'COMPLETED' ? (
            <div className="mt-4 space-y-3">
              <section className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3 text-[#047857]">
                <h2 className="text-[13px] font-bold">
                  현장 방문 완료
                </h2>

                <p className="mt-1 text-[11px] leading-4">
                  {currentSchedule.completedAt?.replace(
                    /-/g,
                    '.',
                  )}
                  에 현장 방문을 완료했습니다.
                </p>

                <p className="text-[11px]">
                  방문 결과를 확인하고 후속 작업을
                  진행하세요.
                </p>
              </section>

              <ContractorVisitScheduleCard
                schedule={currentSchedule}
              />

              <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <h2 className="text-sm font-bold">
                  활동 기록
                </h2>

                <p className="mt-2 text-xs leading-5 text-[#64748b]">
                  일정 등록 · 일정 변경 · 현장 방문
                  완료
                </p>

                <p className="text-xs text-[#64748b]">
                  완료 시간{' '}
                  {currentSchedule.completedAt?.replace(
                    /-/g,
                    '.',
                  )}
                </p>
              </section>

              <Link
                to={`/contractor/requests/${request.requestId}/chat/completed`}
                className="flex h-12 items-center justify-center rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb]"
              >
                방문 완료 채팅으로 이동
              </Link>

              <Link
                to={`/contractor/requests/${request.requestId}/estimate-ready`}
                className="flex h-12 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white"
              >
                견적 작성으로 이동
              </Link>
            </div>
          ) : null}
        </main>
      </ContractorMobileShell>

      <ContractorVisitScheduleDialog
        open={proposalOpen}
        currentSchedule={currentSchedule}
        onClose={() =>
          setProposalOpen(false)
        }
        onSubmit={(schedule) => { void proposeChange(schedule) }}
      />

      <ContractorVisitChangeRejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={() => { void rejectChange() }}
      />

      <ContractorVisitCompletionDialog
        open={completionOpen}
        onClose={() =>
          setCompletionOpen(false)
        }
        onConfirm={() => { void finishVisit() }}
      />
    </>
  )
}
