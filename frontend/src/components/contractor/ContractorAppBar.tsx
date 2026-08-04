import { useNavigate } from 'react-router-dom'
import backIcon from '@/assets/user/icons/back.svg'
import menuIcon from '@/assets/user/icons/menu.svg'
import ContractorHeaderActions from './ContractorHeaderActions'

interface ContractorAppBarProps {
  title: string
  back?: boolean
}
export default function ContractorAppBar({ title, back = false }: ContractorAppBarProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[#e2e8f0] bg-white px-4">
      {back ? (
        <button type="button" aria-label="뒤로가기" onClick={() => navigate(-1)} className="rounded-md p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
          <img src={backIcon} alt="" className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" disabled aria-label="메뉴" className="rounded-md p-1 opacity-80 disabled:cursor-not-allowed">
          <img src={menuIcon} alt="" className="h-4 w-4" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold text-[#1e293b]">{title}</h1>
      <ContractorHeaderActions />
    </header>
  )
}
