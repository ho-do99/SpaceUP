import type { ReactNode } from 'react'

interface UserScreenShellProps {
  children: ReactNode
  className?: string
}

export default function UserScreenShell({ children, className = '' }: UserScreenShellProps) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#f4f7fb] text-[#15284c]">
      <div
        className={`relative mx-auto flex min-h-dvh w-full max-w-[393px] flex-col overflow-hidden bg-white ring-1 ring-inset ring-[#c9d5e5] sm:rounded-[8px] ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
