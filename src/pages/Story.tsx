import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { getCachedUser, getSessionId } from '@/lib/auth'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'

const API_URL = 'https://functions.poehali.dev/e26b6cce-8804-469e-a6e7-57e201e0f4ab'

interface StoryData {
  id: number; title: string; author_name: string
  genre: string; text: string; created_at: string
  likes_count: number; liked: boolean; bookmarked: boolean
}

interface Comment {
  id: number; user_id: number; username: string
  role: string; text: string; created_at: string; avatar_url: string
  name_prefix?: string; name_color?: string; name_effect?: string
  badge_text?: string; badge_effect?: string; custom_role?: string; hide_role?: boolean
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

function useReadingProgress() {
  const [progress, setProgress] = useState(0)
  const onScroll = useCallback(() => {
    const el = document.documentElement
    const scrollTop = el.scrollTop || document.body.scrollTop
    const scrollHeight = el.scrollHeight - el.clientHeight
    setProgress(scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0)
  }, [])
  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])
  return progress
}

export default function Story() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = getCachedUser()
  const sid = getSessionId()
  const progress = useReadingProgress()

  const [story, setStory] = useState<StoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)

  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [deletingComment, setDeletingComment] = useState<number | null>(null)
  const [reportingComment, setReportingComment] = useState<number | null>(null)
  const [reportedComments, setReportedComments] = useState<Set<number>>(new Set())
  const [related, setRelated] = useState<{ id: number; title: string; author_name: string; text: string; genre: string }[]>([])

  useEffect(() => {
    fetch(`${API_URL}?id=${id}`, { headers: sid ? { 'X-Session-Id': sid } : {} })
      .then(r => { if (r.status === 404) { setNotFound(true); setLoading(false); return null }; return r.json() })
      .then(data => {
        if (data) {
          setStory(data)
          setLiked(data.liked || false)
          setLikesCount(data.likes_count || 0)
          setBookmarked(data.bookmarked || false)
          setLoading(false)
          // Загружаем похожие только после получения жанра
          if (data.genre) {
            fetch(`${API_URL}?genre=${encodeURIComponent(data.genre)}`)
              .then(r => r.json())
              .then(list => {
                if (Array.isArray(list)) {
                  setRelated(list.filter((s: { id: number }) => String(s.id) !== String(id)))
                }
              })
              .catch(() => {})
          }
        }
      })
      .catch(() => { setNotFound(true); setLoading(false) })

    fetch(`${API_URL}?comments=${id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setComments(data) })
      .catch(() => {})
  }, [id])

  const handleLike = async () => {
    if (!currentUser) { navigate('/login'); return }
    setLikeLoading(true)
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
      body: JSON.stringify({ action: 'like', story_id: Number(id) }),
    })
    if (res.ok) {
      const data = await res.json()
      const d = typeof data === 'string' ? JSON.parse(data) : data
      setLiked(d.liked)
      setLikesCount(d.count)
    }
    setLikeLoading(false)
  }

  const handleBookmark = async () => {
    if (!currentUser) { navigate('/login'); return }
    setBookmarkLoading(true)
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
      body: JSON.stringify({ action: 'bookmark', story_id: Number(id) }),
    })
    if (res.ok) {
      const data = await res.json()
      const d = typeof data === 'string' ? JSON.parse(data) : data
      setBookmarked(d.bookmarked)
    }
    setBookmarkLoading(false)
  }

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

  const deleteComment = async (commentId: number) => {
    setDeletingComment(commentId)
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
      body: JSON.stringify({ action: 'delete_comment', comment_id: commentId }),
    })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
    setDeletingComment(null)
  }

  const reportComment = async (commentId: number) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
      body: JSON.stringify({ action: 'report_comment', comment_id: commentId }),
    })
    if (res.ok) {
      setReportedComments(prev => new Set(prev).add(commentId))
      setReportingComment(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.2) 0%, transparent 60%)' }} />
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="h-4 w-16 rounded-sm animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 w-28 rounded-sm animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 w-10 rounded-sm animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </header>
      <main className="max-w-2xl mx-auto px-4 md:px-8 py-10 md:py-16 animate-pulse">
        <div className="mb-10">
          <div className="flex gap-3 mb-4">
            <div className="h-4 w-16 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div className="h-4 w-24 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="h-8 w-3/4 rounded-sm mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <div className="h-6 w-1/2 rounded-sm mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <div className="flex gap-4">
            <div className="h-3 w-20 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
            <div className="h-3 w-12 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <div className="h-4 w-5/6 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
              <div className="h-4 w-4/5 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      </main>
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
      <Helmet>
        <title>{story.title} — ShadowTales</title>
        <meta name="description" content={story.text.slice(0, 160).trim()} />
        <meta property="og:title" content={`${story.title} — ShadowTales`} />
        <meta property="og:description" content={story.text.slice(0, 160).trim()} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${story.title} — ShadowTales`} />
        <meta name="twitter:description" content={story.text.slice(0, 160).trim()} />
      </Helmet>

      {/* Прогресс чтения */}
      <div className="fixed top-0 left-0 z-50 h-[2px] transition-all duration-75" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8B0000, #cc2222)' }} />

      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.2) 0%, transparent 60%)' }} />

      <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate('/catalog')} className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          <span className="hidden sm:inline">Каталог</span>
        </button>
        <button onClick={() => navigate('/')} className="text-white text-base md:text-lg font-bold tracking-wider hover:text-red-400 transition-colors" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <div className="flex items-center gap-3">
          {/* Лайк */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: liked ? '#8B0000' : 'rgba(255,255,255,0.3)' }}
            title={liked ? 'Убрать лайк' : 'Нравится'}
          >
            {likeLoading ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name={liked ? 'Heart' : 'Heart'} size={15} />}
            {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
          </button>
          {/* Закладка */}
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className="transition-colors"
            style={{ color: bookmarked ? '#8B0000' : 'rgba(255,255,255,0.3)' }}
            title={bookmarked ? 'Убрать из закладок' : 'В закладки'}
          >
            {bookmarkLoading ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name={bookmarked ? 'BookmarkCheck' : 'Bookmark'} size={15} />}
          </button>
        </div>
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
            {likesCount > 0 && <span className="flex items-center gap-1.5"><Icon name="Heart" size={13} style={{ color: '#8B0000' }} />{likesCount}</span>}
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
          <div className="flex items-center gap-4">
            <button
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: bookmarked ? '#8B0000' : 'rgba(255,255,255,0.3)' }}
            >
              <Icon name={bookmarked ? 'BookmarkCheck' : 'Bookmark'} size={15} />
              <span className="hidden sm:inline">{bookmarked ? 'В закладках' : 'В закладки'}</span>
            </button>
            <button onClick={() => navigate('/submit')} className="flex items-center gap-1.5 text-[#8B0000] hover:text-red-400 transition-colors text-sm">
              <Icon name="PenLine" size={16} />
              <span className="hidden sm:inline">Предложить свою</span>
              <span className="sm:hidden">Предложить</span>
            </button>
          </div>
        </div>

        {/* Комментарии */}
        <div className="mt-16">
          <h2 className="text-white/60 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <Icon name="MessageSquare" size={13} />
            Комментарии
            {comments.length > 0 && <span className="text-white/25">· {comments.length}</span>}
          </h2>

          {comments.length === 0 && !currentUser && (
            <p className="text-white/20 text-sm">
              <button onClick={() => navigate('/login')} className="text-[#8B0000] hover:text-red-400 transition-colors">Войди</button>, чтобы оставить комментарий.
            </p>
          )}

          <div className="space-y-5 mb-8">
            <AnimatePresence>
              {comments.map(c => {
                const baseBadge = ROLE_BADGE[c.role]
                const badge = baseBadge && c.custom_role ? { label: c.custom_role, color: baseBadge.color } : (c.custom_role ? { label: c.custom_role, color: '#666' } : baseBadge)
                const isOwn = currentUser?.id === c.user_id
                const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator'
                const alreadyReported = reportedComments.has(c.id)
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex gap-4 group">
                    <button onClick={() => navigate(`/u/${c.username}`)} className="w-7 h-7 rounded-sm flex-shrink-0 mt-0.5 overflow-hidden hover:opacity-70 transition-opacity" style={{ border: `1px solid ${badge?.color || '#333'}44` }}>
                      {c.avatar_url
                        ? <img src={c.avatar_url} alt={c.username} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${badge?.color || '#333'}22`, color: badge?.color || '#666', fontFamily: "'Cinzel Decorative', serif" }}>
                            {c.username[0].toUpperCase()}
                          </div>
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <UserName username={c.username} name_prefix={c.name_prefix} name_color={c.name_color} name_effect={c.name_effect} className="text-sm" onClick={() => navigate(`/u/${c.username}`)} />
                          {badge && !c.hide_role && <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${badge.color}22`, color: badge.color }}>{badge.label}</span>}
                          {c.badge_text && <UserBadge text={c.badge_text} effect={c.badge_effect} />}
                          <span className="text-white/20 text-xs">{formatTime(c.created_at)}</span>
                        </div>
                        {/* Действия с комментарием */}
                        {currentUser && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(isOwn || isStaff) && (
                              <button
                                onClick={() => deleteComment(c.id)}
                                disabled={deletingComment === c.id}
                                className="text-white/20 hover:text-red-500 transition-colors"
                                title="Удалить"
                              >
                                {deletingComment === c.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Trash2" size={12} />}
                              </button>
                            )}
                            {!isOwn && (
                              <button
                                onClick={() => alreadyReported ? null : reportComment(c.id)}
                                className="transition-colors"
                                style={{ color: alreadyReported ? '#8B0000' : 'rgba(255,255,255,0.2)' }}
                                title={alreadyReported ? 'Жалоба отправлена' : 'Пожаловаться'}
                              >
                                <Icon name={alreadyReported ? 'Flag' : 'Flag'} size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-white/50 text-sm leading-6">{c.text}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Форма */}
          {currentUser && (
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

        {/* Похожие истории */}
        {(() => {
          const sameGenre = related.filter(s => s.genre === story.genre).slice(0, 3)
          const fallback = sameGenre.length < 3
            ? related.filter(s => s.genre !== story.genre).slice(0, 3 - sameGenre.length)
            : []
          const suggestions = [...sameGenre, ...fallback]
          if (suggestions.length === 0) return null
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16 pt-10 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <p className="text-white/30 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <Icon name="BookOpen" size={12} />
                Читать дальше
              </p>
              <div className="flex flex-col gap-3">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { navigate(`/story/${s.id}`); window.scrollTo(0, 0) }}
                    className="group text-left py-4 border-b transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 border rounded-sm flex-shrink-0"
                            style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                            {s.genre}
                          </span>
                        </div>
                        <p className="text-white/70 group-hover:text-red-400 transition-colors text-sm truncate"
                          style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                          {s.title}
                        </p>
                        <p className="text-white/25 text-xs mt-0.5">{s.author_name}</p>
                      </div>
                      <Icon name="ChevronRight" size={16}
                        className="text-white/15 group-hover:text-[#8B0000] transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )
        })()}
      </main>
    </div>
  )
}