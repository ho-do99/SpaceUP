import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiClientError } from '@/api/axiosInstance'
import {
  confirmJoinPhoneVerificationCode,
  joinMember,
  sendJoinPhoneVerificationCode,
} from '@/api/signupApi'
import {
  PhoneVerificationPanel,
  RequiredTermsCard,
  SignupAppBar,
  SignupField,
  SignupPage,
  SignupStepper,
  signupInputClass,
  signupPrimaryButtonClass,
} from '@/components/signup/SignupUi'
import type { PhoneVerificationState } from '@/types/signup'
import {
  EMAIL_PATTERN,
  formatPhoneNumber,
  PASSWORD_PATTERN,
} from '@/utils/signup'

const steps = [{ label: '계정' }, { label: '휴대폰' }, { label: '완료' }]
interface AccountState {
  name: string
  email: string
  password: string
  passwordConfirm: string
  serviceAgreed: boolean
  privacyAgreed: boolean
}

const initialAccount: AccountState = {
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  serviceAgreed: false,
  privacyAgreed: false,
}

function getApiMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback
}

export default function LandlordSignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [account, setAccount] = useState<AccountState>(initialAccount)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [verificationState, setVerificationState] = useState<PhoneVerificationState>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (remainingSeconds <= 0 || verificationState === 'verified' || verificationState === 'idle') return
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          setVerificationState('expired')
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [remainingSeconds, verificationState])

  const canContinueAccount =
    account.name.trim().length > 0 &&
    account.name.trim().length <= 20 &&
    EMAIL_PATTERN.test(account.email.trim()) &&
    PASSWORD_PATTERN.test(account.password) &&
    account.password === account.passwordConfirm &&
    account.serviceAgreed &&
    account.privacyAgreed

  const updateAccount = (key: keyof AccountState, value: string | boolean) => {
    setAccount((current) => ({ ...current, [key]: value }))
  }

  const handleBack = () => {
    if (step === 1) {
      navigate('/login')
      return
    }
    if (step === 2) {
      setStep(1)
      setSubmitError('')
    }
  }

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(event.target.value))
    setCode('')
    setVerificationState('idle')
    setRemainingSeconds(0)
    setVerificationError('')
    setSubmitError('')
  }

  const sendCode = async () => {
    if (isSending) return
    setIsSending(true)
    setVerificationError('')
    setSubmitError('')
    try {
      await sendJoinPhoneVerificationCode(phoneNumber)
      setCode('')
      setRemainingSeconds(300)
      setVerificationState('sent')
    } catch (error: unknown) {
      setVerificationError(getApiMessage(error, '인증번호 발송에 실패했습니다.'))
    } finally {
      setIsSending(false)
    }
  }

  const handleCodeChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextCode = event.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(nextCode)
    setVerificationError('')
    setSubmitError('')
    if (nextCode.length !== 6 || verificationState === 'verified' || remainingSeconds <= 0) return

    setVerificationState('verifying')
    try {
      await confirmJoinPhoneVerificationCode(phoneNumber, nextCode)
      setVerificationState('verified')
    } catch (error: unknown) {
      setVerificationState('failed')
      setVerificationError(getApiMessage(error, '인증번호가 일치하지 않습니다.'))
    }
  }

  const handleCompleteSignup = async () => {
    if (verificationState !== 'verified' || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      await joinMember({
        role: 'LANDLORD',
        email: account.email.trim(),
        password: account.password,
        name: account.name.trim(),
        phoneNumber,
      })
      setStep(3)
    } catch (error: unknown) {
      setSubmitError(getApiMessage(error, '회원가입에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 3) {
    return (
      <SignupPage>
        <SignupAppBar title="회원가입 완료" showBack={false} />
        <section className="flex min-h-[796px] flex-col items-center bg-white px-4 pb-[24px] pt-[236px] text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#2563eb] text-[42px] font-normal text-white">✓</div>
          <h2 className="mt-4 text-[24px] font-bold leading-8 text-[#1e293b]">회원가입이 완료되었습니다!</h2>
          <p className="mt-4 text-sm leading-5 text-[#64748b]">
            SpaceUP 임대인 계정이 생성되었습니다.<br />로그인 후 공간 분석을 시작해보세요.
          </p>
          <button type="button" className={`${signupPrimaryButtonClass} mt-auto`} onClick={() => navigate('/login')}>
            로그인하러 가기
          </button>
        </section>
      </SignupPage>
    )
  }

  return (
    <SignupPage>
      <SignupAppBar title={step === 1 ? '회원가입' : '휴대폰 인증'} onBack={handleBack} />
      <section className="flex min-h-[796px] flex-col gap-3 overflow-y-auto bg-white px-4 pb-6 pt-4">
        <p className="text-xs leading-[17px] text-[#64748b]">
          {step === 1 ? 'SpaceUP 임대인 계정을 만들어주세요.' : '본인 확인을 위해 휴대폰 인증을 진행해주세요.'}
        </p>
        <SignupStepper steps={steps} current={step} completed={step > 1 ? [1] : []} />

        {step === 1 ? (
          <>
            <SignupField label="이름">
              <input aria-label="이름" value={account.name} maxLength={20} placeholder="이름을 입력해주세요." className={signupInputClass} onChange={(event) => updateAccount('name', event.target.value)} />
            </SignupField>
            <SignupField label="이메일">
              <input aria-label="이메일" type="email" autoComplete="email" value={account.email} placeholder="contractor@spaceup.co.kr" className={signupInputClass} onChange={(event) => updateAccount('email', event.target.value)} />
            </SignupField>
            <SignupField label="비밀번호">
              <input aria-label="비밀번호" type="password" autoComplete="new-password" value={account.password} placeholder="8자 이상 입력" className={signupInputClass} onChange={(event) => updateAccount('password', event.target.value)} />
            </SignupField>
            <SignupField label="비밀번호 확인">
              <input aria-label="비밀번호 확인" type="password" autoComplete="new-password" value={account.passwordConfirm} placeholder="비밀번호 재입력" className={signupInputClass} onChange={(event) => updateAccount('passwordConfirm', event.target.value)} />
            </SignupField>
            <RequiredTermsCard
              serviceAgreed={account.serviceAgreed}
              privacyAgreed={account.privacyAgreed}
              onServiceChange={(checked) => updateAccount('serviceAgreed', checked)}
              onPrivacyChange={(checked) => updateAccount('privacyAgreed', checked)}
            />
            <button type="button" disabled={!canContinueAccount} className={signupPrimaryButtonClass} onClick={() => setStep(2)}>
              다음: 휴대폰 인증
            </button>
          </>
        ) : (
          <PhoneVerificationPanel
            phoneNumber={phoneNumber}
            code={code}
            remainingSeconds={remainingSeconds}
            state={verificationState}
            isSending={isSending}
            errorMessage={verificationError}
            onPhoneChange={handlePhoneChange}
            onCodeChange={handleCodeChange}
            onSend={sendCode}
            onResend={sendCode}
          >
            {submitError && <p role="alert" className="text-xs leading-[17px] text-[#ef4444]">{submitError}</p>}
            <button type="button" disabled={verificationState !== 'verified' || isSubmitting} className={signupPrimaryButtonClass} onClick={handleCompleteSignup}>
              {isSubmitting ? '가입 중...' : '가입 완료'}
            </button>
          </PhoneVerificationPanel>
        )}
      </section>
    </SignupPage>
  )
}
