import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL } from '@/lib/auth'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  user:      { label: 'Читатель',      color: '#3b82f6' },
  moderator: { label: 'Модератор',     color: '#d97706' },
  admin:     { label: 'Администратор', color: '#7c3aed' },
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
  custom_role: string
  hide_role: boolean
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Icon name="Loader" size={16} className="text-zinc-300 animate-spin" />
    </div>
  )

  if (notFound || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-zinc-400 mb-4 text-sm">Пользователь не найден</p>
        <button onClick={() => navigate('/catalog')} className="text-blue-600 hover:text-blue-800 transition-colors text-sm">← Каталог</button>
      </div>
    </div>
  )

  const baseBadge = ROLE_BADGE[profile.role] || ROLE_BADGE.user
  const badge = { label: profile.custom_role || baseBadge.label, color: baseBadge.color }

  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      <header className="sticky top-0 z-20 flex items-center justify-between px-5 md:px-12 py-3.5 border-b border-zinc-100 bg-white/95 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm">
          <Icon name="ArrowLeft" size={15} /> <span className="hidden sm:inline">Назад</span>
        </button>
        <button onClick={() => navigate('/')} className="text-zinc-900 text-base md:text-lg font-bold tracking-tight hover:text-blue-700 transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
          ShadowTales
        </button>
        <div className="w-20" />
      </header>

      <main className="max-w-lg mx-auto px-5 md:px-8 py-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="flex flex-col sm:flex-row items-start gap-5 mb-10 pb-10 border-b border-zinc-100">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex-shrink-0 overflow-hidden border-2 border-zinc-100">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-blue-50 text-blue-500" style={{ fontFamily: "'Playfair Display', serif" }}>
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
                className="text-xl md:text-2xl mb-1.5 block font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" } as React.CSSProperties}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {!profile.hide_role && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${badge.color}18`, color: badge.color }}>
                    {badge.label}
                  </span>
                )}
                {profile.badge_text && <UserBadge text={profile.badge_text} effect={profile.badge_effect} />}
                <span className="text-zinc-300 text-xs">с {joinDate(profile.created_at)}</span>
              </div>
              {profile.bio && (
                <p className="text-zinc-500 text-sm mt-3 leading-6">{profile.bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="border border-zinc-100 rounded-xl px-5 py-4 bg-white">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Прочитано</p>
              <p className="text-zinc-900 text-xl md:text-2xl font-light">{profile.stories_read}</p>
              <p className="text-zinc-300 text-xs mt-0.5">историй</p>
            </div>
            <div className="border border-zinc-100 rounded-xl px-5 py-4 bg-white">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Комментарии</p>
              <p className="text-zinc-900 text-xl md:text-2xl font-light">{profile.comments_count}</p>
              <p className="text-zinc-300 text-xs mt-0.5">оставлено</p>
            </div>
          </div>

          {profile.favorite_genre && (
            <div className="border border-blue-100 rounded-xl px-5 py-4 bg-blue-50/40">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-0.5">Любимый жанр</p>
              <p className="text-zinc-700 text-sm">{profile.favorite_genre}</p>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  )
}
