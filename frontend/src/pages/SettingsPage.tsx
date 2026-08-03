import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import chevronIcon from '@/assets/user/icons/management/chevron.svg'
import emailIcon from '@/assets/user/icons/management/email.svg'
import logoutIcon from '@/assets/user/icons/management/logout.svg'
import passwordIcon from '@/assets/user/icons/management/password.svg'
import phoneIcon from '@/assets/user/icons/management/phone.svg'
import securityIcon from '@/assets/user/icons/management/security.svg'
import withdrawalIcon from '@/assets/user/icons/management/withdrawal.svg'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { userProfile } from '@/mocks/userProfile'

interface SettingsState {
  loginSecurity: boolean
}

interface SettingsIconProps {
  src: string
  danger?: boolean
}

function SettingsIcon({ src, danger = false }: SettingsIconProps) {
  return (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${danger ? 'bg-[#fef2f2]' : 'bg-[#eff6ff]'}`}>
      <img src={src} alt="" className="size-[18px]" />
    </span>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<SettingsState>({ loginSecurity: true })

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="계정 설정" onBack={() => navigate('/mypage')} />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-9">
        <h1 className="text-[22px] font-bold leading-9 text-[#1e293b]">계정 설정</h1>
        <p className="text-[12px] leading-5 text-[#64748b]">로그인 정보와 계정 보안을 관리하세요.</p>

        <section className="mt-6" aria-labelledby="login-info-heading">
          <h2 id="login-info-heading" className="text-[15px] font-bold leading-6 text-[#1e293b]">로그인 정보</h2>
          <div className="mt-[5px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            <div className="flex h-16 items-center gap-3 px-4">
              <SettingsIcon src={emailIcon} />
              <span className="min-w-0 flex-1 text-[14px] font-bold text-[#1e293b]">로그인 이메일</span>
              <span className="shrink-0 text-[11px] text-[#64748b]">{userProfile.email}</span>
            </div>
            <div className="ml-16 border-t border-[#e2e8f0]" />
            <div className="flex h-16 items-center gap-3 px-4">
              <SettingsIcon src={phoneIcon} />
              <span className="min-w-0 flex-1 text-[14px] font-bold text-[#1e293b]">휴대폰 번호</span>
              <span className="shrink-0 text-[11px] text-[#64748b]">{userProfile.phone}</span>
            </div>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="security-settings-heading">
          <h2 id="security-settings-heading" className="text-[15px] font-bold leading-6 text-[#1e293b]">보안 설정</h2>
          <div className="mt-[5px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            <button type="button" disabled aria-disabled="true" className="flex h-16 w-full cursor-default items-center gap-3 px-4 text-left disabled:opacity-100">
              <SettingsIcon src={passwordIcon} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-[23px] text-[#1e293b]">비밀번호 변경</span>
                <span className="block text-[11px] leading-[18px] text-[#64748b]">안전한 비밀번호로 변경합니다.</span>
              </span>
              <img src={chevronIcon} alt="" className="size-[18px] shrink-0" />
            </button>
            <div className="ml-16 border-t border-[#e2e8f0]" />
            <div className="flex h-16 items-center gap-3 px-4">
              <SettingsIcon src={securityIcon} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-[23px] text-[#1e293b]">로그인 보안</span>
                <span className="block text-[11px] leading-[18px] text-[#64748b]">새 기기 로그인 시 추가로 확인합니다.</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.loginSecurity}
                aria-label="로그인 보안"
                onClick={() => setSettings((current) => ({ ...current, loginSecurity: !current.loginSecurity }))}
                className={`relative h-6 w-11 shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${settings.loginSecurity ? 'bg-[#2563eb]' : 'bg-[#cbd5e1]'}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] motion-reduce:transition-none ${settings.loginSecurity ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="account-management-heading">
          <h2 id="account-management-heading" className="text-[15px] font-bold leading-6 text-[#1e293b]">계정 관리</h2>
          <div className="mt-[5px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            <button type="button" disabled aria-disabled="true" className="flex h-16 w-full cursor-default items-center gap-3 px-4 text-left disabled:opacity-100">
              <SettingsIcon src={logoutIcon} />
              <span className="min-w-0 flex-1 text-[14px] font-bold text-[#1e293b]">로그아웃</span>
              <img src={chevronIcon} alt="" className="size-[18px] shrink-0" />
            </button>
            <div className="ml-16 border-t border-[#e2e8f0]" />
            <button type="button" disabled aria-disabled="true" className="flex h-16 w-full cursor-default items-center gap-3 px-4 text-left disabled:opacity-100">
              <SettingsIcon src={withdrawalIcon} danger />
              <span className="min-w-0 flex-1 text-[14px] font-bold text-[#ef4444]">회원탈퇴</span>
              <img src={chevronIcon} alt="" className="size-[18px] shrink-0" />
            </button>
          </div>
        </section>
      </main>
    </UserScreenShell>
  )
}
