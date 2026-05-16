import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { fetchMe, logout, getSessionId, AUTH_URL, User } from '@/lib/auth'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'
import { getLevelByReads } from '@/lib/levels'

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  user:      { label: 'Читатель',      color: '#555' },
  moderator: { label: 'Модератор',     color: '#b8860b' },
  admin:     { label: 'Администратор', color: '#8B0000' },
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


  useEffect(() => {
    fetchMe().then(u => {
      if (!u) { navigate('/login'); return }
      fetch(`${AUTH_URL}?action=me`, { headers: { 'X-Session-Id': sid } })
        .then(r => r.json())
        .then(data => {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data
          setUser(parsed)
          setBio(parsed.bio || '')
          setFavGenre(parsed.favorite_genre || '')
          setLoading(false)
        })
    })
  }, [])

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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <Icon name="Loader" size={18} className="text-white/20 animate-spin" />
    </div>
  )
  if (!user) return null

  const badge = ROLE_BADGE[user.role] || ROLE_BADGE.user
  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20 resize-none"

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.15) 0%, transparent 60%)' }} />
      <div className="absolute left-0 top-0 h-full w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,0,0,0.2), transparent)' }} />

      <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate('/catalog')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} /> Каталог
        </button>
        <button onClick={() => navigate('/')} className="text-white text-base md:text-lg font-bold tracking-wider hover:text-red-400 transition-colors" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <button onClick={() => navigate(`/u/${user.username}`)} className="text-white/25 hover:text-white/60 transition-colors text-xs flex items-center gap-1">
          <Icon name="ExternalLink" size={13} /> Профиль
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 md:px-8 py-14">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          {/* Шапка */}
          <div className="flex flex-col sm:flex-row items-start gap-5 mb-8 pb-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {/* Аватар с загрузкой */}
            <label className="relative w-12 h-12 md:w-14 md:h-14 rounded-sm flex-shrink-0 cursor-pointer group overflow-hidden" style={{ border: `1px solid ${badge.color}44` }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: `${badge.color}18`, fontFamily: "'Cinzel Decorative', serif", color: badge.color }}>
                    {user.username[0].toUpperCase()}
                  </div>
              }
              {/* Оверлей при наведении */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
                {avatarUploading
                  ? <Icon name="Loader" size={16} className="text-white animate-spin" />
                  : <Icon name="Camera" size={16} className="text-white" />
                }
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
            <div>
              <h1 className="text-xl md:text-2xl text-white" style={{ fontFamily: "'Cinzel Decorative', serif" }}>{user.username}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${badge.color}22`, color: badge.color }}>{badge.label}</span>
                {user.badge_text && <UserBadge text={user.badge_text} effect={user.badge_effect} />}
                <span className="text-white/20 text-xs">с {joinDate(user.created_at)}</span>
              </div>
              <p className="text-white/15 text-xs mt-1.5">Нажми на фото чтобы изменить</p>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="border rounded-sm px-3 py-3 md:px-4 md:py-4" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p className="text-white/25 text-xs uppercase tracking-wider mb-2">Прочитано</p>
              <p className="text-white text-2xl md:text-3xl font-light">{user.stories_read ?? 0}</p>
              <p className="text-white/20 text-xs mt-1">историй</p>
            </div>
            <div className="border rounded-sm px-3 py-3 md:px-4 md:py-4" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p className="text-white/25 text-xs uppercase tracking-wider mb-2">Комментарии</p>
              <p className="text-white text-2xl md:text-3xl font-light">{user.comments_count ?? 0}</p>
              <p className="text-white/20 text-xs mt-1">оставлено</p>
            </div>
          </div>

          {/* Профиль */}
          {editing ? (
            <div className="border rounded-sm p-5 mb-6 space-y-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div>
                <label className="block text-white/30 text-xs uppercase tracking-wider mb-2">О себе</label>
                <textarea className={inputClass} rows={3} placeholder="Пара слов о себе..." value={bio} onChange={e => setBio(e.target.value)} maxLength={300} />
                <p className="text-white/15 text-xs mt-1 text-right">{bio.length}/300</p>
              </div>
              <div>
                <label className="block text-white/30 text-xs uppercase tracking-wider mb-3">Любимый жанр</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button key={g} type="button" onClick={() => setFavGenre(favGenre === g ? '' : g)}
                      className="px-3 py-1.5 text-xs border rounded-sm transition-all"
                      style={{ backgroundColor: favGenre === g ? '#8B0000' : 'transparent', borderColor: favGenre === g ? '#8B0000' : 'rgba(255,255,255,0.1)', color: favGenre === g ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-xs border rounded-sm" style={{ borderColor: '#8B0000', backgroundColor: '#8B0000', color: '#fff' }}>
                  {saving ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Сохранить
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-xs border rounded-sm" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="border rounded-sm p-5 mb-6" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {user.bio
                ? <p className="text-white/50 text-sm leading-6 mb-3">{user.bio}</p>
                : <p className="text-white/20 text-sm italic mb-3">Описание не заполнено</p>
              }
              {user.favorite_genre && (
                <p className="text-white/30 text-xs mb-3">Любимый жанр: <span className="text-white/50">{user.favorite_genre}</span></p>
              )}
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors text-xs">
                <Icon name="Pencil" size={12} /> Редактировать
              </button>
            </div>
          )}

          {/* Уровень (для обычных пользователей) */}
          {user.role === 'user' && (
            <div className="border rounded-sm px-5 py-4 mb-6 flex items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div className="flex-1">
                <p className="text-white/25 text-xs uppercase tracking-wider mb-1">Твой уровень</p>
                <UserName username={user.username} stories_read={user.stories_read} className="text-base" />
                <p className="text-white/20 text-xs mt-1">{getLevelByReads(user.stories_read).title} · {user.stories_read} историй прочитано</p>
              </div>
            </div>
          )}


          {/* Действия */}
          <div className="space-y-2">
            {(user.role === 'admin' || user.role === 'moderator') && (
              <button onClick={() => navigate('/admin')} className="w-full flex items-center justify-between px-4 py-3 border rounded-sm transition-all hover:border-white/20 text-sm" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                <span className="flex items-center gap-3"><Icon name="Shield" size={15} className="text-[#8B0000]" /> Панель модерации</span>
                <Icon name="ChevronRight" size={15} className="text-white/20" />
              </button>
            )}
            <button onClick={() => navigate('/submit')} className="w-full flex items-center justify-between px-4 py-3 border rounded-sm transition-all hover:border-white/20 text-sm" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <span className="flex items-center gap-3"><Icon name="PenLine" size={15} className="text-[#8B0000]" /> Предложить историю</span>
              <Icon name="ChevronRight" size={15} className="text-white/20" />
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 border rounded-sm transition-all text-sm mt-4" style={{ borderColor: 'rgba(139,0,0,0.2)', color: 'rgba(139,0,0,0.6)' }}>
              <Icon name="LogOut" size={15} /> Выйти из аккаунта
            </button>
          </div>

        </motion.div>
      </main>
    </div>
  )
}