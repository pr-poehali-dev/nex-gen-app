import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { STORIES, GENRES } from '@/data/stories'

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
        style={{ background: 'radial-gradient(ellipse at top center, rgba(80,0,0,0.15) 0%, transparent 50%)' }}
      />

      {/* Шапка */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-white text-lg font-bold tracking-wider hover:text-red-400 transition-colors duration-200"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          ShadowTales
        </button>
        <button
          onClick={() => navigate('/submit')}
          className="flex items-center gap-2 text-[#8B0000] hover:text-red-400 transition-colors text-sm"
        >
          <Icon name="PenLine" size={16} />
          Предложить историю
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-12 py-12">
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
          <p className="text-white/40 text-sm">{STORIES.length} историй · Только проверенные</p>
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
              onClick={() => navigate(`/story/${story.id}`)}
              className="group py-7 border-b cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-xs px-2 py-0.5 border rounded-sm"
                      style={{ borderColor: '#8B0000', color: '#8B0000' }}
                    >
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