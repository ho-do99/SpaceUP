import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import backIcon from '@/assets/user/icons/back.svg'
import menuIcon from '@/assets/user/icons/menu.svg'
import ContractorHeaderActions from './ContractorHeaderActions'
import ContractorMenuDrawer from './ContractorMenuDrawer'

interface ContractorAppBarProps {
  title: string
  back?: boolean
}

export default function ContractorAppBar({
  title,
  back = false,
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
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[#e2e8f0] bg-white px-4">
        {back ? (
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="rounded-md p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img src={backIcon} alt="" className="h-4 w-4" />
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
            className="rounded-md p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <img src={menuIcon} alt="" className="h-4 w-4" />
          </button>
        )}

        <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold text-[#1e293b]">
          {title}
        </h1>

        <ContractorHeaderActions />
      </header>

      <ContractorMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  )
}