import type { ContractorProjectChecklistItem } from '@/types/contractorPortal'

export default function ContractorProjectChecklist({ items }: { items: readonly ContractorProjectChecklistItem[] }) {
  return <ul className="space-y-2">{items.map((item) => <li key={item.id} className="flex items-center gap-2 text-xs text-[#475569]"><span aria-hidden="true" className={item.completed ? 'text-[#2563eb]' : 'text-[#94a3b8]'}>{item.completed ? '✓' : '○'}</span><span>{item.label}</span></li>)}</ul>
}
