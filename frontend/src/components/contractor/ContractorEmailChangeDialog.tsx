import { useEffect, useRef, useState } from 'react'

interface ContractorEmailChangeDialogProps {
  isOpen: boolean
  currentEmail: string
  onClose: () => void
  onComplete: (email: string) => void
}

type EmailChangeStep = 'email' | 'verification'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function ContractorEmailChangeDialog({
  isOpen,
  currentEmail,
  onClose,
  onComplete,
}: ContractorEmailChangeDialogProps) {
  const [step, setStep] = useState<EmailChangeStep>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const dialogRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const verificationInputRef = useRef<HTMLInputElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    setStep('email')
    setEmail('')
    setVerificationCode('')
    setErrorMessage('')

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        )

      if (!focusableElements || focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement =
        focusableElements[focusableElements.length - 1]

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    emailInputRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      returnFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (step === 'email') {
      emailInputRef.current?.focus()
      return
    }

    verificationInputRef.current?.focus()
  }, [isOpen, step])

  if (!isOpen) {
    return null
  }

  const handleEmailSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setErrorMessage('새 이메일을 입력해 주세요.')
      return
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMessage('올바른 이메일 형식을 입력해 주세요.')
      return
    }

    if (trimmedEmail === currentEmail) {
      setErrorMessage('현재 이메일과 다른 이메일을 입력해 주세요.')
      return
    }

    setEmail(trimmedEmail)
    setErrorMessage('')
    setStep('verification')
  }

  const handleVerificationSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (verificationCode.length !== 6) {
      setErrorMessage('인증번호 숫자 6자리를 입력해 주세요.')
      return
    }

    setErrorMessage('')
    onComplete(email)
    onClose()
  }

  const handleVerificationCodeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const onlyNumbers = event.target.value
      .replace(/\D/g, '')
      .slice(0, 6)

    setVerificationCode(onlyNumbers)
    setErrorMessage('')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="이메일 변경 창 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[#0f172a]/40"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-change-dialog-title"
        aria-describedby="email-change-dialog-description"
        className="relative z-10 w-full max-w-[353px] rounded-2xl bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.24)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2
              id="email-change-dialog-title"
              className="text-[17px] font-bold text-[#1e293b]"
            >
              {step === 'email'
                ? '로그인 이메일 변경'
                : '이메일 인증'}
            </h2>

            <p
              id="email-change-dialog-description"
              className="mt-1 text-xs leading-5 text-[#64748b]"
            >
              {step === 'email'
                ? '변경할 새 이메일을 입력해 주세요.'
                : '인증번호 숫자 6자리를 입력해 주세요.'}
            </p>
          </div>

          <button
            type="button"
            aria-label="이메일 변경 창 닫기"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {step === 'email' ? (
          <form
            className="mt-5"
            onSubmit={handleEmailSubmit}
            noValidate
          >
            <div className="rounded-xl bg-[#f8fafc] px-3.5 py-3">
              <p className="text-[11px] font-semibold text-[#64748b]">
                현재 이메일
              </p>

              <p className="mt-1 break-all text-[13px] font-bold text-[#1e293b]">
                {currentEmail}
              </p>
            </div>

            <label
              htmlFor="contractor-new-email"
              className="mt-4 block text-xs font-bold text-[#334155]"
            >
              새 이메일
            </label>

            <input
              ref={emailInputRef}
              id="contractor-new-email"
              type="email"
              value={email}
              autoComplete="email"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={
                errorMessage
                  ? 'email-change-error'
                  : undefined
              }
              onChange={(event) => {
                setEmail(event.target.value)
                setErrorMessage('')
              }}
              placeholder="새 이메일을 입력해 주세요"
              className="mt-2 h-12 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
            />

            {errorMessage ? (
              <p
                id="email-change-error"
                role="alert"
                className="mt-2 text-[11px] font-semibold text-[#dc2626]"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-xl border border-[#cbd5e1] bg-white text-sm font-bold text-[#475569] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                취소
              </button>

              <button
                type="submit"
                className="h-12 rounded-xl bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
              >
                인증 진행
              </button>
            </div>
          </form>
        ) : (
          <form
            className="mt-5"
            onSubmit={handleVerificationSubmit}
            noValidate
          >
            <div className="rounded-xl bg-[#eff6ff] px-3.5 py-3">
              <p className="text-[11px] font-semibold text-[#2563eb]">
                변경할 이메일
              </p>

              <p className="mt-1 break-all text-[13px] font-bold text-[#1e293b]">
                {email}
              </p>
            </div>

            <label
              htmlFor="contractor-email-verification-code"
              className="mt-4 block text-xs font-bold text-[#334155]"
            >
              인증번호
            </label>

            <input
              ref={verificationInputRef}
              id="contractor-email-verification-code"
              type="text"
              inputMode="numeric"
              value={verificationCode}
              maxLength={6}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={
                errorMessage
                  ? 'email-verification-error'
                  : undefined
              }
              onChange={handleVerificationCodeChange}
              placeholder="숫자 6자리"
              className="mt-2 h-12 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-center text-lg font-bold tracking-[0.35em] text-[#1e293b] outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
            />

            {errorMessage ? (
              <p
                id="email-verification-error"
                role="alert"
                className="mt-2 text-[11px] font-semibold text-[#dc2626]"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setVerificationCode('')
                  setErrorMessage('')
                }}
                className="h-12 rounded-xl border border-[#cbd5e1] bg-white text-sm font-bold text-[#475569] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                다시 입력
              </button>

              <button
                type="submit"
                className="h-12 rounded-xl bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
              >
                변경 완료
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}