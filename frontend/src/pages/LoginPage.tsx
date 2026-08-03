import { useState, type ChangeEvent, type FormEvent } from 'react'
import Button from '@/components/Button'
import type { MemberRole } from '@/types/member'

type LoginRole = Extract<MemberRole, 'MEMBER' | 'CONTRACTOR'>

interface LoginFormErrors {
  email?: string
  password?: string
}

const loginRoleOptions: Array<{ label: string; value: LoginRole }> = [
  { label: '사용자', value: 'MEMBER' },
  { label: '시공사', value: 'CONTRACTOR' },
]

export default function LoginPage() {
  const [loginRole, setLoginRole] = useState<LoginRole>('MEMBER')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginFormErrors>({})

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
    if (errors.email) {
      setErrors((currentErrors) => ({ ...currentErrors, email: undefined }))
    }
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
    if (errors.password) {
      setErrors((currentErrors) => ({ ...currentErrors, password: undefined }))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const nextErrors: LoginFormErrors = {}

    if (!trimmedEmail) {
      nextErrors.email = '이메일을 입력해주세요.'
    }

    if (!password) {
      nextErrors.password = '비밀번호를 입력해주세요.'
    }

    setEmail(trimmedEmail)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    // 로그인 API와 성공 후 이동은 백엔드 인증 명세 확정 후 연결합니다.
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-white text-[#0f172a]">
      <div className="mx-auto flex min-h-[852px] w-full max-w-[393px] flex-col px-5">
        <header className="pt-[112px] text-center">
          <h1 className="h-[42px] text-[32px] font-bold leading-[42px] tracking-[-0.32px] text-[#2563eb]">
            SpaceUP
          </h1>
          <p className="mt-[10px] flex h-10 items-center justify-center text-[15px] leading-[22px] tracking-[-0.15px] text-[#64748b]">
            내 공간의 가치를 높이는 리모델링을 시작하세요
          </p>
        </header>

        <section className="mt-[26px]" aria-labelledby="login-title">
          <h2
            id="login-title"
            className="h-8 text-[24px] font-bold leading-8 tracking-[-0.24px] text-[#0f172a]"
          >
            로그인
          </h2>
          <p className="mt-2 h-[22px] text-[14px] leading-[22px] tracking-[-0.14px] text-[#64748b]">
            사용자 계정으로 로그인해주세요.
          </p>

          <form className="mt-[18px]" noValidate onSubmit={handleSubmit}>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="h-[22px] text-[14px] font-medium leading-[22px] text-[#475569]">
                로그인 유형
              </legend>
              <div
                className="mt-[6px] flex h-12 w-full rounded-[12px] bg-[#f1f5f9] p-[3px]"
              >
                {loginRoleOptions.map((option) => {
                  const isSelected = loginRole === option.value

                  return (
                    <label key={option.value} className="relative flex h-10 flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="login-role"
                        value={option.value}
                        checked={isSelected}
                        className="peer sr-only"
                        onChange={() => setLoginRole(option.value)}
                      />
                      <span
                        className={`flex h-full w-full items-center justify-center rounded-[9px] text-[14px] transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-[#2563eb] ${
                          isSelected
                            ? 'bg-white font-semibold text-[#2563eb]'
                            : 'bg-transparent font-medium text-[#64748b]'
                        }`}
                      >
                        {option.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="relative mt-5">
              <label
                className="block h-[22px] text-[14px] font-medium leading-[22px] tracking-[-0.14px] text-[#475569]"
                htmlFor="login-email"
              >
                이메일
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                placeholder="example@email.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                className="mt-[6px] h-[52px] w-full rounded-[12px] border border-[#cbd5e1] bg-[#f8fafc] px-4 text-[15px] leading-[22px] tracking-[-0.15px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
                onChange={handleEmailChange}
              />
              {errors.email && (
                <p
                  id="login-email-error"
                  className="absolute left-0 top-[82px] text-[12px] leading-4 text-red-600"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div className="relative mt-5">
              <label
                className="block h-[22px] text-[14px] font-medium leading-[22px] tracking-[-0.14px] text-[#475569]"
                htmlFor="login-password"
              >
                비밀번호
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                className="mt-[6px] h-[52px] w-full rounded-[12px] border border-[#cbd5e1] bg-[#f8fafc] px-4 text-[15px] leading-[22px] tracking-[-0.15px] text-[#0f172a] outline-none placeholder:text-[#0f172a] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
                onChange={handlePasswordChange}
              />
              {errors.password && (
                <p
                  id="login-password-error"
                  className="absolute left-0 top-[82px] text-[12px] leading-4 text-red-600"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="mt-[23px] h-[52px] w-full !rounded-[12px] !bg-[#2563eb] !px-4 !py-0 !text-[16px] !font-semibold !leading-[22px] !shadow-none hover:!translate-y-0 hover:!bg-[#2563eb] hover:!shadow-none active:!translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              로그인
            </Button>
          </form>

          <p className="mt-8 flex h-5 items-center justify-center gap-2 text-[14px] leading-5 text-[#64748b]">
            <span>아직 계정이 없으신가요?</span>
            <button
              type="button"
              disabled
              className="font-semibold text-[#2563eb] disabled:cursor-default disabled:opacity-100"
            >
              회원가입
            </button>
          </p>
        </section>

        <p className="mt-auto pb-[22px] text-center text-[13px] font-semibold leading-5 tracking-[-0.13px] text-[#475569]">
          관리자 로그인
        </p>
      </div>
    </main>
  )
}
