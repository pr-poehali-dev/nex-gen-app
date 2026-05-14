export interface LevelInfo {
  level: number
  title: string
  color: string
  minReads: number
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Новичок',          color: '#555555', minReads: 0   },
  { level: 2, title: 'Наблюдатель',      color: '#888888', minReads: 5   },
  { level: 3, title: 'Странник',         color: '#cc6644', minReads: 15  },
  { level: 4, title: 'Хранитель',        color: '#cc2222', minReads: 30  },
  { level: 5, title: 'Одержимый',        color: '#ff2222', minReads: 60  },
  { level: 6, title: 'Голос из темноты', color: '#ff0000', minReads: 100 },
]

// Цвета для выдачи через админку
export const NAME_COLORS = [
  { value: '#cc0000', label: 'Кровавый'      },
  { value: '#ff3333', label: 'Алый'          },
  { value: '#ff6600', label: 'Огненный'      },
  { value: '#cc6600', label: 'Янтарный'      },
  { value: '#9900cc', label: 'Тёмный фиолет' },
  { value: '#6600ff', label: 'Потусторонний' },
  { value: '#0066cc', label: 'Ледяной'       },
  { value: '#00cc66', label: 'Ядовитый'      },
  { value: '#cccc00', label: 'Золотой'       },
  { value: '#ff66cc', label: 'Сумеречный'    },
  { value: '#aaaaaa', label: 'Серебро'       },
  { value: '#ffffff', label: 'Белый'         },
  { value: '',        label: 'Авто (уровень)'},
]

// Эффекты для выдачи через админку
export const NAME_EFFECTS = [
  { value: '',              label: 'Без эффекта'         },
  { value: 'glow-red',      label: '🔴 Красное свечение' },
  { value: 'glow-orange',   label: '🟠 Оранжевое свечение'},
  { value: 'glow-purple',   label: '🟣 Фиолетовое свечение'},
  { value: 'glow-blue',     label: '🔵 Синее свечение'   },
  { value: 'glow-gold',     label: '🟡 Золотое свечение' },
  { value: 'glow-green',    label: '🟢 Ядовитое свечение'},
  { value: 'pulse',         label: '💓 Пульсация'        },
  { value: 'flicker',       label: '👁 Мерцание'         },
  { value: 'shake',         label: '😨 Дрожание'         },
  { value: 'rainbow',       label: '🌈 Радужный'         },
  { value: 'ghost',         label: '👻 Призрачный'       },
  { value: 'blood-drip',    label: '🩸 Кровоточащий'     },
]

export function getLevelByReads(reads: number): LevelInfo {
  let result = LEVELS[0]
  for (const lvl of LEVELS) {
    if (reads >= lvl.minReads) result = lvl
  }
  return result
}

export function getNameStyle(opts: {
  stories_read?: number
  name_color?: string
  name_effect?: string
}): React.CSSProperties {
  const { stories_read = 0, name_color, name_effect } = opts

  const color = name_color || getLevelByReads(stories_read).color

  const shadows: Record<string, string> = {
    'glow-red':    '0 0 8px rgba(220,0,0,0.9),   0 0 22px rgba(220,0,0,0.5)',
    'glow-orange': '0 0 8px rgba(255,120,0,0.9),  0 0 22px rgba(255,120,0,0.5)',
    'glow-purple': '0 0 8px rgba(160,0,220,0.9),  0 0 22px rgba(160,0,220,0.5)',
    'glow-blue':   '0 0 8px rgba(0,100,220,0.9),  0 0 22px rgba(0,100,220,0.5)',
    'glow-gold':   '0 0 8px rgba(220,180,0,0.9),  0 0 22px rgba(220,180,0,0.5)',
    'glow-green':  '0 0 8px rgba(0,200,80,0.9),   0 0 22px rgba(0,200,80,0.5)',
  }

  const textShadow = name_effect ? shadows[name_effect] : undefined

  return { color, textShadow }
}

export function getNameClassName(name_effect?: string): string {
  const map: Record<string, string> = {
    pulse:       'animate-name-pulse',
    flicker:     'animate-name-flicker',
    shake:       'animate-name-shake',
    rainbow:     'animate-name-rainbow',
    ghost:       'animate-name-ghost',
    'blood-drip':'animate-name-blood',
  }
  return name_effect ? (map[name_effect] || '') : ''
}
