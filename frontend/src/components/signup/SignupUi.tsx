import type { ChangeEvent, ReactNode } from 'react'
import type { PhoneVerificationState } from '@/types/signup'
import { formatRemainingTime } from '@/utils/signup'

export interface SignupStep {
  label: string
}

export function SignupAppBar({
  title,
  onBack,
  showBack = true,
}: {
  title: string
  onBack?: () => void
  showBack?: boolean
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2.5 border border-[#e2e8f0] bg-white px-4">
      {showBack && (
        <button
          type="button"
          aria-label="뒤로가기"
          className="flex h-8 w-3 items-center justify-start text-2xl font-bold leading-none text-[#0b2b59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          onClick={onBack}
        >
          ‹
        </button>
      )}
      <h1 className={`${showBack ? '' : 'w-full text-center'} text-[17px] font-bold leading-[25px] text-[#1e293b]`}>
        {title}
      </h1>
    </header>
  )
}

export function SignupPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f8fafc] text-[#1e293b]">
      <div className="mx-auto min-h-dvh w-full max-w-[393px] bg-[#f8fafc]">
        {children}
      </div>
    </main>
  )
}

export function SignupStepper({
  steps,
  current,
  completed = [],
}: {
  steps: SignupStep[]
  current: number
  completed?: number[]
}) {
  return (
    <ol className="flex h-[58px] w-full items-center rounded-[10px] border border-[#e2e8f0] bg-white p-[5px]">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCurrent = stepNumber === current
        const isCompleted = completed.includes(stepNumber)
        return (
          <li key={step.label} className="flex h-full min-w-0 flex-1 items-center justify-center">
            <div
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex h-12 min-w-0 flex-col items-center justify-center gap-px rounded-[7px] font-bold ${
                isCurrent ? 'bg-[#eff6ff] text-[#2563eb]' : 'bg-white text-[#64748b]'
              }`}
            >
              <span className="text-[10px] leading-[15px]">{isCompleted ? '✓' : stepNumber}</span>
              <span className="whitespace-nowrap text-[8px] leading-3">{step.label}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function SignupField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-[5px]">
      <label className="text-[11px] font-bold leading-4 text-[#1e293b]">
        {label}{required ? ' *' : ''}
      </label>
      {children}
    </div>
  )
}

export const signupInputClass =
  'h-11 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs leading-[17px] text-[#1e293b] outline-none placeholder:text-[#64748b] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 disabled:bg-[#f8fafc]'

export const signupTextareaClass =
  'min-h-[86px] w-full resize-none rounded-lg border border-[#e2e8f0] bg-white p-3 text-xs leading-[17px] text-[#1e293b] outline-none placeholder:text-[#64748b] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10'

export const signupPrimaryButtonClass =
  'flex h-12 w-full items-center justify-center rounded-lg border border-[#2563eb] bg-[#2563eb] px-2.5 text-sm font-bold leading-5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:border-[#cbd5e1] disabled:bg-[#cbd5e1]'

export function RequiredTermsCard({
  serviceAgreed,
  privacyAgreed,
  onServiceChange,
  onPrivacyChange,
}: {
  serviceAgreed: boolean
  privacyAgreed: boolean
  onServiceChange: (checked: boolean) => void
  onPrivacyChange: (checked: boolean) => void
}) {
  return (
    <fieldset className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3.5">
      <legend className="sr-only">필수 약관 동의</legend>
      <p className="text-sm font-bold leading-5 text-[#0b2b59]">필수 약관 동의</p>
      <label className="mt-[7px] flex min-h-4 cursor-pointer items-center gap-1.5 text-[11px] leading-4 text-[#64748b]">
        <input
          type="checkbox"
          checked={serviceAgreed}
          className="h-3.5 w-3.5 accent-[#2563eb]"
          onChange={(event) => onServiceChange(event.target.checked)}
        />
        서비스 이용약관
      </label>
      <label className="mt-1 flex min-h-4 cursor-pointer items-center gap-1.5 text-[11px] leading-4 text-[#64748b]">
        <input
          type="checkbox"
          checked={privacyAgreed}
          className="h-3.5 w-3.5 accent-[#2563eb]"
          onChange={(event) => onPrivacyChange(event.target.checked)}
        />
        개인정보 처리방침
      </label>
    </fieldset>
  )
}

function verificationMessage(state: PhoneVerificationState) {
  if (state === 'verified') return { text: '✓ 휴대폰 인증이 완료되었습니다.', color: 'text-[#2563eb]' }
  if (state === 'failed') return { text: '인증번호가 일치하지 않습니다.', color: 'text-[#ef4444]' }
  if (state === 'expired') return { text: '인증번호가 만료되었습니다.', color: 'text-[#ef4444]' }
  return { text: '인증번호를 입력해주세요.', color: 'text-[#64748b]' }
}

export function PhoneVerificationPanel({
  phoneNumber,
  code,
  remainingSeconds,
  state,
  isSending,
  errorMessage,
  onPhoneChange,
  onCodeChange,
  onSend,
  onResend,
  children,
}: {
  phoneNumber: string
  code: string
  remainingSeconds: number
  state: PhoneVerificationState
  isSending: boolean
  errorMessage?: string
  onPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void
  onCodeChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSend: () => void
  onResend: () => void
  children: ReactNode
}) {
  const status = verificationMessage(state)
  const sent = state !== 'idle'

  return (
    <>
      <SignupField label="휴대폰 번호">
        <input
          aria-label="휴대폰 번호"
          inputMode="tel"
          autoComplete="tel"
          value={phoneNumber}
          placeholder="010-1234-5678"
          className={signupInputClass}
          onChange={onPhoneChange}
        />
      </SignupField>
      <button
        type="button"
        className={signupPrimaryButtonClass}
        disabled={isSending || !/^01\d-\d{3,4}-\d{4}$/.test(phoneNumber)}
        onClick={onSend}
      >
        {isSending ? '발송 중...' : '인증번호 받기'}
      </button>
      <SignupField label="인증번호 6자리">
        <input
          aria-label="인증번호 6자리"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          placeholder="123456"
          className={signupInputClass}
          disabled={!sent || state === 'verified'}
          onChange={onCodeChange}
        />
      </SignupField>
      <div className="flex h-11 items-center gap-3 rounded-lg bg-[#eff6ff] px-3 text-xs font-bold leading-[17px] text-[#0b2b59]">
        <span className="text-[#2563eb]">남은 시간 {formatRemainingTime(remainingSeconds)}</span>
        <button type="button" disabled={isSending || !sent} onClick={onResend}>
          인증번호 재전송
        </button>
      </div>
      <div
        className={`flex min-h-[68px] items-center rounded-[10px] bg-[#eaf8f1] px-3 text-xs font-bold leading-[17px] ${status.color}`}
        role={state === 'failed' || state === 'expired' || errorMessage ? 'alert' : 'status'}
      >
        {errorMessage || (state === 'verifying' ? '인증번호를 확인하고 있습니다.' : status.text)}
      </div>
      {children}
    </>
  )
}

