export default function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-24 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xl font-extrabold text-gradient">SpaceUP</span>
        <p className="text-slate-500 text-sm text-center">
          © {new Date().getFullYear()} SpaceUP. AI 평면도 분석 기반 인테리어 플랫폼.
        </p>
        <div className="flex gap-4 text-slate-500 text-sm">
          <a href="#" className="hover:text-slate-300 transition-colors">이용약관</a>
          <a href="#" className="hover:text-slate-300 transition-colors">개인정보처리방침</a>
          <a href="#" className="hover:text-slate-300 transition-colors">문의</a>
        </div>
      </div>
    </footer>
  )
}
