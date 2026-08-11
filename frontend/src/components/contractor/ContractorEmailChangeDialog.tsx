import { useEffect, useRef, useState } from 'react'

interface ContractorEmailChangeDialogProps {
  isOpen: boolean
  currentEmail: string
  onClose: () => void
  onRequestCode: (email: string) => Promise<void>
  onConfirm: (email: string, code: string) => Promise<void>
  onResendCode: () => Promise<void>
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
  onRequestCode,
  onConfirm,
  onResendCode,
}: ContractorEmailChangeDialogProps) {
  const [step, setStep] = useState<EmailChangeStep>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const handleEmailSubmit = async (
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

    setSubmitting(true)
    setErrorMessage('')
    try {
      await onRequestCode(trimmedEmail)
      setEmail(trimmedEmail)
      setStep('verification')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '인증번호 발송에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerificationSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (verificationCode.length !== 6) {
      setErrorMessage('인증번호 숫자 6자리를 입력해 주세요.')
      return
    }

    setErrorMessage('')
    setSubmitting(true)
    try {
      await onConfirm(email, verificationCode)
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '이메일 변경에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
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

  const handleResend = async () => {
    setSubmitting(true)
    setErrorMessage('')
    try {
      await onResendCode()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '인증번호 재전송에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-[#e8edf4]">
      <button
        type="button"
        tabIndex={-1}
        aria-label="이메일 변경 창 닫기"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-change-dialog-title"
        aria-describedby="email-change-dialog-description"
        className="relative z-10 h-dvh w-full max-w-[393px] overflow-y-auto bg-white"
      >
        <div className="flex h-14 items-center border-b border-[#e2e8f0] px-4">
          <button
            type="button"
            aria-label="이메일 변경 창 닫기"
            onClick={onClose}
            className="mr-2 flex h-10 w-3 items-center justify-center text-2xl text-[#0b2b59]"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1">
            <h2
              id="email-change-dialog-title"
              className="text-[17px] font-bold text-[#1e293b]"
            >
              로그인 이메일 변경
            </h2>
          </div>
        </div>

        <p id="email-change-dialog-description" className="px-4 pt-4 text-xs leading-5 text-[#64748b]">새 로그인 이메일을 입력하고 인증해 주세요.</p>

        {step === 'email' ? (
          <form
            className="px-4 pt-3"
            onSubmit={handleEmailSubmit}
            noValidate
          >
            <label
              htmlFor="contractor-new-email"
              className="block text-xs font-bold text-[#334155]"
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
              placeholder="새 이메일을 입력하세요."
              className="mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
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

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="h-12 rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
              >
                인증번호 받기
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                취소
              </button>

            </div>
          </form>
        ) : (
          <form
            className="px-4 pt-3"
            onSubmit={handleVerificationSubmit}
            noValidate
          >
            <label className="block text-xs font-bold text-[#334155]">새 이메일</label>
            <input value={email} readOnly className="mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 text-sm text-[#1e293b]" />

            <label
              htmlFor="contractor-email-verification-code"
              className="mt-3 block text-xs font-bold text-[#334155]"
            >
              인증번호 6자리
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
              placeholder="123456"
              className="mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-center text-lg font-bold tracking-[0.35em] text-[#1e293b] outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#64748b]"><span>남은 시간 03:00</span><button type="button" disabled={submitting} onClick={handleResend} className="font-bold text-[#2563eb]">인증번호 재전송</button></div>

            {errorMessage ? (
              <p
                id="email-verification-error"
                role="alert"
                className="mt-2 text-[11px] font-semibold text-[#dc2626]"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setVerificationCode('')
                  setErrorMessage('')
                }}
                className="h-12 rounded-lg border border-[#2563eb] bg-white text-sm font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
              >
                취소
              </button>

              <button
                type="submit"
                className="h-12 rounded-lg bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
              >
                {submitting ? '변경 중...' : '변경 완료'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
