import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { getCachedUser } from '@/lib/auth'

const GENRES = ['Все', 'Хоррор', 'Мистика', 'Психологический триллер', 'Крипипаста']
const API_URL = 'https://functions.poehali.dev/e26b6cce-8804-469e-a6e7-57e201e0f4ab'

type SortKey = 'newest' | 'oldest' | 'popular' | 'liked' | 'shortest' | 'longest'

interface Story {
  id: number
  title: string
  author_name: string
  genre: string
  text: string
  created_at: string
  views: number
  likes: number
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
    <div className="py-6 border-b border-zinc-100 animate-pulse">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 w-16 rounded bg-zinc-100" />
            <div className="h-3 w-24 rounded bg-zinc-100" />
          </div>
          <div className="h-5 w-3/4 rounded bg-zinc-100 mb-3" />
          <div className="space-y-1.5 mb-3">
            <div className="h-3 w-full rounded bg-zinc-100" />
            <div className="h-3 w-4/5 rounded bg-zinc-100" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-16 rounded bg-zinc-100" />
            <div className="h-3 w-12 rounded bg-zinc-100" />
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
  { key: 'liked',    label: 'Любимые',     icon: 'Heart' },
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
      if (sort === 'liked')    return (b.likes || 0) - (a.likes || 0)
      if (sort === 'shortest') return wordCount(a.text) - wordCount(b.text)
      if (sort === 'longest')  return wordCount(b.text) - wordCount(a.text)
      return 0
    })
  }, [stories, activeGenre, query, sort])

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      <header className="sticky top-0 z-20 flex items-center justify-between px-5 md:px-12 py-3.5 border-b border-zinc-100 bg-white/95 backdrop-blur-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm">
          <Icon name="ArrowLeft" size={15} />
          <span className="hidden sm:inline">Назад</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-zinc-900 text-base md:text-lg font-bold tracking-tight hover:text-blue-700 transition-colors duration-200"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          ShadowTales
        </button>
        <div className="flex items-center gap-3 md:gap-5">
          {currentUser ? (
            <button onClick={() => navigate('/account')} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm">
              <Icon name="CircleUser" size={15} />
              <span className="hidden sm:inline max-w-[80px] truncate">{currentUser.username}</span>
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm">
              <Icon name="LogIn" size={15} />
              <span className="hidden sm:inline">Войти</span>
            </button>
          )}
          <button onClick={() => navigate('/about')} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm">
            <Icon name="Info" size={15} />
            <span className="hidden sm:inline">О проекте</span>
          </button>
          <button onClick={() => navigate('/submit')} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">
            <Icon name="PenLine" size={15} />
            <span className="hidden sm:inline">Предложить</span>
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 md:px-12 pt-5">
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm bg-amber-50 border-amber-200 text-amber-800">
          <Icon name="AlertTriangle" size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <span>Мы испытываем технические трудности на стороне площадки. Работаем над устранением. Приносим извинения за неудобства.</span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-5 md:px-12 py-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 md:mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl text-zinc-900 mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                Каталог историй
              </h1>
              <p className="text-zinc-400 text-sm">
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
              style={{ color: showSearch ? '#2563eb' : '#a1a1aa' }}
            >
              <Icon name={showSearch ? 'X' : 'Search'} size={15} />
              <span className="hidden sm:inline">{showSearch ? 'Закрыть' : 'Поиск'}</span>
            </button>
          </div>

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
                  className="w-full border-b text-zinc-800 text-sm py-2 outline-none placeholder:text-zinc-300 transition-colors bg-transparent"
                  style={{ borderColor: query ? '#2563eb' : '#e4e4e7' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }} className="mb-8 md:mb-10 space-y-3">
          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className="px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm transition-all duration-200 border rounded-full"
                style={{
                  backgroundColor: activeGenre === genre ? '#1d4ed8' : 'transparent',
                  borderColor: activeGenre === genre ? '#1d4ed8' : '#e4e4e7',
                  color: activeGenre === genre ? '#fff' : '#71717a',
                }}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs transition-all duration-200 rounded-full border"
                style={{
                  backgroundColor: sort === opt.key ? '#eff6ff' : 'transparent',
                  color: sort === opt.key ? '#1d4ed8' : '#a1a1aa',
                  borderColor: sort === opt.key ? '#bfdbfe' : 'transparent',
                }}
              >
                <Icon name={opt.icon} size={11} />
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {loading && (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => <StorySkeleton key={i} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <Icon name="SearchX" size={28} className="mx-auto mb-3 text-zinc-200" />
            <p className="text-zinc-400 text-sm">
              {query ? `Ничего не найдено по запросу «${query}»` : stories.length === 0 ? 'Пока нет опубликованных историй' : 'В этом жанре пока нет историй'}
            </p>
            {query && (
              <button onClick={() => setQuery('')} className="mt-3 text-xs text-blue-600 hover:text-blue-800 transition-colors">
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: loading ? 0 : index * 0.04 }}
                onClick={() => navigate(`/story/${story.id}`)}
                className="group py-6 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50/60 -mx-3 px-3 rounded-lg transition-colors duration-150"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-xs px-2 py-0.5 border rounded-full border-blue-200 text-blue-600 bg-blue-50">
                        {story.genre}
                      </span>
                      <span className="text-zinc-300 text-xs">{formatDate(story.created_at)}</span>
                    </div>
                    <h2
                      className="text-zinc-900 text-base md:text-xl mb-2 group-hover:text-blue-700 transition-colors duration-200"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {story.title}
                    </h2>
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 mb-3">
                      {excerpt(story.text)}
                    </p>
                    <div className="flex items-center gap-4 text-zinc-300 text-xs">
                      <span className="text-zinc-500">{story.author_name}</span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={11} />
                        {readTime(story.text)}
                      </span>
                      {story.views > 0 && (
                        <span className="flex items-center gap-1">
                          <Icon name="Eye" size={11} />
                          {story.views.toLocaleString('ru-RU')}
                        </span>
                      )}
                      {(story.likes || 0) > 0 && (
                        <span className="flex items-center gap-1 text-rose-400">
                          <Icon name="Heart" size={11} />
                          {story.likes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="ChevronRight" size={18} className="text-blue-400" />
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
