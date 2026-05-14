import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/icon'

const GENRES = ['Все', 'Хоррор', 'Мистика', 'Психологический триллер', 'Крипипаста']

const STORIES = [
  {
    id: 1,
    title: 'Комната 237',
    author: 'Тёмный Странник',
    genre: 'Хоррор',
    date: '12 мая 2026',
    readTime: '8 мин',
    views: 4821,
    excerpt: 'Когда я въехал в эту квартиру, соседи предупреждали: не открывай дверь напротив. Я не слушал. Теперь я понимаю, почему предыдущий жилец исчез.',
  },
  {
    id: 2,
    title: 'Зеркало моей матери',
    author: 'Аноним',
    genre: 'Мистика',
    date: '9 мая 2026',
    readTime: '5 мин',
    views: 3102,
    excerpt: 'Мама умерла три года назад. Её старое зеркало я не выбрасывал — казалось, это предательство. Прошлой ночью в нём что-то двинулось.',
  },
  {
    id: 3,
    title: 'Клиент №47',
    author: 'NightWriter',
    genre: 'Психологический триллер',
    date: '7 мая 2026',
    readTime: '12 мин',
    views: 6540,
    excerpt: 'Я психотерапевт с пятнадцатилетним стажем. Я видел всякое. Но этот пациент описывал мои сны — в деталях, которые я никому не рассказывал.',
  },
  {
    id: 4,
    title: 'SCP-████: Тихий Город',
    author: 'Dr_Void',
    genre: 'Крипипаста',
    date: '5 мая 2026',
    readTime: '15 мин',
    views: 9213,
    excerpt: 'Объект класса Кетер. Локация засекречена. Все агенты, посланные на исследование, вернулись живыми. Это и есть проблема.',
  },
  {
    id: 5,
    title: 'Последний автобус',
    author: 'ПолночьАвтор',
    genre: 'Хоррор',
    date: '3 мая 2026',
    readTime: '6 мин',
    views: 2874,
    excerpt: 'Маршрут 13 ходит строго по расписанию. Но однажды в 3:17 ночи я сел в автобус, которого быть не должно. Водитель не обернулся ни разу.',
  },
  {
    id: 6,
    title: 'Голос в стенах',
    author: 'EchoInTheDark',
    genre: 'Мистика',
    date: '1 мая 2026',
    readTime: '9 мин',
    views: 3918,
    excerpt: 'Дом был построен в 1887 году. Когда я начал ремонт, за старой штукатуркой нашёл записки. Все они были адресованы мне по имени.',
  },
]

export default function Catalog() {
  const [activeGenre, setActiveGenre] = useState('Все')
  const navigate = useNavigate()

  const filtered = activeGenre === 'Все'
    ? STORIES
    : STORIES.filter(s => s.genre === activeGenre)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(80,0,0,0.15) 0%, transparent 50%)',
        }}
      />

      {/* Шапка */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <span
          className="text-white text-lg font-bold tracking-wider"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          ShadowTales
        </span>
        <button className="flex items-center gap-2 text-[#8B0000] hover:text-red-400 transition-colors text-sm">
          <Icon name="PenLine" size={16} />
          Предложить историю
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1
            className="text-3xl md:text-5xl text-white mb-3"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Каталог историй
          </h1>
          <p className="text-white/40 text-sm">{STORIES.length} историй • Только проверенные</p>
        </motion.div>

        {/* Фильтры */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className="px-4 py-1.5 text-sm transition-all duration-200 border rounded-sm"
              style={{
                backgroundColor: activeGenre === genre ? '#8B0000' : 'transparent',
                borderColor: activeGenre === genre ? '#8B0000' : 'rgba(255,255,255,0.1)',
                color: activeGenre === genre ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {genre}
            </button>
          ))}
        </motion.div>

        {/* Список историй */}
        <div className="flex flex-col">
          {filtered.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              className="group py-7 border-b cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs px-2 py-0.5 border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                      {story.genre}
                    </span>
                    <span className="text-white/25 text-xs">{story.date}</span>
                  </div>
                  <h2
                    className="text-white text-xl md:text-2xl mb-2 group-hover:text-red-400 transition-colors duration-200"
                    style={{ fontFamily: "'Cinzel Decorative', serif" }}
                  >
                    {story.title}
                  </h2>
                  <p className="text-white/40 text-sm leading-relaxed line-clamp-2 mb-3">
                    {story.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-white/25 text-xs">
                    <span>{story.author}</span>
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={12} />
                      {story.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Eye" size={12} />
                      {story.views.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="ChevronRight" size={20} className="text-[#8B0000]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
