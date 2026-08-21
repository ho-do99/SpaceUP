import {
  useEffect,
  useRef,
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
import { ApiClientError } from '@/api/axiosInstance'

export default function ContractorVisitPage() {
  const { requestId } = useParams()

  const [searchParams] = useSearchParams()

  const navigate = useNavigate()

  const liveRequest = useContractorRequest(requestId)
  const isLive = /^\d+$/.test(requestId ?? '')
  const request = isLive ? liveRequest.request : findContractorRequestDetail(requestId)
  const linkedProject = isLive ? null : findContractorProjectByRequestId(requestId)
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
    isLive ? '' : contractorDefaultVisitSchedule.date,
  )

  const [time, setTime] = useState(
    isLive ? '' : contractorDefaultVisitSchedule.time,
  )

  const [managerName, setManagerName] = useState(
    isLive ? '' : contractorDefaultVisitSchedule.managerName,
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

  const [isVisitLoading, setIsVisitLoading] =
    useState(isLive)

  const [visitLoadVersion, setVisitLoadVersion] =
    useState(0)

  const [isMutating, setIsMutating] =
    useState(false)

  const actionInFlightRef = useRef(false)

  const applyLiveVisit = (visit: SiteVisit) => {
    setLiveVisit(visit)
    setDate(visit.visitDate ?? '')
    setTime(visit.visitTime?.slice(0, 5) ?? '')
    setManagerName(visit.managerName ?? '')
    setNote(visit.note ?? '')
  }

  useEffect(() => {
    if (!isLive || !requestId) return
    let active = true
    setLiveVisit(null)
    setDate('')
    setTime('')
    setManagerName('')
    setNote('')
    setErrorMessage('')
    setIsVisitLoading(true)
    void getVisit(Number(requestId))
      .then((visit) => {
        if (!active) return
        applyLiveVisit(visit)
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : '방문 일정을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setIsVisitLoading(false)
      })
    return () => { active = false }
  }, [isLive, requestId, visitLoadVersion])

  if (isLive && liveRequest.loading) {
    return <ContractorMobileShell><main className="flex min-h-dvh items-center justify-center text-sm text-[#64748b]">방문 일정을 불러오는 중입니다.</main></ContractorMobileShell>
  }

  if (!request) {
    return <ContractorRequestNotFound />
  }

  if (isLive && isVisitLoading) {
    return <ContractorMobileShell><main className="flex min-h-dvh items-center justify-center text-sm text-[#64748b]">방문 일정 상태를 확인하는 중입니다.</main></ContractorMobileShell>
  }

  if (isLive && !liveVisit) {
    return (
      <ContractorMobileShell>
        <ContractorAppBar title="현장 방문 일정" back />
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p role="alert" className="text-sm font-bold text-[#dc2626]">{errorMessage || '방문 일정 상태를 확인하지 못했습니다.'}</p>
          <p className="mt-2 text-xs leading-5 text-[#64748b]">상태 확인 전에는 중복 등록을 막기 위해 일정 입력을 열지 않습니다.</p>
          <button type="button" onClick={() => setVisitLoadVersion((version) => version + 1)} className="mt-5 h-11 rounded-lg bg-[#2563eb] px-6 text-xs font-bold text-white">다시 불러오기</button>
        </main>
      </ContractorMobileShell>
    )
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

  const effectiveVisitStatus: ContractorVisitStatus = isLive
    ? (liveVisit?.status as ContractorVisitStatus | undefined) ?? 'UNSCHEDULED'
    : isCompletedView
      ? 'COMPLETED'
      : projectVisitSchedule
        ? 'SCHEDULED'
        : visitStatus

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

  const emptyLiveSchedule: ContractorVisitSchedule = {
    date: '', time: '', address: request.property.address,
    managerName: '', note: '',
  }

  const currentSchedule = isLive
    ? liveSchedule ?? emptyLiveSchedule
    : isCompletedView
      ? visitSchedule?.completedAt
        ? visitSchedule
        : completedPreviewSchedule
      : projectVisitSchedule ?? visitSchedule ?? contractorDefaultVisitSchedule

  const currentChangeRequest = isLive
    ? {
        requestedBy: 'customer' as const,
        previousDate: liveVisit?.visitDate ?? '',
        previousTime: liveVisit?.visitTime?.slice(0, 5) ?? '',
        requestedDate: liveVisit?.requestedDate ?? '',
        requestedTime: liveVisit?.requestedTime?.slice(0, 5) ?? '',
        reason: liveVisit?.requestReason ?? '',
      }
    : changeRequest

  const isInitialScheduleRequest = Boolean(
    isLive &&
    liveVisit?.status === 'CHANGE_REQUESTED' &&
    (!liveVisit.visitDate || (
      liveVisit.visitDate === liveVisit.requestedDate &&
      liveVisit.visitTime?.slice(0, 5) === liveVisit.requestedTime?.slice(0, 5) &&
      !liveVisit.managerName
    )),
  )

  const beginLiveAction = () => {
    if (actionInFlightRef.current) return false
    actionInFlightRef.current = true
    setIsMutating(true)
    setErrorMessage('')
    return true
  }

  const endLiveAction = () => {
    actionInFlightRef.current = false
    setIsMutating(false)
  }

  const handleLiveActionError = async (error: unknown, fallback: string) => {
    let message = error instanceof Error ? error.message : fallback
    if (error instanceof ApiClientError && error.status === 409 && requestId) {
      try {
        applyLiveVisit(await getVisit(Number(requestId)))
        message = '일정 상태가 이미 변경되어 최신 상태를 불러왔습니다.'
      } catch {
        // 원래 처리 오류를 유지합니다.
      }
    }
    setErrorMessage(message)
  }

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

    const schedule: ContractorVisitSchedule = {
      date,
      time,
      address: request.property.address,
      managerName: isLive ? managerName.trim() : contractorDefaultVisitSchedule.managerName,
      note: note.trim(),
    }
    if (isLive && requestId) {
      if (!beginLiveAction()) return
      try {
        applyLiveVisit(await registerVisitApi(Number(requestId), {
          visitDate: date, visitTime: time, managerName: schedule.managerName, note: schedule.note,
        }))
      } catch (error) {
        await handleLiveActionError(error, '방문 일정 등록에 실패했습니다.')
        return
      } finally {
        endLiveAction()
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
      if (!beginLiveAction()) return
      try { applyLiveVisit(await acceptVisitChange(liveVisit.id)) } catch (error) {
        await handleLiveActionError(error, '일정 승인에 실패했습니다.')
      } finally {
        endLiveAction()
      }
    } else acceptChangeRequest()
  }

  const proposeChange = async (schedule: ContractorVisitSchedule) => {
    if (isLive && liveVisit) {
      if (!beginLiveAction()) return
      try {
        applyLiveVisit(await proposeVisitChange(liveVisit.id, {
          visitDate: schedule.date, visitTime: schedule.time,
          managerName: schedule.managerName, note: schedule.note,
        }))
      } catch (error) {
        await handleLiveActionError(error, '새 일정 제안에 실패했습니다.')
        return
      } finally {
        endLiveAction()
      }
    } else proposeVisit(schedule)
    setProposalOpen(false)
  }

  const rejectChange = async () => {
    if (isLive && liveVisit) {
      if (!beginLiveAction()) return
      try { applyLiveVisit(await rejectVisitChange(liveVisit.id)) } catch (error) {
        await handleLiveActionError(error, '일정 요청 거절에 실패했습니다.')
        return
      } finally {
        endLiveAction()
      }
    } else rejectChangeRequest()
    setRejectOpen(false)
  }

  const finishVisit = async () => {
    if (isLive && liveVisit) {
      if (!beginLiveAction()) return
      try { applyLiveVisit(await completeVisitApi(liveVisit.id, currentSchedule.note)) } catch (error) {
        await handleLiveActionError(error, '방문 완료 처리에 실패했습니다.')
        return
      } finally {
        endLiveAction()
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
              changeRequestLabel={isInitialScheduleRequest ? '일정 요청' : undefined}
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

          {errorMessage ? (
            <p role="alert" className="mt-3 text-center text-xs font-semibold text-[#dc2626]">
              {errorMessage}
            </p>
          ) : null}

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
                  disabled={isMutating}
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
                  disabled={isMutating}
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
                  readOnly={!isLive}
                  disabled={isMutating}
                  value={managerName}
                  onChange={(event) => setManagerName(event.target.value)}
                  className="mt-1 h-12 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-normal text-[#64748b]"
                />
              </label>

              <label className="block text-[11px] font-bold text-[#1e293b]">
                방문 메모

                <textarea
                  value={note}
                  disabled={isMutating}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="확인할 내용을 입력하세요."
                  className="mt-1 h-16 w-full resize-none rounded-lg border border-[#e2e8f0] bg-white p-3 text-xs font-normal outline-none focus:border-[#2563eb]"
                />
              </label>

              <button
                type="submit"
                disabled={isMutating}
                className="h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMutating ? '등록 중' : '방문 일정 등록'}
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
                disabled={isMutating}
                className="h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                  {isInitialScheduleRequest ? '방문 일정 요청' : '일정 변경 요청'}
                </h2>

                <p className="mt-1 text-[11px]">
                  사용자가 현장 방문 {isInitialScheduleRequest ? '일정을' : '일정 변경을'}
                  요청했습니다.
                </p>
              </section>

              {!isInitialScheduleRequest ? <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <h2 className="text-sm font-bold">
                  기존 일정
                </h2>

                <p className="mt-3 text-xs text-[#64748b]">
                  {currentChangeRequest.previousDate.replace(
                    /-/g,
                    '.',
                  )}{' '}
                  · {currentChangeRequest.previousTime}
                </p>

                <p className="mt-1 break-words text-xs text-[#64748b]">
                  {request.property.address}
                </p>
              </section> : null}

              <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <h2 className="text-sm font-bold">
                  {isInitialScheduleRequest ? '요청 일정' : '변경 요청'}
                </h2>

                <p className="mt-3 text-xs text-[#64748b]">
                  요청 날짜{' '}
                  {currentChangeRequest.requestedDate.replace(
                    /-/g,
                    '.',
                  )}
                </p>

                <p className="mt-1 text-xs text-[#64748b]">
                  요청 시간{' '}
                  {currentChangeRequest.requestedTime}
                </p>

                <p className="mt-1 break-words text-xs leading-5 text-[#64748b]">
                  {currentChangeRequest.reason}
                </p>
              </section>

              <button
                type="button"
                onClick={() => { void acceptChange() }}
                disabled={isMutating}
                className="h-12 w-full rounded-lg bg-[#2563eb] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMutating ? '처리 중' : isInitialScheduleRequest ? '방문 일정 확정' : '변경 일정 승인'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setProposalOpen(true)
                }
                disabled={isMutating}
                className="h-12 w-full rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                다른 일정 제안
              </button>

              <button
                type="button"
                onClick={() =>
                  setRejectOpen(true)
                }
                disabled={isMutating}
                className="h-12 w-full rounded-lg border border-[#ef4444] bg-white text-sm font-bold text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isInitialScheduleRequest ? '방문 요청 거절' : '변경 요청 거절'}
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
                to={`/contractor/requests/${request.requestId}/estimate?mode=completed`}
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
        initialRequest={isInitialScheduleRequest}
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
