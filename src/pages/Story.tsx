import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'

const API_URL = 'https://functions.poehali.dev/e26b6cce-8804-469e-a6e7-57e201e0f4ab'

interface Story {
  id: number
  title: string
  author_name: string
  genre: string
  text: string
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readTime(text: string) {
  const words = text.split(/\s+/).length
  return `${Math.max(1, Math.round(words / 200))} мин`
}

export default function Story() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}?id=${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => { if (data) { setStory(data); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
        <div className="flex items-center gap-3 text-white/30 text-sm">
          <Icon name="Loader" size={16} className="animate-spin" />
          Загрузка...
        </div>
      </div>
    )
  }

  if (notFound || !story) {
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs px-2 py-0.5 border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
              {story.genre}
            </span>
            <span className="text-white/25 text-xs">{formatDate(story.created_at)}</span>
          </div>

          <h1 className="text-3xl md:text-5xl text-white leading-tight mb-6" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            {story.title}
          </h1>

          <div className="flex items-center gap-5 text-white/30 text-sm pb-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="flex items-center gap-1.5">
              <Icon name="User" size={14} />
              {story.author_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Clock" size={14} />
              {readTime(story.text)}
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="space-y-6">
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
