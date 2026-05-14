import { getLevelByReads, getNameStyle, getNameClassName } from '@/lib/levels'

interface UserNameProps {
  username: string
  role: string
  stories_read?: number
  name_prefix?: string
  name_color?: string
  name_effect?: string
  className?: string
  showPrefix?: boolean
  onClick?: () => void
}

export default function UserName({
  username,
  role,
  stories_read = 0,
  name_prefix,
  name_color,
  name_effect,
  className = '',
  showPrefix = true,
  onClick,
}: UserNameProps) {
  const isStaff = role === 'admin' || role === 'moderator'
  const level = getLevelByReads(stories_read)
  const prefix = isStaff ? (name_prefix ?? '') : level.prefix
  const style = getNameStyle({ role, stories_read, name_color, name_effect })
  const animClass = getNameClassName({ role, name_effect })

  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium ${animClass} ${onClick ? 'hover:opacity-70 transition-opacity' : ''} ${className}`}
      style={style}
    >
      {showPrefix && prefix && <span className="text-xs leading-none">{prefix}</span>}
      <span>{username}</span>
    </Tag>
  )
}
