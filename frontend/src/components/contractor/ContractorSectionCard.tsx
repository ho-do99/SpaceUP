import type { ReactNode } from 'react'

interface ContractorSectionCardProps {
  title?: string
  children: ReactNode
  className?: string
}
export default function ContractorSectionCard({ title, children, className = '' }: ContractorSectionCardProps) {
  return (
    <section className={`rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm ${className}`}>
      {title ? <h2 className="mb-3 text-sm font-bold text-[#1e293b]">{title}</h2> : null}
      {children}
    </section>
  )
}
