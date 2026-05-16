import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { getCachedUser } from '@/lib/auth'
import ChatPanel from '@/components/ui/ChatPanel'

const GENRES = ['Все', 'Хоррор', 'Мистика', 'Психологический триллер', 'Крипипаста']
const API_URL = 'https://functions.poehali.dev/e26b6cce-8804-469e-a6e7-57e201e0f4ab'

type SortKey = 'newest' | 'oldest' | 'popular' | 'shortest' | 'longest'

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

function wordCount(text: string) {
  return text.split(/\s+/).length
}

function StorySkeleton() {
  return (
    <div className="py-5 md:py-7 border-b animate-pulse" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 w-16 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div className="h-3 w-24 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="h-5 w-3/4 rounded-sm mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <div className="space-y-1.5 mb-3">
            <div className="h-3 w-full rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
            <div className="h-3 w-4/5 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-16 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
            <div className="h-3 w-12 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'newest',   label: 'Новые',       icon: 'CalendarDays' },
  { key: 'oldest',   label: 'Старые',      icon: 'History' },
  { key: 'popular',  label: 'Популярные',  icon: 'TrendingUp' },
  { key: 'shortest', label: 'Короткие',    icon: 'Zap' },
  { key: 'longest',  label: 'Длинные',     icon: 'BookText' },
]

export default function Catalog() {
  const [activeGenre, setActiveGenre] = useState('Все')
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [showSearch, setShowSearch] = useState(false)
  const navigate = useNavigate()
  const currentUser = getCachedUser()

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => { setStories(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = activeGenre === 'Все' ? stories : stories.filter(s => s.genre === activeGenre)

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.author_name.toLowerCase().includes(q) ||
        s.text.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      if (sort === 'newest')   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest')   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'popular')  return b.views - a.views
      if (sort === 'shortest') return wordCount(a.text) - wordCount(b.text)
      if (sort === 'longest')  return wordCount(b.text) - wordCount(a.text)
      return 0
    })
  }, [stories, activeGenre, query, sort])

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
          <button onClick={() => navigate('/about')} className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
            <Icon name="Info" size={16} />
            <span className="hidden sm:inline">О проекте</span>
          </button>
          <button onClick={() => navigate('/submit')} className="flex items-center gap-1.5 text-[#8B0000] hover:text-red-400 transition-colors text-sm">
            <Icon name="PenLine" size={16} />
            <span className="hidden sm:inline">Предложить</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-12 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 md:mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-5xl text-white mb-2" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Каталог историй
              </h1>
              <p className="text-white/40 text-sm">
                {loading
                  ? 'Загрузка...'
                  : query
                    ? `${filtered.length} из ${stories.length} · По запросу «${query}»`
                    : `${stories.length} ${stories.length === 1 ? 'история' : 'историй'} · Только проверенные`
                }
              </p>
            </div>
            <button
              onClick={() => { setShowSearch(s => !s); if (showSearch) setQuery('') }}
              className="flex items-center gap-1.5 mt-1 transition-colors text-sm flex-shrink-0"
              style={{ color: showSearch ? '#8B0000' : 'rgba(255,255,255,0.35)' }}
            >
              <Icon name={showSearch ? 'X' : 'Search'} size={16} />
              <span className="hidden sm:inline">{showSearch ? 'Закрыть' : 'Поиск'}</span>
            </button>
          </div>

          {/* Строка поиска */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Поиск по названию, автору или тексту..."
                  className="w-full bg-transparent border-b text-white text-sm py-2 outline-none placeholder:text-white/20 transition-colors"
                  style={{ borderColor: query ? '#8B0000' : 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Жанры + сортировка */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-8 md:mb-10 space-y-3">
          <div className="flex flex-wrap gap-2">
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
          </div>

          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs transition-all duration-200 rounded-sm"
                style={{
                  backgroundColor: sort === opt.key ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: sort === opt.key ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                  border: sort === opt.key ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                }}
              >
                <Icon name={opt.icon} size={11} />
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Скелетоны загрузки */}
        {loading && (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => <StorySkeleton key={i} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <Icon name="SearchX" size={28} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/30 text-sm">
              {query ? `Ничего не найдено по запросу «${query}»` : stories.length === 0 ? 'Пока нет опубликованных историй' : 'В этом жанре пока нет историй'}
            </p>
            {query && (
              <button onClick={() => setQuery('')} className="mt-3 text-xs text-[#8B0000] hover:text-red-400 transition-colors">
                Сбросить поиск
              </button>
            )}
          </motion.div>
        )}

        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filtered.map((story, index) => (
              <motion.div
                key={story.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: loading ? 0 : index * 0.04 }}
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
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
