import { Link, useParams } from 'react-router-dom'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function AnalysisResultPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="max-w-4xl mx-auto">
          <p className="text-primary-400 mb-2">분석 번호 {id}</p>
          <h1 className="text-4xl font-bold mb-8">평면도 분석 결과</h1>
          <div className="card p-8 text-slate-300">
            AI 분석 결과가 준비되면 공간별 면적과 개선 제안이 여기에 표시됩니다.
          </div>
          <Link to={`/estimate/${id ?? ''}`} className="btn-primary mt-8">
            예상 견적 확인하기
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
