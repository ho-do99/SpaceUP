import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Button from '@/components/Button'

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="card max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold mb-2">로그인</h1>
          <p className="text-slate-400 mb-8">SpaceUP 서비스를 계속 이용하세요.</p>
          <form className="space-y-5">
            <label className="block">
              <span className="block text-sm text-slate-300 mb-2">이메일</span>
              <input
                type="email"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3"
                placeholder="spaceup@example.com"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-slate-300 mb-2">비밀번호</span>
              <input
                type="password"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3"
                placeholder="••••••••"
              />
            </label>
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  )
}
