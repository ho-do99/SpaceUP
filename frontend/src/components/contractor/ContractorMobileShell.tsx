import type { ReactNode } from 'react'

interface ContractorMobileShellProps {
  children: ReactNode
  innerClassName?: string
}
export default function ContractorMobileShell({ children, innerClassName = '' }: ContractorMobileShellProps) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#e8edf4] text-[#1e293b]">
      <div className={`relative mx-auto flex min-h-dvh w-full max-w-[393px] flex-col overflow-x-hidden bg-[#f8fafc] ring-1 ring-inset ring-[#e2e8f0] ${innerClassName}`}>
        {children}
      </div>
    </div>
  )
}
