import { useCallback, useEffect, useRef, useState } from 'react'
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
import UserAccountConfirmDialog, { type UserAccountAction } from '@/components/user/UserAccountConfirmDialog'
import { MemberPasswordChangeDialog, MemberPhoneChangeDialog } from '@/components/member/MemberAccountChangeDialogs'
import { userProfile } from '@/mocks/userProfile'
import { deleteMember, getMember, updateMyPassword, updateMyPhoneNumber } from '@/api/memberApi'
import { clearAuthSession, getMemberId } from '@/utils/authSession'
import { clearRequestFlow } from '@/utils/requestFlow'

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
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phone)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountAction, setAccountAction] = useState<UserAccountAction | null>(null)
  const [accountActionError, setAccountActionError] = useState('')
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false)
  const accountActionInFlightRef = useRef(false)

  useEffect(() => {
    const memberId = getMemberId()
    if (!memberId) return
    getMember(memberId)
      .then((member) => setPhoneNumber(member.phoneNumber))
      .catch((error) => setAccountError(error instanceof Error ? error.message : '회원 정보를 불러오지 못했습니다.'))
  }, [])

  const handlePhoneChange = async (nextPhoneNumber: string) => {
    const memberId = getMemberId()
    if (!memberId) throw new Error('회원 정보를 확인할 수 없습니다.')
    await updateMyPhoneNumber(nextPhoneNumber)
    const member = await getMember(memberId)
    setPhoneNumber(member.phoneNumber)
    setSuccessMessage('휴대폰 번호가 변경되었습니다.')
  }

  const handlePasswordChange = async (input: { currentPassword: string; newPassword: string }) => {
    await updateMyPassword(input)
    setSuccessMessage('비밀번호가 변경되었습니다.')
  }

  const openAccountDialog = (action: UserAccountAction) => {
    setAccountActionError('')
    setAccountAction(action)
  }

  const closeAccountDialog = useCallback(() => {
    if (accountActionInFlightRef.current) return
    setAccountActionError('')
    setAccountAction(null)
  }, [])

  const clearUserSession = () => {
    clearAuthSession()
    clearRequestFlow()
  }

  const handleLogout = () => {
    if (accountActionInFlightRef.current) return
    accountActionInFlightRef.current = true
    setIsAccountSubmitting(true)
    clearUserSession()
    navigate('/login', { replace: true })
  }

  const handleWithdrawal = async () => {
    if (accountActionInFlightRef.current) return

    const memberId = getMemberId()
    if (!memberId) {
      setAccountActionError('회원 정보를 확인할 수 없습니다. 다시 로그인한 후 시도해 주세요.')
      return
    }

    accountActionInFlightRef.current = true
    setIsAccountSubmitting(true)
    setAccountActionError('')

    try {
      await deleteMember(memberId)
      clearUserSession()
      accountActionInFlightRef.current = false
      setIsAccountSubmitting(false)
      navigate('/login', { replace: true })
    } catch (error) {
      accountActionInFlightRef.current = false
      setIsAccountSubmitting(false)
      setAccountActionError(
        error instanceof Error
          ? error.message
          : '회원탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  const handleAccountConfirm = () => {
    if (accountAction === 'logout') {
      handleLogout()
      return
    }

    if (accountAction === 'withdrawal') void handleWithdrawal()
  }

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
              <span className="shrink-0 text-[11px] text-[#64748b]">{phoneNumber}</span>
              <button type="button" onClick={() => { setSuccessMessage(''); setPhoneDialogOpen(true) }} className="shrink-0 rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-[11px] font-bold text-[#2563eb]">변경</button>
            </div>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="security-settings-heading">
          <h2 id="security-settings-heading" className="text-[15px] font-bold leading-6 text-[#1e293b]">보안 설정</h2>
          <div className="mt-[5px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            <button type="button" onClick={() => { setSuccessMessage(''); setPasswordDialogOpen(true) }} className="flex h-16 w-full items-center gap-3 px-4 text-left">
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
            <button type="button" onClick={() => openAccountDialog('logout')} className="flex h-16 w-full items-center gap-3 px-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563eb]">
              <SettingsIcon src={logoutIcon} />
              <span className="min-w-0 flex-1 text-[14px] font-bold text-[#1e293b]">로그아웃</span>
              <img src={chevronIcon} alt="" className="size-[18px] shrink-0" />
            </button>
            <div className="ml-16 border-t border-[#e2e8f0]" />
            <button type="button" onClick={() => openAccountDialog('withdrawal')} className="flex h-16 w-full items-center gap-3 px-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ef4444]">
              <SettingsIcon src={withdrawalIcon} danger />
              <span className="min-w-0 flex-1 text-[14px] font-bold text-[#ef4444]">회원탈퇴</span>
              <img src={chevronIcon} alt="" className="size-[18px] shrink-0" />
            </button>
          </div>
        </section>
        {accountError ? <p role="alert" className="mt-3 text-[11px] font-semibold text-[#dc2626]">{accountError}</p> : null}
      </main>

      {successMessage ? (
        <div role="status" aria-live="polite" className="absolute bottom-5 left-4 right-4 z-40 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#1e293b] px-4 py-3 shadow-lg">
          <p className="text-xs font-semibold text-white">{successMessage}</p>
          <button type="button" aria-label="계정 변경 완료 안내 닫기" onClick={() => setSuccessMessage('')} className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-white">닫기</button>
        </div>
      ) : null}

      <MemberPhoneChangeDialog open={phoneDialogOpen} onClose={() => setPhoneDialogOpen(false)} onSubmit={handlePhoneChange} />
      <MemberPasswordChangeDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} onSubmit={handlePasswordChange} />
      <UserAccountConfirmDialog
        action={accountAction}
        errorMessage={accountActionError}
        isSubmitting={isAccountSubmitting}
        onCancel={closeAccountDialog}
        onConfirm={handleAccountConfirm}
      />
    </UserScreenShell>
  )
}
