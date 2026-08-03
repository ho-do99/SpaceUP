import { Link } from 'react-router-dom'
import chevronIcon from '@/assets/user/icons/management/chevron.svg'

interface MyPageMenuItemProps {
  iconSrc: string
  label: string
  description?: string
  to?: string
  className?: string
}

export default function MyPageMenuItem({
  iconSrc,
  label,
  description,
  to,
  className = '',
}: MyPageMenuItemProps) {
  const content = (
    <>
      <img src={iconSrc} alt="" className="size-[22px] shrink-0" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-bold leading-[22px] text-[#1e293b]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] leading-[18px] text-[#64748b]">
            {description}
          </span>
        ) : null}
      </span>
      <img src={chevronIcon} alt="" className="size-[18px] shrink-0" />
    </>
  )

  const classes = `flex w-full items-center gap-3 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563eb] ${className}`

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={`${classes} cursor-default`} aria-disabled="true">
      {content}
    </button>
  )
}
