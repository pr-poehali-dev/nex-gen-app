import { getNameStyle, getNameClassName } from '@/lib/levels'

interface UserNameProps {
  username: string
  role: string
  stories_read?: number
  name_color?: string
  name_effect?: string
  className?: string
  onClick?: () => void
}

export default function UserName({
  username,
  role,
  stories_read = 0,
  name_color,
  name_effect,
  className = '',
  onClick,
}: UserNameProps) {
  const style = getNameStyle({ role, stories_read, name_color, name_effect })
  const animClass = getNameClassName({ role, name_effect })
  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center font-medium ${animClass} ${onClick ? 'hover:opacity-70 transition-opacity' : ''} ${className}`}
      style={style}
    >
      {username}
    </Tag>
  )
}
