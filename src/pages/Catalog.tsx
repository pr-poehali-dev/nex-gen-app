import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { getCachedUser } from '@/lib/auth'
import ChatPanel from '@/components/ui/ChatPanel'

const GENRES = ['Все', 'Хоррор', 'Мистика', 'Психологический триллер', 'Крипипаста']
const API_URL = 'https://functions.poehali.dev/e26b6cce-8804-469e-a6e7-57e201e0f4ab'

interface Story {
  id: number
  title: string
  author_name: string
  genre: string
  text: string
  created_at: string
  views: number
}

function excerpt(text: string) {
  return text.slice(0, 180).trimEnd() + '...'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readTime(text: string) {
  const words = text.split(/\s+/).length
  return `${Math.max(1, Math.round(words / 200))} мин`
}

export default function Catalog() {
  const [activeGenre, setActiveGenre] = useState('Все')
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const currentUser = getCachedUser()

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => { setStories(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeGenre === 'Все'
    ? stories
    : stories.filter(s => s.genre === activeGenre)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(80,0,0,0.15) 0%, transparent 50%)' }}
      />

      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          <span className="hidden sm:inline">Назад</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-white text-base md:text-lg font-bold tracking-wider hover:text-red-400 transition-colors duration-200"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          ShadowTales
        </button>
        <div className="flex items-center gap-2 md:gap-4">
          {currentUser ? (
            <button onClick={() => navigate('/account')} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm">
              <Icon name="CircleUser" size={16} />
              <span className="hidden sm:inline max-w-[80px] truncate">{currentUser.username}</span>
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
              <Icon name="LogIn" size={15} />
              <span className="hidden sm:inline">Войти</span>
            </button>
          )}
          <ChatPanel />
          <button onClick={() => navigate('/submit')} className="flex items-center gap-1.5 text-[#8B0000] hover:text-red-400 transition-colors text-sm">
            <Icon name="PenLine" size={16} />
            <span className="hidden sm:inline">Предложить</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-12 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-5xl text-white mb-2" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Каталог историй
          </h1>
          <p className="text-white/40 text-sm">
            {loading ? 'Загрузка...' : `${stories.length} ${stories.length === 1 ? 'история' : 'историй'} · Только проверенные`}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-wrap gap-2 mb-8 md:mb-10">
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className="px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm transition-all duration-200 border rounded-sm"
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

        {loading && (
          <div className="flex items-center gap-3 py-12 text-white/30 text-sm">
            <Icon name="Loader" size={16} className="animate-spin" />
            Загружаем истории...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-white/30 text-sm py-12">
            {stories.length === 0 ? 'Пока нет опубликованных историй' : 'В этом жанре пока нет историй'}
          </p>
        )}

        <div className="flex flex-col">
          {filtered.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              onClick={() => navigate(`/story/${story.id}`)}
              className="group py-5 md:py-7 border-b cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs px-2 py-0.5 border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                      {story.genre}
                    </span>
                    <span className="text-white/25 text-xs">{formatDate(story.created_at)}</span>
                  </div>
                  <h2
                    className="text-white text-base md:text-2xl mb-2 group-hover:text-red-400 transition-colors duration-200"
                    style={{ fontFamily: "'Cinzel Decorative', serif" }}
                  >
                    {story.title}
                  </h2>
                  <p className="text-white/40 text-sm leading-relaxed line-clamp-2 mb-3">
                    {excerpt(story.text)}
                  </p>
                  <div className="flex items-center gap-4 text-white/25 text-xs">
                    <span>{story.author_name}</span>
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={12} />
                      {readTime(story.text)}
                    </span>
                    {story.views > 0 && (
                      <span className="flex items-center gap-1">
                        <Icon name="Eye" size={12} />
                        {story.views.toLocaleString('ru-RU')}
                      </span>
                    )}
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