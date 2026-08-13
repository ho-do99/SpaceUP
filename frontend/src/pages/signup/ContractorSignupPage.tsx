import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiClientError } from '@/api/axiosInstance'
import { updateMyContractorProfile } from '@/api/contractorApi'
import {
  confirmJoinPhoneVerificationCode,
  joinMember,
  sendJoinPhoneVerificationCode,
  uploadBusinessRegistrationCertificate,
  verifyBusinessRegistration,
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
  signupTextareaClass,
} from '@/components/signup/SignupUi'
import type {
  ContractorBusinessSignupInput,
  ContractorCompanySignupInput,
  PhoneVerificationState,
} from '@/types/signup'
import {
  buildContractorProfileSignupPayload,
  EMAIL_PATTERN,
  formatPhoneNumber,
  parseConstructionExperienceMonths,
  PASSWORD_PATTERN,
  validateBusinessRegistrationFile,
} from '@/utils/signup'
import { saveAuthSession } from '@/utils/authSession'
import { openDaumPostcode } from '@/utils/daumPostcode'

const steps = [
  { label: '계정' },
  { label: '휴대폰' },
  { label: '업체/시공' },
  { label: '사업자' },
  { label: '완료' },
]
const regionOptions = ['광주 전체', '동구', '서구', '남구', '북구', '광산구', '전남']
const specialtyOptions = ['벽지', '바닥재', '조명', '주방 상부장']
interface AccountState {
  name: string
  phoneNumber: string
  email: string
  password: string
  passwordConfirm: string
  serviceAgreed: boolean
  privacyAgreed: boolean
}

const initialAccount: AccountState = {
  name: '',
  phoneNumber: '',
  email: '',
  password: '',
  passwordConfirm: '',
  serviceAgreed: false,
  privacyAgreed: false,
}
const initialCompany: ContractorCompanySignupInput = {
  companyName: '', representativeName: '', companyAddress: '', regions: [], specialties: [], constructionExperienceMonths: '', introduction: '',
}
const initialBusiness: ContractorBusinessSignupInput = {
  businessRegistrationNumber: '', businessName: '', representativeName: '', businessAddress: '', registrationDocument: null, submissionAgreed: false,
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback
}

