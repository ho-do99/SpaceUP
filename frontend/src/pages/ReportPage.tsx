import { useParams } from 'react-router-dom'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="max-w-4xl mx-auto">
          <p className="text-primary-400 mb-2">리포트 번호 {id}</p>
          <h1 className="text-4xl font-bold mb-8">주택 가치 리포트</h1>
          <div className="card p-8 text-slate-300">
            분석된 평면과 개선 공사를 반영한 주택 가치 정보가 여기에 제공됩니다.
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
