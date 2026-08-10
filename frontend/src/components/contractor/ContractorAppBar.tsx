import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import backIcon from '@/assets/user/icons/back.svg'
import menuIcon from '@/assets/user/icons/menu.svg'
import ContractorHeaderActions from './ContractorHeaderActions'
import ContractorMenuDrawer from './ContractorMenuDrawer'

interface ContractorAppBarProps {
  title: string
  back?: boolean
  actions?: 'all' | 'chat' | 'none'
}

export default function ContractorAppBar({
  title,
  back = false,
  actions = 'all',
}: ContractorAppBarProps) {
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const wasMenuOpenRef = useRef(false)

  useEffect(() => {
    if (wasMenuOpenRef.current && !isMenuOpen) {
      menuButtonRef.current?.focus()
    }

    wasMenuOpenRef.current = isMenuOpen
  }, [isMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-[#e2e8f0] bg-white">
        {back ? (
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="absolute left-2 top-2 flex h-10 w-6 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img src={backIcon} alt="" className="h-5 w-5" />
          </button>
        ) : (
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="메뉴 열기"
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
            aria-controls="contractor-menu-drawer"
            onClick={() => setIsMenuOpen(true)}
            className="absolute left-2 top-2 flex h-10 w-10 items-center justify-center rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img src={menuIcon} alt="" className="h-[22px] w-[22px]" />
          </button>
        )}

        <h1 className={`min-w-0 flex-1 truncate pr-[124px] text-[17px] font-bold leading-[25px] text-[#1e293b] ${back ? 'pl-[34px]' : 'pl-[52px]'}`}>
          {title}
        </h1>

        {actions === 'none' ? null : (
          <div className="absolute right-3 top-2">
            <ContractorHeaderActions mode={actions === 'chat' ? 'chat' : 'all'} />
          </div>
        )}
      </header>

      <ContractorMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  )
}
