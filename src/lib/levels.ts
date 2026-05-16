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

// Эффекты для бейджа (звания)
export const BADGE_EFFECTS = [
  { value: '',               label: 'Без эффекта'           },
  { value: 'badge-blood',    label: 'Кровавый'              },
  { value: 'badge-gold',     label: 'Золотой'               },
  { value: 'badge-ice',      label: 'Ледяной'               },
  { value: 'badge-void',     label: 'Тёмная пустота'        },
  { value: 'badge-fire',     label: 'Огненный'              },
  { value: 'badge-poison',   label: 'Ядовитый'              },
  { value: 'badge-ghost',    label: 'Призрачный'            },
  { value: 'badge-crimson',  label: 'Тёмно-алый'            },
  { value: 'badge-eldritch', label: 'Потусторонний'         },
  { value: 'badge-glitch',   label: 'Глитч'                 },
  { value: 'badge-shadow',   label: 'Тень'                  },
]

export function getBadgeStyle(effect: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    'badge-blood':    { background: 'linear-gradient(135deg,#3d0000,#8b0000)', color: '#ff4444', boxShadow: '0 0 8px rgba(139,0,0,0.7), inset 0 1px 0 rgba(255,80,80,0.15)', border: '1px solid rgba(139,0,0,0.6)' },
    'badge-gold':     { background: 'linear-gradient(135deg,#3a2800,#7a5800)', color: '#ffd700', boxShadow: '0 0 8px rgba(220,180,0,0.6), inset 0 1px 0 rgba(255,220,50,0.2)', border: '1px solid rgba(180,140,0,0.5)' },
    'badge-ice':      { background: 'linear-gradient(135deg,#001833,#003566)', color: '#7ec8e3', boxShadow: '0 0 8px rgba(100,180,255,0.5), inset 0 1px 0 rgba(150,220,255,0.15)', border: '1px solid rgba(80,160,220,0.4)' },
    'badge-void':     { background: 'linear-gradient(135deg,#0a000f,#1a0030)', color: '#9933ff', boxShadow: '0 0 10px rgba(120,0,255,0.5), inset 0 1px 0 rgba(180,100,255,0.1)', border: '1px solid rgba(100,0,200,0.5)' },
    'badge-fire':     { background: 'linear-gradient(135deg,#2a0a00,#6b2500)', color: '#ff6b00', boxShadow: '0 0 8px rgba(255,100,0,0.6), inset 0 1px 0 rgba(255,150,50,0.15)', border: '1px solid rgba(200,80,0,0.5)' },
    'badge-poison':   { background: 'linear-gradient(135deg,#001a06,#003d12)', color: '#00e64d', boxShadow: '0 0 8px rgba(0,200,60,0.5), inset 0 1px 0 rgba(50,255,100,0.1)', border: '1px solid rgba(0,150,40,0.4)' },
    'badge-ghost':    { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.1)' },
    'badge-crimson':  { background: 'linear-gradient(135deg,#1a0000,#4d0000)', color: '#cc0022', boxShadow: '0 0 6px rgba(180,0,20,0.6)', border: '1px solid rgba(140,0,20,0.5)' },
    'badge-eldritch': { background: 'linear-gradient(135deg,#0d001a,#1f0035)', color: '#cc44ff', boxShadow: '0 0 10px rgba(180,0,255,0.4), 0 0 20px rgba(100,0,180,0.2)', border: '1px solid rgba(140,0,220,0.4)' },
    'badge-glitch':   { background: '#0a0a0a', color: '#00ffcc', boxShadow: '0 0 6px rgba(0,255,180,0.5)', border: '1px solid rgba(0,200,150,0.4)' },
    'badge-shadow':   { background: 'linear-gradient(135deg,#080808,#111)', color: 'rgba(255,255,255,0.35)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.06)' },
  }
  return styles[effect] || { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
}

export function getBadgeClassName(effect: string): string {
  const map: Record<string, string> = {
    'badge-glitch':   'animate-badge-glitch',
    'badge-eldritch': 'animate-badge-eldritch',
    'badge-ghost':    'animate-badge-ghost',
    'badge-fire':     'animate-badge-fire',
    'badge-blood':    'animate-badge-blood',
  }
  return map[effect] || ''
}

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