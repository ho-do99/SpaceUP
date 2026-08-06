import afterImage from '@/assets/user/images/simulation-after.png'
import beforeImage from '@/assets/user/images/simulation-before.png'

export default function BeforeAfterComparison() {
  return (
    <figure className="relative grid h-[402px] grid-cols-2 overflow-hidden rounded-xl border border-[#cbd5e1] bg-white">
      <img
        src={beforeImage}
        alt="인테리어 적용 전 공간"
        className="h-full w-full object-cover"
      />
      <img
        src={afterImage}
        alt="모던 스타일 적용 후 공간"
        className="h-full w-full object-cover"
      />

      <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#2563eb] bg-white"
      >
        <span className="size-2.5 rotate-45 border-b-2 border-l-2 border-[#2563eb]" />
        <span className="size-2.5 -rotate-45 border-b-2 border-r-2 border-[#2563eb]" />
      </div>
    </figure>
  )
}
