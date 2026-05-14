import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { fetchMe, logout, User } from '@/lib/auth'

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  user:      { label: 'Читатель',       color: '#555' },
  moderator: { label: 'Модератор',      color: '#b8860b' },
  admin:     { label: 'Администратор',  color: '#8B0000' },
}

export default function Account() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMe().then(u => {
      if (!u) navigate('/login')
      else { setUser(u); setLoading(false) }
    })
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <Icon name="Loader" size={18} className="text-white/20 animate-spin" />
    </div>
  )

  if (!user) return null

  const role = ROLE_LABEL[user.role] || ROLE_LABEL.user

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.15) 0%, transparent 60%)' }} />
      <div className="absolute left-0 top-0 h-full w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,0,0,0.2), transparent)' }} />

      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button onClick={() => navigate('/catalog')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} /> Каталог
        </button>
        <button onClick={() => navigate('/')} className="text-white text-lg font-bold tracking-wider hover:text-red-400 transition-colors" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <div className="w-20" />
      </header>

      <main className="max-w-lg mx-auto px-6 md:px-8 py-14">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          {/* Аватар-заглушка */}
          <div className="flex items-center gap-5 mb-10 pb-10 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div
              className="w-14 h-14 rounded-sm flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.3)' }}
            >
              <span className="text-white/60 font-bold" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {user.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl text-white" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {user.username}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-sm mt-1 inline-block" style={{ backgroundColor: `${role.color}22`, color: role.color }}>
                {role.label}
              </span>
            </div>
          </div>

          {/* Информация */}
          <div className="space-y-5 mb-10">
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-xs uppercase tracking-wider">Email</span>
              <span className="text-white/60 text-sm">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-xs uppercase tracking-wider">Роль</span>
              <span className="text-sm" style={{ color: role.color }}>{role.label}</span>
            </div>
          </div>

          {/* Действия */}
          <div className="space-y-3">
            {(user.role === 'admin' || user.role === 'moderator') && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-between px-4 py-3 border rounded-sm transition-all hover:border-white/20 text-sm"
                style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              >
                <span className="flex items-center gap-3">
                  <Icon name="Shield" size={15} className="text-[#8B0000]" />
                  Панель модерации
                </span>
                <Icon name="ChevronRight" size={15} className="text-white/20" />
              </button>
            )}
            <button
              onClick={() => navigate('/submit')}
              className="w-full flex items-center justify-between px-4 py-3 border rounded-sm transition-all hover:border-white/20 text-sm"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <span className="flex items-center gap-3">
                <Icon name="PenLine" size={15} className="text-[#8B0000]" />
                Предложить историю
              </span>
              <Icon name="ChevronRight" size={15} className="text-white/20" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-sm transition-all text-sm mt-6"
              style={{ borderColor: 'rgba(139,0,0,0.2)', color: 'rgba(139,0,0,0.7)' }}
            >
              <Icon name="LogOut" size={15} />
              Выйти из аккаунта
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
