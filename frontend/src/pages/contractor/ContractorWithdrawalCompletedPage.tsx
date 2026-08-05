import { Link } from 'react-router-dom'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'

export default function ContractorWithdrawalCompletedPage() {
  return (
    <ContractorMobileShell innerClassName="h-dvh min-h-0 bg-white">
      <main className="flex min-h-0 flex-1 flex-col bg-white px-4 pb-5">
        <section className="mt-[180px] flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eff6ff]">
            <span
              aria-hidden="true"
              className="text-4xl font-bold text-[#2563eb]"
            >
              ✓
            </span>
          </div>

          <h1 className="mt-4 text-xl font-bold leading-[30px] text-[#1e293b]">
            회원탈퇴가 완료되었습니다.
          </h1>

          <p className="mt-4 text-[13px] leading-[22px] text-[#64748b]">
            그동안 SpaceUP을 이용해주셔서 감사합니다.
            <br />
            다시 서비스를 이용하려면 새 계정으로
            가입해주세요.
          </p>
        </section>

        <Link
          to="/login"
          className="mt-auto flex h-12 w-full items-center justify-center rounded-[10px] bg-[#2563eb] text-[15px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
        >
          로그인 화면으로
        </Link>
      </main>
    </ContractorMobileShell>
  )
}