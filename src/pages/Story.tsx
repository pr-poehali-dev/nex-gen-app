import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { STORIES } from '@/data/stories'

export default function Story() {
  const { id } = useParams()
  const navigate = useNavigate()
  const story = STORIES.find(s => s.id === Number(id))

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
        <div className="text-center">
          <p className="text-white/40 mb-4">История не найдена</p>
          <button onClick={() => navigate('/catalog')} className="text-[#8B0000] hover:text-red-400 transition-colors text-sm">
            ← Вернуться в каталог
          </button>
        </div>
      </div>
    )
  }

  const paragraphs = story.text.split('\n\n').filter(Boolean)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.2) 0%, transparent 60%)' }}
      />

      {/* Шапка */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <Icon name="ArrowLeft" size={16} />
          Каталог
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-white text-lg font-bold tracking-wider hover:text-red-400 transition-colors duration-200"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          ShadowTales
        </button>
        <div className="w-24" />
      </header>

      <main className="max-w-2xl mx-auto px-6 md:px-8 py-14">
        {/* Мета */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-5">
            <span
              className="text-xs px-2 py-0.5 border rounded-sm"
              style={{ borderColor: '#8B0000', color: '#8B0000' }}
            >
              {story.genre}
            </span>
            <span className="text-white/25 text-xs">{story.date}</span>
          </div>

          <h1
            className="text-3xl md:text-5xl text-white leading-tight mb-6"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            {story.title}
          </h1>

          <div className="flex items-center gap-5 text-white/30 text-sm pb-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="flex items-center gap-1.5">
              <Icon name="User" size={14} />
              {story.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Clock" size={14} />
              {story.readTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Eye" size={14} />
              {story.views.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Текст истории */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-6"
        >
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="leading-8 text-base md:text-lg"
              style={{ color: i === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)' }}
            >
              {para}
            </p>
          ))}
        </motion.div>

        {/* Навигация внизу */}
        <div className="mt-16 pt-8 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <Icon name="ArrowLeft" size={16} />
            Все истории
          </button>
          <button
            onClick={() => navigate('/submit')}
            className="flex items-center gap-2 text-[#8B0000] hover:text-red-400 transition-colors text-sm"
          >
            <Icon name="PenLine" size={16} />
            Предложить свою
          </button>
        </div>
      </main>
    </div>
  )
}