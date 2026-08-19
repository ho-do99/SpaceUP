import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { ApiClientError } from '@/api/axiosInstance'
import { getContractor } from '@/api/contractorApi'
import { getVisit, requestVisitChange } from '@/api/visitApi'
import type { ContractorProfile, SiteVisit } from '@/types/backendContractor'

function toApiTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value
}

function toInputTime(value: string | null | undefined) {
  return value?.slice(0, 5) ?? ''
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

function SuccessIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#16A34A"
        strokeWidth="1.8"
      />

      <path
        d="M8 12L10.7 14.7L16 9.5"
        stroke="#16A34A"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function UserVisitSchedulePage() {
  const navigate = useNavigate()

  const {
    requestId,
    contractorId,
  } = useParams<{
    requestId: string
    contractorId: string
  }>()

  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('')
  const [address, setAddress] = useState('')
  const [requestMessage, setRequestMessage] =
    useState('')
  const [submitted, setSubmitted] =
    useState(false)
  const [visit, setVisit] = useState<SiteVisit | null>(null)
  const [contractor, setContractor] = useState<ContractorProfile | null>(null)
  const [visitMissing, setVisitMissing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const numericRequestId = requestId && /^\d+$/.test(requestId)
    ? Number(requestId)
    : null
  const numericContractorId = contractorId && /^\d+$/.test(contractorId)
    ? Number(contractorId)
    : null

  useEffect(() => {
    if (!numericContractorId) return
    let active = true
    setContractor(null)
    void getContractor(numericContractorId)
      .then((profile) => {
        if (active) setContractor(profile)
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : '시공사 정보를 불러오지 못했습니다.')
      })
    return () => { active = false }
  }, [numericContractorId])

  useEffect(() => {
    if (!numericRequestId || !numericContractorId) return
    let active = true
    setIsLoading(true)
    setVisit(null)
    setVisitMissing(false)
    setErrorMessage('')

    void getVisit(numericRequestId, numericContractorId)
      .then((currentVisit) => {
        if (!active) return
        setVisit(currentVisit)
        setVisitDate(currentVisit.requestedDate ?? currentVisit.visitDate ?? '')
        setVisitTime(toInputTime(currentVisit.requestedTime ?? currentVisit.visitTime))
        setAddress(currentVisit.address ?? '')
        setRequestMessage(currentVisit.requestReason ?? currentVisit.note ?? '')
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof ApiClientError && error.status === 404) {
          setVisitMissing(true)
        } else {
          setErrorMessage(error instanceof Error ? error.message : '방문 일정을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [numericContractorId, numericRequestId])

  const canSubmit =
    visitDate.trim().length > 0 &&
    visitTime.trim().length > 0 &&
    (!visit || requestMessage.trim().length > 0)

  const returnToChat = () => {
    navigate(
      `/mypage/requests/${requestId}/chat/${contractorId}`,
    )
  }

  const submitSchedule = async () => {
    if (!canSubmit || submitted || isSubmitting || isLoading) return

    setErrorMessage('')
    setIsSubmitting(true)

    if (visit) {
      try {
        const updatedVisit = await requestVisitChange(visit.id, {
          requestedDate: visitDate,
          requestedTime: toApiTime(visitTime),
          reason: requestMessage.trim(),
        })
        setVisit(updatedVisit)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '방문 일정 변경 요청에 실패했습니다.')
        setIsSubmitting(false)
        return
      }
    } else return

    setIsSubmitting(false)
    setSubmitted(true)

    window.setTimeout(() => {
      navigate(
        `/mypage/requests/${requestId}/chat/${contractorId}`,
      )
    }, 1300)
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="현장 방문 일정"
        onBack={returnToChat}
      />

      {/* 요청 완료 알림 */}
      {submitted ? (
        <div className="pointer-events-none absolute left-4 right-4 top-[70px] z-50">
          <div className="mx-auto flex max-w-[361px] items-center gap-3 rounded-[12px] border border-[#bbf7d0] bg-white px-4 py-3 shadow-lg">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]">
              <SuccessIcon />
            </span>

            <div className="min-w-0">
              <p className="text-[12px] font-bold leading-[18px] text-[#1e293b]">
                방문 일정 요청이 완료되었습니다.
              </p>

              <p className="mt-1 text-[10px] leading-[16px] text-[#64748b]">
                시공사 확인 후 방문 일정이 최종 확정됩니다.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5">
          <section>
            <h1 className="text-[18px] font-bold leading-[26px] text-[#1e293b]">
              현장 방문 일정을 선택해주세요.
            </h1>

            <p className="mt-2 text-[11px] leading-[18px] text-[#64748b]">
              시공사와 협의한 방문 날짜와 시간을 선택해주세요.
            </p>
          </section>

          {/* 방문 시공사 */}
          <section className="mt-6 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <p className="text-[10px] text-[#64748b]">
              방문 시공사
            </p>

            <div className="mt-3 flex items-center">
              <CompanyIcon />

              <div className="ml-3 min-w-0 flex-1">
                <h2 className="truncate text-[14px] font-bold leading-5 text-[#1e293b]">
                  {contractor?.companyName ?? contractor?.memberName ?? (numericContractorId ? '시공사 정보 불러오는 중' : '시공사')}
                </h2>

                <p className="mt-1 text-[10px] leading-4 text-[#64748b]">
                  {[contractor?.activityRegions, contractor?.specialties].filter(Boolean).join(' · ') || '업체 정보를 확인하고 있습니다.'}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <span className={`size-[7px] rounded-full ${contractor?.availableForConsult ? 'bg-[#22c55e]' : 'bg-[#94a3b8]'}`} />

                <span className={`text-[10px] ${contractor?.availableForConsult ? 'text-[#16a34a]' : 'text-[#64748b]'}`}>
                  {contractor?.availableForConsult ? '상담 가능' : '상담 여부 확인 필요'}
                </span>
              </div>
            </div>
          </section>

          {visitMissing ? (
            <section className="mt-5 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-4">
              <h2 className="text-[12px] font-bold text-[#1e40af]">등록된 방문 일정이 없습니다.</h2>
              <p className="mt-2 text-[10px] leading-[17px] text-[#475569]">
                채팅에서 시공사와 일정을 먼저 협의해 주세요. 시공사가 일정을 등록하면 이 화면에서 변경을 요청할 수 있습니다.
              </p>
            </section>
          ) : null}

          {/* 일정 입력 */}
          {visit ? <section className="mt-5">
            <label className="block">
              <span className="text-[11px] font-bold text-[#1e293b]">
                방문 날짜 *
              </span>

              <input
                type="date"
                value={visitDate}
                disabled={submitted || isLoading || isSubmitting}
                onChange={(event) =>
                  setVisitDate(event.target.value)
                }
                className="mt-2 h-12 w-full rounded-[7px] border border-[#cbd5e1] bg-white px-3 text-[12px] font-medium text-[#1e293b] outline-none focus:border-[#2563eb] disabled:bg-[#f8fafc]"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-[11px] font-bold text-[#1e293b]">
                방문 시간 *
              </span>

              <select
                value={visitTime}
                disabled={submitted || isLoading || isSubmitting}
                onChange={(event) =>
                  setVisitTime(event.target.value)
                }
                className="mt-2 h-12 w-full appearance-none rounded-[7px] border border-[#cbd5e1] bg-white px-3 text-[12px] font-medium text-[#1e293b] outline-none focus:border-[#2563eb] disabled:bg-[#f8fafc]"
              >
                <option value="">
                  방문 시간을 선택해주세요.
                </option>

                <option value="09:00">오전 9:00</option>
                <option value="10:00">오전 10:00</option>
                <option value="11:00">오전 11:00</option>
                <option value="13:00">오후 1:00</option>
                <option value="14:00">오후 2:00</option>
                <option value="15:00">오후 3:00</option>
                <option value="16:00">오후 4:00</option>
                <option value="17:00">오후 5:00</option>
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-[11px] font-bold text-[#1e293b]">
                방문 주소
              </span>

              <input
                type="text"
                value={address}
                disabled={submitted || isLoading || isSubmitting}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="방문 주소를 입력해주세요."
                className="mt-2 h-12 w-full rounded-[7px] border border-[#cbd5e1] bg-white px-3 text-[12px] font-medium text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] disabled:bg-[#f8fafc]"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-[11px] font-bold text-[#1e293b]">
                요청 사항
              </span>

              <textarea
                value={requestMessage}
                maxLength={200}
                disabled={submitted || isLoading || isSubmitting}
                onChange={(event) =>
                  setRequestMessage(event.target.value)
                }
                placeholder="방문 전 전달할 내용을 입력해주세요."
                className="mt-2 h-[96px] w-full resize-none rounded-[7px] border border-[#cbd5e1] bg-white p-3 text-[12px] leading-5 text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] disabled:bg-[#f8fafc]"
              />

              <p className="mt-1 text-right text-[9px] text-[#94a3b8]">
                {requestMessage.length} / 200
              </p>
            </label>
            {errorMessage ? <p role="alert" className="mt-2 text-center text-[10px] leading-[17px] text-[#ef4444]">{errorMessage}</p> : null}
          </section> : null}

          <section className="mt-5 rounded-[10px] bg-[#f8fafc] px-4 py-3">
            <p className="text-[10px] leading-[17px] text-[#64748b]">
              선택한 일정은 시공사에 전달됩니다. 시공사 확인 후
              방문 일정이 최종 확정됩니다.
            </p>
          </section>
        </main>

        <footer className={`grid shrink-0 gap-3 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))] pt-2 ${visit ? 'grid-cols-[1fr_1.4fr]' : 'grid-cols-1'}`}>
          <button
            type="button"
            disabled={submitted || isSubmitting}
            onClick={returnToChat}
            className="h-12 rounded-[5px] border border-[#2563eb] bg-white text-[12px] font-bold text-[#2563eb] disabled:border-[#cbd5e1] disabled:text-[#94a3b8]"
          >
            {visit ? '취소' : '채팅으로 돌아가기'}
          </button>

          {visit ? <button
            type="button"
            disabled={!canSubmit || submitted || isLoading || isSubmitting}
            onClick={() => { void submitSchedule() }}
            className="h-12 rounded-[5px] border border-[#2563eb] bg-[#2563eb] text-[12px] font-bold text-white disabled:border-[#93b4f5] disabled:bg-[#93b4f5]"
          >
            {submitted
              ? '요청 완료'
              : isSubmitting
                ? '요청 중'
              : '방문 일정 요청하기'}
          </button> : null}
        </footer>
      </div>
    </UserScreenShell>
  )
}
