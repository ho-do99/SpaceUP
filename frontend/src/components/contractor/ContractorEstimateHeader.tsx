import { useNavigate } from 'react-router-dom'
import backIcon from '@/assets/user/icons/back.svg'

interface ContractorEstimateHeaderProps {
  title: string
  onSave?: () => void
}

export default function ContractorEstimateHeader({ title, onSave }: ContractorEstimateHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-[#e2e8f0] bg-white px-4">
      <button type="button" aria-label="뒤로가기" onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-start rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">
        <img src={backIcon} alt="" className="h-4 w-4" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-base font-bold text-[#0f172a]">{title}</h1>
      {onSave ? (
        <button type="button" onClick={onSave} className="h-9 w-16 rounded-md text-right text-xs font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]">임시저장</button>
      ) : <span aria-hidden="true" className="w-16" />}
    </header>
  )
}
