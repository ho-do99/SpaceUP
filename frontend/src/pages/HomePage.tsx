import { Link } from 'react-router-dom'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 px-4">
        <section className="max-w-5xl mx-auto text-center py-20">
          <p className="text-primary-400 font-semibold mb-4">AI FLOOR PLAN ANALYSIS</p>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8">
            평면도 한 장으로 시작하는
            <span className="block text-gradient">더 나은 공간의 가치</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10">
            SpaceUP이 평면도를 분석해 예상 견적, 주택 가치 리포트, 맞춤 시공사를 연결합니다.
          </p>
          <Link to="/upload" className="btn-primary">
            평면도 분석 시작하기
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
