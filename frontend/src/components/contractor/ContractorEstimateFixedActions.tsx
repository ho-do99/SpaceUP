export default function ContractorEstimateFixedActions({ onSave, onPreview }: { onSave: () => void; onPreview: () => void }) {
  return (
    <div className="sticky bottom-0 z-20 grid h-20 shrink-0 grid-cols-2 gap-4 border-t border-[#e2e8f0] bg-white px-4 py-4">
      <button type="button" onClick={onSave} className="rounded-[10px] border border-[#2563eb] text-sm font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">임시저장</button>
      <button type="button" onClick={onPreview} className="rounded-[10px] bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">견적서 미리보기</button>
    </div>
  )
}
