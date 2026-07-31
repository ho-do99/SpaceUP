import { Link, useParams } from 'react-router-dom'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function EstimatePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="max-w-4xl mx-auto">
          <p className="text-primary-400 mb-2">분석 번호 {id}</p>
          <h1 className="text-4xl font-bold mb-8">예상 인테리어 견적</h1>
          <div className="card p-8 text-slate-300">
            공간별 공사 범위와 예상 비용이 산출되면 이 화면에서 확인할 수 있습니다.
          </div>
          <Link to={`/report/${id ?? ''}`} className="btn-primary mt-8">
            주택 가치 리포트 보기
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
