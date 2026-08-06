import type { ReactNode } from 'react'

export default function ContractorEstimateInfoRow({ label, children, emphasize = false }: { label: string; children: ReactNode; emphasize?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs leading-5">
      <dt className="shrink-0 text-[#64748b]">{label}</dt>
      <dd className={`min-w-0 break-words text-right ${emphasize ? 'font-bold text-[#2563eb]' : 'text-[#0f172a]'}`}>{children}</dd>
    </div>
  )
}
