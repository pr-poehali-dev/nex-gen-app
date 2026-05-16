import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL } from '@/lib/auth'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  user:      { label: 'Читатель',      color: '#555' },
  moderator: { label: 'Модератор',     color: '#b8860b' },
  admin:     { label: 'Администратор', color: '#8B0000' },
}

const GENRES: Record<string, string> = {
  'Хоррор': '🩸',
  'Мистика': '👁',
  'Психологический триллер': '🕷',
  'Крипипаста': '📡',
}

interface ProfileData {
  id: number
  username: string
  role: string
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

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${AUTH_URL}?action=profile&username=${username}`)
      .then(r => { if (r.status === 404) { setNotFound(true); setLoading(false); return null }; return r.json() })
      .then(data => { if (data) { const p = typeof data === 'string' ? JSON.parse(data) : data; setProfile(p); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [username])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <Icon name="Loader" size={16} className="text-white/20 animate-spin" />
    </div>
  )

  if (notFound || !profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <div className="text-center">
        <p className="text-white/30 mb-4 text-sm">Пользователь не найден</p>
        <button onClick={() => navigate('/catalog')} className="text-[#8B0000] hover:text-red-400 transition-colors text-sm">← Каталог</button>
      </div>
    </div>
  )

  const badge = ROLE_BADGE[profile.role] || ROLE_BADGE.user
  const genreIcon = GENRES[profile.favorite_genre] || null

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.15) 0%, transparent 60%)' }} />
      <div className="absolute left-0 top-0 h-full w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,0,0,0.2), transparent)' }} />

      <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} /> <span className="hidden sm:inline">Назад</span>
        </button>
        <button onClick={() => navigate('/')} className="text-white text-base md:text-lg font-bold tracking-wider hover:text-red-400 transition-colors" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <div className="w-20" />
      </header>

      <main className="max-w-lg mx-auto px-6 md:px-8 py-14">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          {/* Шапка профиля */}
          <div className="flex flex-col sm:flex-row items-start gap-5 mb-10 pb-10 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-sm flex-shrink-0 overflow-hidden" style={{ border: `1px solid ${badge.color}44` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: `${badge.color}18`, fontFamily: "'Cinzel Decorative', serif", color: badge.color }}>
                    {profile.username[0].toUpperCase()}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <UserName
                username={profile.username}
                stories_read={profile.stories_read}
                name_prefix={profile.name_prefix}
                name_color={profile.name_color}
                name_effect={profile.name_effect}
                className="text-xl md:text-2xl mb-1.5 block"
                style={{ fontFamily: "'Cinzel Decorative', serif" } as React.CSSProperties}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${badge.color}22`, color: badge.color }}>
                  {badge.label}
                </span>
                {profile.badge_text && <UserBadge text={profile.badge_text} effect={profile.badge_effect} />}
                <span className="text-white/20 text-xs">с {joinDate(profile.created_at)}</span>
              </div>
              {profile.bio && (
                <p className="text-white/40 text-sm mt-3 leading-6">{profile.bio}</p>
              )}

            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="border rounded-sm px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p className="text-white/25 text-xs uppercase tracking-wider mb-1">Прочитано</p>
              <p className="text-white text-xl md:text-2xl font-light">{profile.stories_read}</p>
              <p className="text-white/20 text-xs mt-0.5">историй</p>
            </div>
            <div className="border rounded-sm px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p className="text-white/25 text-xs uppercase tracking-wider mb-1">Комментарии</p>
              <p className="text-white text-xl md:text-2xl font-light">{profile.comments_count}</p>
              <p className="text-white/20 text-xs mt-0.5">оставлено</p>
            </div>
          </div>

          {/* Любимый жанр */}
          {profile.favorite_genre && (
            <div className="border rounded-sm px-5 py-4 flex items-center gap-4" style={{ borderColor: 'rgba(139,0,0,0.2)', backgroundColor: 'rgba(139,0,0,0.05)' }}>
              <div className="text-2xl">{genreIcon}</div>
              <div>
                <p className="text-white/25 text-xs uppercase tracking-wider mb-0.5">Любимый жанр</p>
                <p className="text-white/70 text-sm">{profile.favorite_genre}</p>
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  )
}