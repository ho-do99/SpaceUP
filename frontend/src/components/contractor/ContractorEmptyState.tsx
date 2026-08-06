interface ContractorEmptyStateProps {
  title: string
  description: string
}
export default function ContractorEmptyState({ title, description }: ContractorEmptyStateProps) {
  return (
    <div aria-live="polite" className="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
      <p className="text-sm font-bold text-[#1e293b]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">{description}</p>
    </div>
  )
}
