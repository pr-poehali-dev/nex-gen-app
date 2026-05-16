import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { getCachedUser, getSessionId } from '@/lib/auth'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'

const API_URL = 'https://functions.poehali.dev/e26b6cce-8804-469e-a6e7-57e201e0f4ab'

interface Story {
  id: number; title: string; author_name: string
  genre: string; text: string; created_at: string
}

interface Comment {
  id: number; user_id: number; username: string
  role: string; text: string; created_at: string; avatar_url: string
  name_prefix?: string; name_color?: string; name_effect?: string
  badge_text?: string; badge_effect?: string
}

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin:     { label: 'Администратор', color: '#8B0000' },
  moderator: { label: 'Модератор',     color: '#b8860b' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function readTime(text: string) {
  return `${Math.max(1, Math.round(text.split(/\s+/).length / 200))} мин`
}

export default function Story() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = getCachedUser()
  const sid = getSessionId()
  const canComment = !!currentUser

  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}?id=${id}`)
      .then(r => { if (r.status === 404) { setNotFound(true); setLoading(false); return null }; return r.json() })
      .then(data => { if (data) { setStory(data); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })

    fetch(`${API_URL}?comments=${id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setComments(data) })
      .catch(() => {})
  }, [id])

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true); setCommentError('')
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
      body: JSON.stringify({ story_id: Number(id), text: commentText.trim() }),
    })
    const data = await res.json()
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (res.ok) { setComments(prev => [...prev, parsed]); setCommentText('') }
    else setCommentError(parsed.error || 'Ошибка')
    setCommentLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <Icon name="Loader" size={16} className="text-white/30 animate-spin" />
    </div>
  )

  if (notFound || !story) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <div className="text-center">
        <p className="text-white/40 mb-4">История не найдена</p>
        <button onClick={() => navigate('/catalog')} className="text-[#8B0000] hover:text-red-400 transition-colors text-sm">← Вернуться в каталог</button>
      </div>
    </div>
  )

  const paragraphs = story.text.split('\n\n').filter(Boolean)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.2) 0%, transparent 60%)' }} />

      <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate('/catalog')} className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          <span className="hidden sm:inline">Каталог</span>
        </button>
        <button onClick={() => navigate('/')} className="text-white text-base md:text-lg font-bold tracking-wider hover:text-red-400 transition-colors" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <div className="w-10 md:w-24" />
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-14">
        {/* Мета */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-0.5 border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>{story.genre}</span>
            <span className="text-white/25 text-xs">{formatDate(story.created_at)}</span>
          </div>
          <h1 className="text-2xl md:text-5xl text-white leading-tight mb-5" style={{ fontFamily: "'Cinzel Decorative', serif" }}>{story.title}</h1>
          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-white/30 text-xs md:text-sm pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="flex items-center gap-1.5"><Icon name="User" size={13} />{story.author_name}</span>
            <span className="flex items-center gap-1.5"><Icon name="Clock" size={13} />{readTime(story.text)}</span>
          </div>
        </motion.div>

        {/* Текст */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="space-y-5">
          {paragraphs.map((para, i) => (
            <p key={i} className="leading-7 md:leading-8 text-sm md:text-lg break-words" style={{ color: i === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)' }}>
              {para}
            </p>
          ))}
        </motion.div>

        {/* Навигация */}
        <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => navigate('/catalog')} className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
            <Icon name="ArrowLeft" size={16} /> Истории
          </button>
          <button onClick={() => navigate('/submit')} className="flex items-center gap-1.5 text-[#8B0000] hover:text-red-400 transition-colors text-sm">
            <Icon name="PenLine" size={16} />
            <span className="hidden sm:inline">Предложить свою</span>
            <span className="sm:hidden">Предложить</span>
          </button>
        </div>

        {/* Комментарии */}
        <div className="mt-16">
          <h2 className="text-white/60 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <Icon name="MessageSquare" size={13} />
            Комментарии
            {comments.length > 0 && <span className="text-white/25">· {comments.length}</span>}
          </h2>

          {/* Список */}
          {comments.length === 0 && !canComment && (
            <p className="text-white/20 text-sm">
              <button onClick={() => navigate('/login')} className="text-[#8B0000] hover:text-red-400 transition-colors">Войди</button>, чтобы оставить комментарий.
            </p>
          )}

          <div className="space-y-5 mb-8">
            {comments.map(c => {
              const badge = ROLE_BADGE[c.role]
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                  <button onClick={() => navigate(`/u/${c.username}`)} className="w-7 h-7 rounded-sm flex-shrink-0 mt-0.5 overflow-hidden hover:opacity-70 transition-opacity" style={{ border: `1px solid ${badge?.color || '#333'}44` }}>
                    {c.avatar_url
                      ? <img src={c.avatar_url} alt={c.username} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${badge?.color || '#333'}22`, color: badge?.color || '#666', fontFamily: "'Cinzel Decorative', serif" }}>
                          {c.username[0].toUpperCase()}
                        </div>
                    }
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <UserName
                        username={c.username}
                        name_prefix={c.name_prefix}
                        name_color={c.name_color}
                        name_effect={c.name_effect}
                        className="text-sm"
                        onClick={() => navigate(`/u/${c.username}`)}
                      />
                      {badge && <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${badge.color}22`, color: badge.color }}>{badge.label}</span>}
                      {c.badge_text && <UserBadge text={c.badge_text} effect={c.badge_effect} />}
                      <span className="text-white/20 text-xs">{formatTime(c.created_at)}</span>
                    </div>
                    <p className="text-white/50 text-sm leading-6">{c.text}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Форма */}
          {canComment && (
            <form onSubmit={submitComment} className="border-t pt-6 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <textarea
                className="w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20 resize-none"
                rows={3}
                placeholder="Оставить комментарий..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                maxLength={1000}
              />
              {commentError && <p className="text-sm" style={{ color: '#cc3333' }}>{commentError}</p>}
              <div className="flex items-center justify-between">
                <span className="text-white/20 text-xs">{commentText.length}/1000</span>
                <button
                  type="submit"
                  disabled={commentLoading || !commentText.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs tracking-widest uppercase border rounded-sm transition-all"
                  style={{ borderColor: '#8B0000', color: '#8B0000', opacity: !commentText.trim() ? 0.4 : 1 }}
                >
                  {commentLoading ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Send" size={12} />}
                  Отправить
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}