import { getBadgeStyle, getBadgeClassName } from '@/lib/levels'

interface UserBadgeProps {
  text: string
  effect?: string
  className?: string
}

export default function UserBadge({ text, effect = '', className = '' }: UserBadgeProps) {
  if (!text) return null
  const style = getBadgeStyle(effect)
  const animClass = getBadgeClassName(effect)

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium tracking-wide ${animClass} ${className}`}
      style={style}
    >
      {text}
    </span>
  )
}
