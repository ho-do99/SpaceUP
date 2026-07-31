import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function MyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">마이페이지</h1>
          <p className="text-slate-400 mb-8">내 평면도 분석, 견적, 리포트를 관리합니다.</p>
          <div className="card p-8 text-slate-300">
            로그인한 사용자의 프로젝트 내역이 여기에 표시됩니다.
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
