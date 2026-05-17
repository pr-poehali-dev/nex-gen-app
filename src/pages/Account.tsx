import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { fetchMe, logout, getSessionId, AUTH_URL, User, getCachedUser } from '@/lib/auth'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'
import { getLevelByReads } from '@/lib/levels'

const STORIES_API = 'https://functions.poehali.dev/e26b6cce-8804-469e-a6e7-57e201e0f4ab'

interface BookmarkedStory {
  id: number; title: string; author_name: string; genre: string
  text: string; created_at: string; views: number
}
interface LeaderboardEntry {
  author_name: string; stories_count: number; total_views: number; total_likes: number
}

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  user:      { label: 'Читатель',      color: '#3b82f6' },
  moderator: { label: 'Модератор',     color: '#d97706' },
  admin:     { label: 'Администратор', color: '#7c3aed' },
}

const GENRES = ['Хоррор', 'Мистика', 'Психологический триллер', 'Крипипаста']

interface FullUser extends User {
  bio: string
  favorite_genre: string
  created_at: string
  stories_read: number
  comments_count: number
  avatar_url: string
  name_prefix: string
  name_color: string
  name_effect: string
  badge_text: string
  badge_effect: string
  custom_role: string
  hide_role: boolean
}

function joinDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

export default function Account() {
  const navigate = useNavigate()
  const sid = getSessionId()
  const [user, setUser] = useState<FullUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [favGenre, setFavGenre] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'bookmarks' | 'leaderboard'>('profile')
  const [bookmarks, setBookmarks] = useState<BookmarkedStory[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  const loadBookmarks = async () => {
    setBookmarksLoading(true)
    const res = await fetch(`${STORIES_API}?bookmarks=1`, { headers: { 'X-Session-Id': sid } })
    if (res.ok) { const d = await res.json(); setBookmarks(Array.isArray(d) ? d : []) }
    setBookmarksLoading(false)
  }

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true)
    const res = await fetch(`${STORIES_API}?leaderboard=1`)
    if (res.ok) { const d = await res.json(); setLeaderboard(Array.isArray(d) ? d : []) }
    setLeaderboardLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'bookmarks' && bookmarks.length === 0) loadBookmarks()
    if (activeTab === 'leaderboard' && leaderboard.length === 0) loadLeaderboard()
  }, [activeTab])

  useEffect(() => {
    const cached = getCachedUser()
    if (cached) {
      setUser(cached as FullUser)
      setBio((cached as FullUser).bio || '')
      setFavGenre((cached as FullUser).favorite_genre || '')
      setLoading(false)
    }
    fetchMe().then(u => {
      if (!u) { if (!cached) navigate('/login'); return }
      setUser(u as FullUser)
      setBio((u as FullUser).bio || '')
      setFavGenre((u as FullUser).favorite_genre || '')
      setLoading(false)
    })
  }, [navigate])

  const handleLogout = async () => { await logout(); navigate('/') }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Файл слишком большой (макс. 2MB)'); return }
    setAvatarUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const b64 = (reader.result as string).split(',')[1]
      const res = await fetch(`${AUTH_URL}?action=upload_avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
        body: JSON.stringify({ image: b64, mime: file.type }),
      })
      const data = await res.json()
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (parsed.avatar_url) setUser(prev => prev ? { ...prev, avatar_url: parsed.avatar_url } : prev)
      setAvatarUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setSaving(true)
    await fetch(`${AUTH_URL}?action=update_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
      body: JSON.stringify({ bio, favorite_genre: favGenre }),
    })
    setUser(prev => prev ? { ...prev, bio, favorite_genre: favGenre } : prev)
    setSaving(false)
    setEditing(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Icon name="Loader" size={18} className="text-zinc-300 animate-spin" />
    </div>
  )
  if (!user) return null

  const baseBadge = ROLE_BADGE[user.role] || ROLE_BADGE.user
  const badge = { label: user.custom_role || baseBadge.label, color: baseBadge.color }
  const inputClass = "w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-zinc-300 resize-none"

  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      <header className="sticky top-0 z-20 flex items-center justify-between px-5 md:px-12 py-3.5 border-b border-zinc-100 bg-white/95 backdrop-blur-sm">
        <button onClick={() => navigate('/catalog')} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm">
          <Icon name="ArrowLeft" size={15} /> Каталог
        </button>
        <button onClick={() => navigate('/')} className="text-zinc-900 text-base md:text-lg font-bold tracking-tight hover:text-blue-700 transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
          ShadowTales
        </button>
        <button onClick={() => navigate(`/u/${user.username}`)} className="text-zinc-400 hover:text-zinc-600 transition-colors text-xs flex items-center gap-1">
          <Icon name="ExternalLink" size={13} /> Профиль
        </button>
      </header>

      <main className="max-w-lg mx-auto px-5 md:px-8 py-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="flex flex-col sm:flex-row items-start gap-5 mb-8 pb-8 border-b border-zinc-100">
            <label className="relative w-14 h-14 rounded-xl flex-shrink-0 cursor-pointer group overflow-hidden border-2 border-zinc-100 hover:border-blue-200 transition-colors">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-blue-50 text-blue-600" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {user.username[0].toUpperCase()}
                  </div>
              }
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                {avatarUploading
                  ? <Icon name="Loader" size={16} className="text-white animate-spin" />
                  : <Icon name="Camera" size={16} className="text-white" />
                }
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
            <div>
              <h1 className="text-xl md:text-2xl text-zinc-900 font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{user.username}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {!user.hide_role && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${badge.color}18`, color: badge.color }}>
                    {badge.label}
                  </span>
                )}
                {user.badge_text && <UserBadge text={user.badge_text} effect={user.badge_effect} />}
                <span className="text-zinc-300 text-xs">с {joinDate(user.created_at)}</span>
              </div>
              <p className="text-zinc-300 text-xs mt-1">Нажми на фото, чтобы изменить</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="border border-zinc-100 rounded-xl px-4 py-4 bg-white">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Прочитано</p>
              <p className="text-zinc-900 text-2xl md:text-3xl font-light">{user.stories_read ?? 0}</p>
              <p className="text-zinc-300 text-xs mt-1">историй</p>
            </div>
            <div className="border border-zinc-100 rounded-xl px-4 py-4 bg-white">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Комментарии</p>
              <p className="text-zinc-900 text-2xl md:text-3xl font-light">{user.comments_count ?? 0}</p>
              <p className="text-zinc-300 text-xs mt-1">оставлено</p>
            </div>
          </div>

          {editing ? (
            <div className="border border-zinc-100 rounded-xl p-5 mb-6 space-y-5 bg-white">
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2">О себе</label>
                <textarea className={inputClass} rows={3} placeholder="Пара слов о себе..." value={bio} onChange={e => setBio(e.target.value)} maxLength={300} />
                <p className="text-zinc-300 text-xs mt-1 text-right">{bio.length}/300</p>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-3">Любимый жанр</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button key={g} type="button" onClick={() => setFavGenre(favGenre === g ? '' : g)}
                      className="px-3 py-1.5 text-xs border rounded-full transition-all"
                      style={{
                        backgroundColor: favGenre === g ? '#1d4ed8' : 'transparent',
                        borderColor: favGenre === g ? '#1d4ed8' : '#e4e4e7',
                        color: favGenre === g ? '#fff' : '#71717a'
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={saveProfile} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                  {saving ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Сохранить
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-zinc-100 rounded-xl p-5 mb-6 bg-white">
              {user.bio
                ? <p className="text-zinc-600 text-sm leading-6 mb-3">{user.bio}</p>
                : <p className="text-zinc-300 text-sm italic mb-3">Описание не заполнено</p>
              }
              {user.favorite_genre && (
                <p className="text-zinc-400 text-xs mb-3">Любимый жанр: <span className="text-zinc-600">{user.favorite_genre}</span></p>
              )}
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-zinc-300 hover:text-blue-500 transition-colors text-xs">
                <Icon name="Pencil" size={12} /> Редактировать
              </button>
            </div>
          )}

          <div className="flex border-b border-zinc-100 mb-6">
            {([
              { id: 'profile', label: 'Профиль', icon: 'User' },
              { id: 'bookmarks', label: 'Закладки', icon: 'Bookmark' },
              { id: 'leaderboard', label: 'Рейтинг', icon: 'TrendingUp' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs border-b-2 -mb-px transition-all whitespace-nowrap"
                style={{
                  borderColor: activeTab === t.id ? '#2563eb' : 'transparent',
                  color: activeTab === t.id ? '#2563eb' : '#a1a1aa'
                }}>
                <Icon name={t.icon} size={12} /> {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {user.role === 'user' && (
                  <div className="border border-zinc-100 rounded-xl px-5 py-4 mb-6 flex items-center gap-4 bg-white">
                    <div className="flex-1">
                      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Твой уровень</p>
                      <UserName username={user.username} stories_read={user.stories_read} className="text-base" />
                      <p className="text-zinc-300 text-xs mt-1">{getLevelByReads(user.stories_read).title} · {user.stories_read} историй прочитано</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {(user.role === 'admin' || user.role === 'moderator') && (
                    <button onClick={() => navigate('/admin')}
                      className="w-full flex items-center justify-between px-4 py-3 border border-zinc-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all text-sm bg-white">
                      <span className="flex items-center gap-3 text-zinc-600"><Icon name="Shield" size={15} className="text-blue-500" /> Панель модерации</span>
                      <Icon name="ChevronRight" size={15} className="text-zinc-300" />
                    </button>
                  )}
                  <button onClick={() => navigate('/submit')}
                    className="w-full flex items-center justify-between px-4 py-3 border border-zinc-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all text-sm bg-white">
                    <span className="flex items-center gap-3 text-zinc-600"><Icon name="PenLine" size={15} className="text-blue-500" /> Предложить историю</span>
                    <Icon name="ChevronRight" size={15} className="text-zinc-300" />
                  </button>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-red-100 rounded-xl text-sm mt-4 text-red-400 hover:bg-red-50 transition-colors bg-white">
                    <Icon name="LogOut" size={15} /> Выйти из аккаунта
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookmarks' && (
              <motion.div key="bookmarks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {bookmarksLoading && <div className="py-10 flex justify-center"><Icon name="Loader" size={18} className="text-zinc-300 animate-spin" /></div>}
                {!bookmarksLoading && bookmarks.length === 0 && (
                  <div className="py-10 text-center">
                    <Icon name="BookmarkX" size={24} className="mx-auto mb-3 text-zinc-200" />
                    <p className="text-zinc-400 text-sm">Закладок пока нет</p>
                    <button onClick={() => navigate('/catalog')} className="mt-3 text-xs text-blue-500 hover:text-blue-700 transition-colors">Перейти в каталог</button>
                  </div>
                )}
                <div className="space-y-2">
                  {bookmarks.map(s => (
                    <button key={s.id} onClick={() => navigate(`/story/${s.id}`)}
                      className="w-full text-left p-4 border border-zinc-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group bg-white">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] px-2 py-0.5 border border-blue-200 rounded-full text-blue-600 bg-blue-50">{s.genre}</span>
                      </div>
                      <p className="text-zinc-800 text-sm group-hover:text-blue-700 transition-colors mb-1 truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{s.title}</p>
                      <p className="text-zinc-400 text-xs">{s.author_name}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {leaderboardLoading && <div className="py-10 flex justify-center"><Icon name="Loader" size={18} className="text-zinc-300 animate-spin" /></div>}
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div key={entry.author_name} className="flex items-center gap-4 px-4 py-3 border border-zinc-100 rounded-xl bg-white">
                      <span className="text-sm w-5 text-right flex-shrink-0 font-medium"
                        style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#d1d5db' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-700 text-sm truncate font-medium">{entry.author_name}</p>
                        <p className="text-zinc-400 text-xs">{entry.stories_count} {entry.stories_count === 1 ? 'история' : 'историй'}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-300 flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Icon name="Heart" size={11} className={entry.total_likes > 0 ? 'text-rose-400' : ''} />
                          {entry.total_likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Eye" size={11} />{entry.total_views}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </main>
    </div>
  )
}