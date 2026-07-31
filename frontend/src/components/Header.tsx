import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: '홈',       to: '/' },
  { label: '평면도 분석', to: '/upload' },
  { label: '시공사 찾기', to: '/contractors' },
  { label: '마이페이지', to: '/mypage' },
]

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-gradient">SpaceUP</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.to
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-outline text-sm py-2">
            로그인
          </Link>
        </div>
      </div>
    </header>
  )
}
