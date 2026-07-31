import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function ContractorPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">시공사 찾기</h1>
          <p className="text-slate-400 mb-8">지역과 공사 분야에 맞는 시공사를 비교해 보세요.</p>
          <div className="card p-8 text-slate-300">
            등록된 시공사 목록과 포트폴리오가 이 화면에 표시됩니다.
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
