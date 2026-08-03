import { useNavigate } from 'react-router-dom'
import constructionIcon from '@/assets/user/icons/management/construction.svg'
import profileIcon from '@/assets/user/icons/management/profile-user.svg'
import requestListIcon from '@/assets/user/icons/management/request-list.svg'
import settingsIcon from '@/assets/user/icons/management/settings.svg'
import MyPageMenuItem from '@/components/user/MyPageMenuItem'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { userProfile } from '@/mocks/userProfile'

export default function MyPage() {
  const navigate = useNavigate()

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="마이페이지" onBack={() => navigate(-1)} />

      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-9">
        <h1 className="text-[22px] font-bold leading-9 text-[#1e293b]">마이페이지</h1>
        <p className="text-[12px] leading-5 text-[#64748b]">프로필과 계정 정보를 관리하세요.</p>

        <section className="mt-4 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white" aria-label="프로필">
          <div className="relative flex min-h-[92px] items-start px-4 py-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
              <img src={profileIcon} alt="" className="size-7" />
            </span>
            <div className="ml-3 min-w-0 pr-[86px]">
              <h2 className="text-[17px] font-bold leading-7 text-[#1e293b]">{userProfile.name}</h2>
              <p className="text-[12px] leading-5 text-[#64748b]">{userProfile.email}</p>
              <p className="text-[12px] leading-5 text-[#64748b]">{userProfile.phone}</p>
            </div>
            <button
              type="button"
              aria-disabled="true"
              className="absolute right-4 top-4 h-7 cursor-default rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-2.5 text-[11px] text-[#2563eb]"
            >
              개인정보 수정
            </button>
          </div>

          <div className="mx-4 border-t border-[#e2e8f0]" />
          <MyPageMenuItem
            iconSrc={requestListIcon}
            label="견적 요청 내역"
            to="/mypage/requests"
            className="h-[90px]"
          />
          <div className="ml-[49px] mr-4 border-t border-[#e2e8f0]" />
          <MyPageMenuItem
            iconSrc={constructionIcon}
            label="시공 내역"
            description="진행 중·완료된 시공 확인"
            className="h-16"
          />
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white" aria-label="계정 설정">
          <MyPageMenuItem
            iconSrc={settingsIcon}
            label="계정 설정"
            description="로그인, 보안 및 계정 관리"
            to="/settings"
            className="h-[70px]"
          />
        </section>
      </main>
    </UserScreenShell>
  )
}
