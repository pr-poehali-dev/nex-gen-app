export interface LevelInfo {
  level: number
  title: string
  prefix: string
  color: string
  minReads: number
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Новичок',           prefix: '',   color: '#666666', minReads: 0  },
  { level: 2, title: 'Наблюдатель',       prefix: '👁', color: '#aaaaaa', minReads: 5  },
  { level: 3, title: 'Странник',          prefix: '🕯', color: '#cc6644', minReads: 15 },
  { level: 4, title: 'Хранитель',         prefix: '💀', color: '#cc2222', minReads: 30 },
  { level: 5, title: 'Одержимый',         prefix: '🩸', color: '#ff0000', minReads: 60 },
  { level: 6, title: 'Голос из темноты',  prefix: '👁‍🗨', color: '#ff0000', minReads: 100 },
]

export const STAFF_COLORS = [
  { value: '#cc0000', label: 'Кровавый' },
  { value: '#ff3333', label: 'Алый' },
  { value: '#ff6600', label: 'Огненный' },
  { value: '#cc6600', label: 'Янтарный' },
  { value: '#9900cc', label: 'Мрачный фиолет' },
  { value: '#0066cc', label: 'Ледяной' },
  { value: '#00cc66', label: 'Ядовитый' },
  { value: '#cccc00', label: 'Золотой' },
  { value: '#ff66cc', label: 'Сумеречный' },
  { value: '#aaaaaa', label: 'Серебро' },
  { value: '#ffffff', label: 'Белый' },
]

export const STAFF_EFFECTS = [
  { value: 'none',         label: 'Без эффекта' },
  { value: 'glow-red',     label: 'Красное свечение' },
  { value: 'glow-orange',  label: 'Оранжевое свечение' },
  { value: 'glow-purple',  label: 'Фиолетовое свечение' },
  { value: 'glow-gold',    label: 'Золотое свечение' },
  { value: 'pulse',        label: 'Пульсация' },
  { value: 'flicker',      label: 'Мерцание' },
  { value: 'rainbow',      label: 'Радужный' },
]

export const STAFF_PREFIXES = [
  '','👁','🕯','💀','🩸','👁‍🗨','⛧','🔮','🕸','🦇','👻','🌑','⚰️','🗡','🔥','❄️',
]

export function getLevelByReads(reads: number): LevelInfo {
  let result = LEVELS[0]
  for (const lvl of LEVELS) {
    if (reads >= lvl.minReads) result = lvl
  }
  return result
}

export function getNameStyle(opts: {
  role: string
  stories_read?: number
  name_color?: string
  name_effect?: string
}): React.CSSProperties {
  const { role, stories_read = 0, name_color, name_effect } = opts
  const isStaff = role === 'admin' || role === 'moderator'

  const color = isStaff && name_color ? name_color : getLevelByReads(stories_read).color

  const shadows: Record<string, string> = {
    'glow-red':    '0 0 8px rgba(220,0,0,0.9), 0 0 20px rgba(220,0,0,0.5)',
    'glow-orange': '0 0 8px rgba(255,120,0,0.9), 0 0 20px rgba(255,120,0,0.5)',
    'glow-purple': '0 0 8px rgba(160,0,220,0.9), 0 0 20px rgba(160,0,220,0.5)',
    'glow-gold':   '0 0 8px rgba(220,180,0,0.9), 0 0 20px rgba(220,180,0,0.5)',
  }

  const textShadow = (isStaff && name_effect && shadows[name_effect]) ? shadows[name_effect] : undefined

  return { color, textShadow }
}

export function getNameClassName(opts: {
  role: string
  name_effect?: string
}): string {
  const { role, name_effect } = opts
  const isStaff = role === 'admin' || role === 'moderator'
  if (!isStaff || !name_effect) return ''
  const map: Record<string, string> = {
    pulse:   'animate-name-pulse',
    flicker: 'animate-name-flicker',
    rainbow: 'animate-name-rainbow',
  }
  return map[name_effect] || ''
}
