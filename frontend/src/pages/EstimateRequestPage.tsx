import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { getContractorById } from '@/mocks/contractors'
import type { ContractorSummary } from '@/mocks/contractors'
import { getContractor } from '@/api/contractorApi'
import { inviteContractor, updateRequest } from '@/api/requestApi'
import { profileToSummary } from '@/utils/contractorAdapter'
import { getActiveRequestId, parseManwon } from '@/utils/requestFlow'

interface EstimateRequestFormState {
  name: string
  phone: string
  region: string
  budget: string
  areaScope: string
  preferredDate: string
  requestMessage: string
  agreedToPrivacy: boolean
}

function getContractorIdFromNavigationState(state: unknown) {
  if (!state || typeof state !== 'object' || !('contractorId' in state)) {
    return null
  }

  return typeof state.contractorId === 'string' ? state.contractorId : null
}

export default function EstimateRequestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const contractorId = getContractorIdFromNavigationState(location.state as unknown)
  const [contractor, setContractor] = useState<ContractorSummary | undefined>(() => getContractorById(contractorId ?? undefined))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState<EstimateRequestFormState>({
    name: '',
    phone: '',
    region: '광주광역시 서구',
    budget: '1,500만원',
    areaScope: '',
    preferredDate: '',
    requestMessage: '',
    agreedToPrivacy: false,
  })

  useEffect(() => {
    if (!contractorId || !/^\d+$/.test(contractorId)) return
    getContractor(Number(contractorId)).then((profile) => setContractor(profileToSummary(profile))).catch(() => setContractor(undefined))
  }, [contractorId])

  const canSubmit = Boolean(
    contractor &&
      form.name.trim() &&
      form.phone.trim() &&
      form.region.trim() &&
      form.budget.trim() &&
      form.agreedToPrivacy,
  )

  const updateField = <Key extends keyof EstimateRequestFormState>(
    key: Key,
    value: EstimateRequestFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || !contractor) return

    const requestId = getActiveRequestId()
    const numericContractorId = Number(contractor.id)
    setIsSubmitting(true)
    setSubmitError('')
    try {
      if (requestId && Number.isSafeInteger(numericContractorId)) {
        const budget = parseManwon(form.budget)
        await updateRequest(requestId, {
          region: form.region.trim(),
          budgetMin: budget,
          budgetMax: budget,
          desiredDate: form.preferredDate || undefined,
          requestedItems: '바닥재,벽지,조명',
        })
        await inviteContractor(requestId, numericContractorId)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '견적 요청에 실패했습니다.')
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)
    navigate('/estimate/request/complete', {
      state: {
        requestId,
        contractorId: contractor.id,
        contractorName: contractor.companyName,
        budget: form.budget,
        preferredDate: form.preferredDate,
      },
    })
  }

  if (!contractor) {
    return (
      <UserScreenShell className="h-dvh">
        <UserHeader variant="detail" title="견적 요청" onBack={() => navigate('/contractors')} />
        <main className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <h1 className="text-[18px] font-bold text-[#1e293b]">시공사 선택이 필요합니다</h1>
          <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
            견적을 요청할 시공사를 목록에서 선택해주세요.
          </p>
          <Link
            to="/contractors"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            시공사 선택하기
          </Link>
        </main>
      </UserScreenShell>
    )
  }

  const inputClass =
    'mt-1.5 h-[35px] w-full rounded-[5px] border border-[#cbd5e1] bg-white px-2.5 text-[11px] text-[#334155] outline-none placeholder:text-[#64748b] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]'

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="견적 요청" onBack={() => navigate(-1)} />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[15px] pb-6">
          <section className="pb-3 pt-9 text-center">
            <h1 className="text-[18px] font-bold leading-[22px] text-[#15284c]">
              선택한 시공사에 견적을 요청하세요
            </h1>
            <p className="mt-2 text-[10px] leading-[17px] text-[#657187]">
              정확한 견적을 위해 정보를 입력해주세요.
            </p>
          </section>

          <section className="mt-2 rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]" aria-label="선택한 시공사">
            <p className="text-[10px] font-bold text-[#64748b]">선택한 시공사</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#f8fafc] text-[16px] font-bold text-[#2563eb]">
                {contractor.initial}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[14px] font-bold text-[#1e293b]">{contractor.companyName}</h2>
                <p className="mt-1 text-[10px] text-[#64748b]">{contractor.region} · 리모델링 전문</p>
                <p className="mt-1 text-[10px] font-bold text-[#f59e0b]">★ {contractor.rating.toFixed(1)} ({contractor.reviewCount})</p>
              </div>
              <div className="shrink-0 rounded-[8px] bg-[#eff6ff] px-3 py-2 text-center">
                <span className="block text-[8px] text-[#64748b]">매칭 점수</span>
                <strong className="mt-1 block text-[16px] text-[#2563eb]">{contractor.matchingScore}점</strong>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="truncate text-[9px] text-[#64748b]">{contractor.specialties.join(' · ')}</p>
              <button
                type="button"
                className="shrink-0 rounded-[6px] border border-[#bfdbfe] px-2 py-1 text-[9px] text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                onClick={() => navigate('/contractors')}
              >
                변경
              </button>
            </div>
          </section>

          <div className="mt-7 grid grid-cols-2 gap-x-2 gap-y-4">
            <label className="text-[10px] font-bold text-[#1e293b]">
              이름 *
              <input
                required
                autoComplete="name"
                value={form.name}
                placeholder="이름을 입력해주세요"
                className={inputClass}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>
            <label className="text-[10px] font-bold text-[#1e293b]">
              연락처 *
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                placeholder="010-0000-0000"
                className={inputClass}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </label>
            <label className="text-[10px] font-bold text-[#1e293b]">
              지역 *
              <input
                required
                autoComplete="address-level1"
                value={form.region}
                className={inputClass}
                onChange={(event) => updateField('region', event.target.value)}
              />
            </label>
            <label className="text-[10px] font-bold text-[#1e293b]">
              예산 *
              <input
                required
                value={form.budget}
                className={inputClass}
                onChange={(event) => updateField('budget', event.target.value)}
              />
            </label>
          </div>

          <label className="mt-4 block text-[10px] font-bold text-[#1e293b]">
            평수 / 시공
            <input
              value={form.areaScope}
              placeholder="-"
              className={inputClass}
              onChange={(event) => updateField('areaScope', event.target.value)}
            />
          </label>

          <section className="mt-4" aria-labelledby="selected-items-title">
            <h2 id="selected-items-title" className="text-[10px] font-bold text-[#1e293b]">선택 항목</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {['거실 조명 교체 ×', '바닥재 교체 ×', '벽지 교체 ×'].map((item) => (
                <li key={item} className="rounded-[5px] border border-[#bfdbfe] bg-[#eff6ff] px-2 py-1 text-[8px] text-[#2563eb]">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <label className="mt-4 block text-[10px] font-bold text-[#1e293b]">
            희망 일정
            <input
              type="date"
              value={form.preferredDate}
              className={inputClass}
              onChange={(event) => updateField('preferredDate', event.target.value)}
            />
          </label>

          <label className="mt-4 block text-[10px] font-bold text-[#1e293b]">
            요청 사항
            <textarea
              maxLength={200}
              value={form.requestMessage}
              className="mt-2 h-14 w-full resize-none rounded-[5px] border border-[#cbd5e1] bg-white p-2.5 text-[11px] text-[#334155] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              onChange={(event) => updateField('requestMessage', event.target.value)}
            />
            <span className="mt-1 block text-right text-[8px] font-normal text-[#64748b]">
              {form.requestMessage.length} / 200
            </span>
          </label>

          <label className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-[#475569]">
            <input
              required
              type="checkbox"
              checked={form.agreedToPrivacy}
              className="mt-0.5 size-4 accent-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
              onChange={(event) => updateField('agreedToPrivacy', event.target.checked)}
            />
            <span>개인정보 수집 및 이용에 동의합니다.</span>
          </label>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            isLoading={isSubmitting}
            className="h-12 w-full !rounded-[5px] !border !border-[#2563eb] !bg-[#2563eb] !px-2 !py-0 !text-[12px] !font-bold !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0"
          >
            견적 요청하기
          </Button>
          <p role="alert" className="mt-2 min-h-4 text-center text-[10px] text-[#ef4444]">{submitError}</p>
        </footer>
      </form>
    </UserScreenShell>
  )
}