function ToggleChip({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`h-9 rounded-full border px-5 text-xs font-bold ${selected ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]' : 'border-[#e2e8f0] bg-white text-[#1e293b]'}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default function ContractorSignupPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [account, setAccount] = useState(initialAccount)
  const [company, setCompany] = useState(initialCompany)
  const [business, setBusiness] = useState(initialBusiness)
  const [code, setCode] = useState('')
  const [verificationState, setVerificationState] = useState<PhoneVerificationState>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isVerifyingBusiness, setIsVerifyingBusiness] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearchingCompanyAddress, setIsSearchingCompanyAddress] = useState(false)
  const [isSearchingBusinessAddress, setIsSearchingBusinessAddress] = useState(false)
  const [verifiedBusinessNumber, setVerifiedBusinessNumber] = useState('')
  const [uploadedCertificateUrl, setUploadedCertificateUrl] = useState('')
  const [pageError, setPageError] = useState('')
  const [fileError, setFileError] = useState('')

  useEffect(() => {
    if (remainingSeconds <= 0 || verificationState === 'idle' || verificationState === 'verified') return
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
    account.name.trim().length > 0 && account.name.trim().length <= 20 &&
    /^01\d-\d{3,4}-\d{4}$/.test(account.phoneNumber) &&
    EMAIL_PATTERN.test(account.email.trim()) && PASSWORD_PATTERN.test(account.password) &&
    account.password === account.passwordConfirm && account.serviceAgreed && account.privacyAgreed
  const canContinueCompany = Boolean(
    company.companyName.trim() && company.representativeName.trim() && company.companyAddress.trim() &&
    company.regions.length && company.specialties.length && parseConstructionExperienceMonths(company.constructionExperienceMonths) !== null,
  )
  const canSubmitBusiness = Boolean(
    business.businessRegistrationNumber.trim() && business.businessName.trim() &&
    business.representativeName.trim() && business.businessAddress.trim() &&
    business.registrationDocument && business.submissionAgreed &&
    verifiedBusinessNumber === business.businessRegistrationNumber.trim(),
  )

  const updateAccount = (key: keyof AccountState, value: string | boolean) => setAccount((current) => ({ ...current, [key]: value }))
  const updateCompany = (key: keyof ContractorCompanySignupInput, value: string | string[]) => setCompany((current) => ({ ...current, [key]: value }))
  const updateBusiness = <K extends keyof ContractorBusinessSignupInput>(key: K, value: ContractorBusinessSignupInput[K]) => setBusiness((current) => ({ ...current, [key]: value }))
  const toggleValue = (values: string[], value: string) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

  const handleBack = () => {
    setPageError('')
    if (step === 1) navigate('/login')
    else if (step < 5) setStep((step - 1) as 1 | 2 | 3)
  }

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateAccount('phoneNumber', formatPhoneNumber(event.target.value))
    setCode('')
    setVerificationState('idle')
    setRemainingSeconds(0)
    setPageError('')
  }

  const sendCode = async () => {
    if (isSending) return
    setIsSending(true)
    setPageError('')
    try {
      await sendJoinPhoneVerificationCode(account.phoneNumber)
      setCode('')
      setRemainingSeconds(300)
      setVerificationState('sent')
    } catch (error: unknown) {
      setPageError(errorMessage(error, '인증번호 발송에 실패했습니다.'))
    } finally {
      setIsSending(false)
    }
  }

  const handleCodeChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextCode = event.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(nextCode)
    setPageError('')
    if (nextCode.length !== 6 || verificationState === 'verified' || remainingSeconds <= 0) return
    setVerificationState('verifying')
    try {
      await confirmJoinPhoneVerificationCode(account.phoneNumber, nextCode)
      setVerificationState('verified')
    } catch (error: unknown) {
      setVerificationState('failed')
      setPageError(errorMessage(error, '인증번호가 일치하지 않습니다.'))
    }
  }

  const completeContractorAccount = async () => {
    if (verificationState !== 'verified' || isJoining) return
    if (hasJoined) {
      setStep(3)
      return
    }
    setIsJoining(true)
    setPageError('')
    try {
      const authSession = await joinMember({
        role: 'CONTRACTOR',
        email: account.email.trim(),
        password: account.password,
        name: account.name.trim(),
        phoneNumber: account.phoneNumber,
      })
      saveAuthSession(authSession)
      setHasJoined(true)
      setStep(3)
    } catch (error: unknown) {
      setPageError(errorMessage(error, '회원가입에 실패했습니다.'))
    } finally {
      setIsJoining(false)
    }
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const validationError = validateBusinessRegistrationFile(file)
    setFileError(validationError ?? '')
    if (!validationError) {
      updateBusiness('registrationDocument', file)
      setUploadedCertificateUrl('')
    }
    event.target.value = ''
  }

  const handleBusinessNumberChange = (value: string) => {
    updateBusiness('businessRegistrationNumber', value)
    setVerifiedBusinessNumber('')
    setPageError('')
  }

  const verifyBusinessNumber = async () => {
    const number = business.businessRegistrationNumber.trim()
    if (!number || isVerifyingBusiness) return
    setIsVerifyingBusiness(true)
    setPageError('')
    try {
      const result = await verifyBusinessRegistration(number)
      if (!result.valid) {
        setVerifiedBusinessNumber('')
        setPageError(result.message || '사업자등록번호를 다시 확인해 주세요.')
        return
      }
      setVerifiedBusinessNumber(number)
    } catch (error: unknown) {
      setVerifiedBusinessNumber('')
      setPageError(errorMessage(error, '사업자등록번호 확인에 실패했습니다.'))
    } finally {
      setIsVerifyingBusiness(false)
    }
  }

  const searchCompanyAddress = async () => {
    if (isSearchingCompanyAddress) return
    setIsSearchingCompanyAddress(true)
    setPageError('')
    try {
      const address = await openDaumPostcode()
      if (address) updateCompany('companyAddress', address)
    } catch {
      setPageError('주소 검색을 불러오지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSearchingCompanyAddress(false)
    }
  }

  const searchBusinessAddress = async () => {
    if (isSearchingBusinessAddress) return
    setIsSearchingBusinessAddress(true)
    setPageError('')
    try {
      const address = await openDaumPostcode()
      if (address) updateBusiness('businessAddress', address)
    } catch {
      setPageError('주소 검색을 불러오지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSearchingBusinessAddress(false)
    }
  }

  const completeSignup = async () => {
    if (!canSubmitBusiness || isSubmitting || !business.registrationDocument) return
    setIsSubmitting(true)
    setPageError('')
    try {
      const certificateUrl = uploadedCertificateUrl ||
        await uploadBusinessRegistrationCertificate(business.registrationDocument)
      setUploadedCertificateUrl(certificateUrl)
      await updateMyContractorProfile(
        buildContractorProfileSignupPayload(company, business, certificateUrl),
      )
      setStep(5)
    } catch (error: unknown) {
      setPageError(errorMessage(error, '회원가입 완료 처리에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = step === 1 ? '회원가입' : step === 2 ? '휴대폰 인증' : step === 3 ? '업체·시공 정보' : step === 4 ? '사업자 정보' : '회원가입 완료'
  const description = step === 1 ? '서비스에 사용할 담당자 계정을 만드세요.' : step === 2 ? '본인 명의의 휴대폰 번호를 인증해 주세요.' : step === 3 ? '업체와 시공 정보를 입력해 주세요.' : step === 4 ? '사업자 정보를 확인하고 사업자등록증을 등록해 주세요.' : 'SpaceUP 시공사 가입이 완료되었습니다.'

  return (
    <SignupPage>
      <SignupAppBar title={title} onBack={handleBack} />
      <section className={`flex min-h-[796px] flex-col gap-3 overflow-y-auto bg-white px-4 pt-4 ${step >= 3 ? 'pb-[78px]' : 'pb-6'}`}>
        <p className="text-xs leading-[17px] text-[#64748b]">{description}</p>
        <SignupStepper steps={steps} current={step} completed={Array.from({ length: step - 1 }, (_, index) => index + 1)} />

        {step === 1 && (
          <>
            <SignupField label="담당자명"><input aria-label="담당자명" value={account.name} maxLength={20} placeholder="김현수" className={signupInputClass} onChange={(event) => updateAccount('name', event.target.value)} /></SignupField>
            <SignupField label="휴대폰 번호"><input aria-label="휴대폰 번호" inputMode="tel" value={account.phoneNumber} placeholder="010-1234-5678" className={signupInputClass} onChange={handlePhoneChange} /></SignupField>
            <SignupField label="이메일"><input aria-label="이메일" type="email" value={account.email} placeholder="contractor@spaceup.co.kr" className={signupInputClass} onChange={(event) => updateAccount('email', event.target.value)} /></SignupField>
            <SignupField label="비밀번호"><input aria-label="비밀번호" type="password" autoComplete="new-password" value={account.password} placeholder="8자 이상 입력" className={signupInputClass} onChange={(event) => updateAccount('password', event.target.value)} /></SignupField>
            <SignupField label="비밀번호 확인"><input aria-label="비밀번호 확인" type="password" autoComplete="new-password" value={account.passwordConfirm} placeholder="비밀번호 재입력" className={signupInputClass} onChange={(event) => updateAccount('passwordConfirm', event.target.value)} /></SignupField>
            <RequiredTermsCard serviceAgreed={account.serviceAgreed} privacyAgreed={account.privacyAgreed} onServiceChange={(checked) => updateAccount('serviceAgreed', checked)} onPrivacyChange={(checked) => updateAccount('privacyAgreed', checked)} />
            <button type="button" disabled={!canContinueAccount} className={signupPrimaryButtonClass} onClick={() => setStep(2)}>다음: 휴대폰 인증</button>
          </>
        )}

        {step === 2 && (
          <PhoneVerificationPanel
            phoneNumber={account.phoneNumber} code={code} remainingSeconds={remainingSeconds} state={verificationState}
            isSending={isSending} errorMessage={pageError} onPhoneChange={handlePhoneChange} onCodeChange={handleCodeChange} onSend={sendCode} onResend={sendCode}
          >
            <button type="button" disabled={verificationState !== 'verified' || isJoining} className={signupPrimaryButtonClass} onClick={completeContractorAccount}>{isJoining ? '가입 중...' : '다음 단계'}</button>
          </PhoneVerificationPanel>
        )}

        {step === 3 && (
          <>
            <SignupField label="업체명" required><input aria-label="업체명" value={company.companyName} placeholder="업체명을 입력해 주세요." className={signupInputClass} onChange={(event) => updateCompany('companyName', event.target.value)} /></SignupField>
            <SignupField label="대표자명" required><input aria-label="대표자명" value={company.representativeName} placeholder="대표자명을 입력해 주세요." className={signupInputClass} onChange={(event) => updateCompany('representativeName', event.target.value)} /></SignupField>
            <SignupField label="업체 주소" required>
              <div className="flex gap-2"><input aria-label="업체 주소" value={company.companyAddress} placeholder="업체 주소를 검색해 주세요." className={signupInputClass} onChange={(event) => updateCompany('companyAddress', event.target.value)} /><button type="button" disabled={isSearchingCompanyAddress} className="h-11 w-[108px] shrink-0 rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb] disabled:opacity-50" onClick={searchCompanyAddress}>주소 검색</button></div>
            </SignupField>
            <fieldset><legend className="mb-2 text-[11px] font-bold leading-4">시공 가능 지역 *</legend><div className="flex flex-wrap gap-2">{regionOptions.map((region) => <ToggleChip key={region} label={region} selected={company.regions.includes(region)} onClick={() => updateCompany('regions', toggleValue(company.regions, region))} />)}</div></fieldset>
            <fieldset><legend className="mb-2 text-[11px] font-bold leading-4">전문 시공 분야 *</legend><div className="flex flex-wrap gap-2">{specialtyOptions.map((specialty) => <ToggleChip key={specialty} label={specialty} selected={company.specialties.includes(specialty)} onClick={() => updateCompany('specialties', toggleValue(company.specialties, specialty))} />)}</div></fieldset>
            <SignupField label="시공 경력" required><input aria-label="시공 경력" inputMode="numeric" value={company.constructionExperienceMonths} placeholder="개월 수를 입력해 주세요." className={signupInputClass} onChange={(event) => updateCompany('constructionExperienceMonths', event.target.value)} /></SignupField>
            <SignupField label="업체 소개 (선택)"><textarea aria-label="업체 소개 (선택)" value={company.introduction} maxLength={300} placeholder="업체의 주요 시공 경험과 강점을 입력해 주세요." className={signupTextareaClass} onChange={(event) => updateCompany('introduction', event.target.value)} /><span className="self-end text-[10px] text-[#64748b]">{company.introduction.length} / 300</span></SignupField>
            {pageError && <p role="alert" className="text-xs font-bold text-[#ef4444]">! {pageError}</p>}
            <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[393px] border border-[#e2e8f0] bg-white p-4"><button type="button" disabled={!canContinueCompany} className={signupPrimaryButtonClass} onClick={() => { setPageError(''); setStep(4) }}>다음 단계</button></div>
          </>
        )}

        {step === 4 && (
          <>
            <SignupField label="사업자등록번호" required><div className="flex gap-2"><input aria-label="사업자등록번호" value={business.businessRegistrationNumber} placeholder="000-00-00000" className={signupInputClass} onChange={(event) => handleBusinessNumberChange(event.target.value)} /><button type="button" disabled={!business.businessRegistrationNumber.trim() || isVerifyingBusiness} className="h-11 w-[108px] shrink-0 rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb] disabled:opacity-50" onClick={verifyBusinessNumber}>{isVerifyingBusiness ? '확인 중...' : '사업자 확인'}</button></div>{verifiedBusinessNumber === business.businessRegistrationNumber.trim() && <p role="status" className="mt-1 text-xs font-bold text-[#16a36f]">✓ 사업자 정보가 확인되었습니다.</p>}</SignupField>
            <SignupField label="상호명" required><input aria-label="상호명" value={business.businessName} placeholder="사업자등록증의 상호명을 입력해 주세요." className={signupInputClass} onChange={(event) => updateBusiness('businessName', event.target.value)} /></SignupField>
            <SignupField label="대표자명" required><input aria-label="사업자 대표자명" value={business.representativeName} placeholder="사업자등록증의 대표자명을 입력해 주세요." className={signupInputClass} onChange={(event) => updateBusiness('representativeName', event.target.value)} /></SignupField>
            <SignupField label="사업장 주소" required><div className="flex gap-2"><input aria-label="사업장 주소" value={business.businessAddress} placeholder="사업장 주소를 검색해 주세요." className={signupInputClass} onChange={(event) => updateBusiness('businessAddress', event.target.value)} /><button type="button" disabled={isSearchingBusinessAddress} className="h-11 w-[108px] shrink-0 rounded-lg border border-[#2563eb] bg-white text-xs font-bold text-[#2563eb] disabled:opacity-50" onClick={searchBusinessAddress}>주소 검색</button></div></SignupField>
            <SignupField label="사업자등록증" required>
              <div className="flex min-h-[146px] flex-col items-center justify-center rounded-lg border border-[#2563eb] bg-[#eff6ff] p-3 text-center"><span aria-hidden="true" className="text-3xl text-[#2563eb]">⇧</span><p className="mt-2 text-xs font-bold">{business.registrationDocument?.name || '사업자등록증을 첨부해 주세요.'}</p><p className="mt-1 text-[10px] text-[#64748b]">JPG, PNG, PDF / 최대 10MB</p><input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="sr-only" onChange={handleFile} /><button type="button" className="mt-3 h-9 min-w-[122px] rounded-lg border border-[#2563eb] bg-white px-4 text-xs font-bold text-[#2563eb]" onClick={() => fileInputRef.current?.click()}>파일 선택</button></div>
              {fileError && <p role="alert" className="text-xs text-[#ef4444]">{fileError}</p>}
            </SignupField>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#e2e8f0] bg-white p-3 text-[11px] leading-4 text-[#475569]"><input type="checkbox" checked={business.submissionAgreed} className="mt-0.5 h-4 w-4 accent-[#2563eb]" onChange={(event) => updateBusiness('submissionAgreed', event.target.checked)} /><span>입력한 업체 정보와 사업자 정보가 일치하며,<br />해당 정보를 제출하는 것에 동의합니다.</span></label>
            {pageError && <p role="alert" className="text-xs font-bold text-[#ef4444]">! {pageError}</p>}
            <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[393px] border border-[#e2e8f0] bg-white p-4"><button type="button" disabled={!canSubmitBusiness || isSubmitting} className={signupPrimaryButtonClass} onClick={completeSignup}>{isSubmitting ? '처리 중...' : '회원가입 완료'}</button></div>
          </>
        )}
        {step === 5 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#eff6ff] text-3xl font-bold text-[#2563eb]">✓</div>
            <h2 className="mt-5 text-xl font-bold text-[#1e293b]">회원가입이 완료되었습니다.</h2>
            <p className="mt-3 text-xs leading-5 text-[#64748b]">이제 SpaceUP 시공사 서비스를 이용할 수 있습니다.</p>
            <button type="button" className={`${signupPrimaryButtonClass} mt-8 w-full`} onClick={() => navigate('/contractor', { replace: true })}>시작하기</button>
          </div>
        )}
      </section>
    </SignupPage>
  )
}
