import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL, getSessionId, getCachedUser, fetchMe, logout, User } from '@/lib/auth'
import { Submission, ModApp, AppUser, ModerationStats, ROLE_LABEL } from './admin/admin.types'
import AdminStories from './admin/AdminStories'
import AdminModerators from './admin/AdminModerators'
import AdminUsers from './admin/AdminUsers'
import AdminStats from './admin/AdminStats'

const STORIES_API = 'https://functions.poehali.dev/1dfd0899-ad39-4aec-835b-43bb3396248d'
const MOD_API = 'https://functions.poehali.dev/3c308c13-780b-4cbd-82f9-2544dd692ce9'

function AdminKeyLogin({ navigate, inputClass }: {
  navigate: ReturnType<typeof useNavigate>
  inputClass: string
}) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch(STORIES_API, { headers: { 'X-Admin-Key': key.trim() } })
    if (res.status === 401) { setError('Неверный ключ'); setLoading(false); return }
    localStorage.setItem('admin_key', key.trim())
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(60,0,0,0.2) 0%, transparent 60%)' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm px-6 relative">
        <button onClick={() => navigate('/')} className="text-white/30 hover:text-white transition-colors text-lg font-bold tracking-wider mb-10 block" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <h1 className="text-2xl text-white mb-1" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Панель администратора</h1>
        <p className="text-white/30 text-sm mb-8">Войди через аккаунт или секретный ключ</p>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <input type="password" className={inputClass} placeholder="Секретный ключ администратора..." value={key} onChange={e => setKey(e.target.value)} autoFocus />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 text-sm tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2" style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}>
            {loading ? <><Icon name="Loader" size={15} className="animate-spin" />Проверяем...</> : <><Icon name="KeyRound" size={15} />Войти по ключу</>}
          </button>
        </form>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <span className="text-white/20 text-xs">или</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
        </div>
        <button onClick={() => navigate('/login')} className="w-full py-3 text-sm tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2 transition-all hover:border-white/20" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <Icon name="LogIn" size={15} /> Войти в аккаунт
        </button>
      </motion.div>
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(getCachedUser())
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState<'stories' | 'moderators' | 'users' | 'stats'>('stories')

  const [stories, setStories] = useState<Submission[]>([])
  const [modApps, setModApps] = useState<ModApp[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const sid = getSessionId()
  const adminKey = localStorage.getItem('admin_key') || ''

  useEffect(() => {
    if (adminKey) {
      setUser({ id: 0, username: 'Администратор', email: '', role: 'admin', status: 'active' })
      setAuthLoading(false)
      loadAll('admin')
      return
    }
    fetchMe().then(u => {
      setUser(u)
      setAuthLoading(false)
      if (u && (u.role === 'admin' || u.role === 'moderator')) loadAll(u.role)
    })
  }, [])

  const getHeaders = () => adminKey
    ? { 'X-Admin-Key': adminKey, 'Content-Type': 'application/json' }
    : { 'X-Session-Id': sid, 'Content-Type': 'application/json' }

  const loadAll = async (role: string) => {
    const h = adminKey ? { 'X-Admin-Key': adminKey } : { 'X-Session-Id': sid }
    const sRes = await fetch(STORIES_API, { headers: h })
    const sData = await sRes.json()
    setStories(Array.isArray(sData) ? sData : [])
    if (role === 'admin') {
      const [mRes, uRes] = await Promise.all([
        fetch(MOD_API, { headers: h }),
        fetch(`${AUTH_URL}?action=users`, { headers: h }),
      ])
      const mData = await mRes.json(); const uData = await uRes.json()
      setModApps(Array.isArray(mData) ? mData : [])
      setUsers(Array.isArray(uData) ? uData : [])
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    const h = adminKey ? { 'X-Admin-Key': adminKey } : { 'X-Session-Id': sid }
    const res = await fetch(`${STORIES_API}?action=stats`, { headers: h })
    const data = await res.json()
    setStats(data)
    setStatsLoading(false)
  }

  useEffect(() => {
    if (tab === 'stats' && !stats) loadStats()
  }, [tab])

  const moderateStory = async (id: number, action: 'approve' | 'reject' | 'delete', comment: string) => {
    const res = await fetch(STORIES_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action, comment }) })
    if (res.ok) {
      if (action === 'delete') {
        setStories(prev => prev.filter(s => s.id !== id))
      } else {
        const ns = action === 'approve' ? 'approved' : 'rejected'
        setStories(prev => prev.map(s => s.id === id ? { ...s, status: ns as Submission['status'], moderator_comment: comment } : s))
      }
    }
  }

  const saveEditStory = async (id: number, form: { title: string; text: string; genre: string }) => {
    const res = await fetch(STORIES_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action: 'edit', ...form }) })
    if (res.ok) setStories(prev => prev.map(s => s.id === id ? { ...s, ...form } : s))
  }

  const moderateMod = async (id: number, action: 'approve' | 'reject') => {
    const res = await fetch(MOD_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action }) })
    if (res.ok) {
      const ns = action === 'approve' ? 'approved' : 'rejected'
      setModApps(prev => prev.map(a => a.id === id ? { ...a, status: ns as ModApp['status'] } : a))
    }
  }

  const updateUser = async (id: number, patch: { status?: string; role?: string; name_color?: string; name_effect?: string; badge_text?: string; badge_effect?: string; custom_role?: string; hide_role?: boolean }) => {
    const res = await fetch(`${AUTH_URL}?action=update_user`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, ...patch }) })
    const data = await res.json()
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    setUsers(prev => prev.map(u => u.id === id ? {
      ...u, ...patch,
      ...(parsed.name_color !== undefined ? { name_color: parsed.name_color } : {}),
      ...(parsed.name_effect !== undefined ? { name_effect: parsed.name_effect } : {}),
      ...(parsed.badge_text !== undefined ? { badge_text: parsed.badge_text } : {}),
      ...(parsed.badge_effect !== undefined ? { badge_effect: parsed.badge_effect } : {}),
      ...(parsed.custom_role !== undefined ? { custom_role: parsed.custom_role } : {}),
      ...(parsed.hide_role !== undefined ? { hide_role: parsed.hide_role } : {}),
    } : u))
  }

  const banUser = async (id: number, reason: string) => {
    const res = await fetch(`${AUTH_URL}?action=ban_user`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, reason }) })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'banned', ban_reason: reason } : u))
  }

  const unbanUser = async (id: number) => {
    const res = await fetch(`${AUTH_URL}?action=unban_user`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id }) })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active', ban_reason: undefined } : u))
  }

  const handleLogout = async () => {
    localStorage.removeItem('admin_key')
    await logout()
    navigate('/login')
  }

  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20"
  const smallInputClass = "bg-transparent border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20"

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <Icon name="Loader" size={20} className="text-white/30 animate-spin" />
    </div>
  )

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return (
    <AdminKeyLogin navigate={navigate} inputClass={inputClass} />
  )

  const isAdmin = user.role === 'admin'
  const storyCounts = { pending: stories.filter(s => s.status === 'pending').length }
  const modCounts = { pending: modApps.filter(a => a.status === 'pending').length }
  const userCounts = { pending: users.filter(u => u.status === 'pending').length }

  const tabs = [
    { id: 'stories' as const, label: 'Истории', icon: 'BookOpen' as const, count: storyCounts.pending },
    ...(isAdmin ? [
      { id: 'moderators' as const, label: 'Модераторы', icon: 'Shield' as const, count: modCounts.pending },
      { id: 'users' as const, label: 'Пользователи', icon: 'Users' as const, count: userCounts.pending },
      { id: 'stats' as const, label: 'Статистика', icon: 'BarChart2' as const, count: 0 },
    ] : []),
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.15) 0%, transparent 60%)' }} />
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} /> На сайт
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs">{user.username}</span>
          <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: isAdmin ? 'rgba(139,0,0,0.3)' : 'rgba(184,134,11,0.2)', color: isAdmin ? '#cc3333' : '#b8860b' }}>
            {ROLE_LABEL[user.role]}
          </span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm">
          <Icon name="LogOut" size={15} /> Выйти
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-8 py-10">
        {/* Вкладки */}
        <div className="flex gap-1 mb-8 border-b border-white/5 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all -mb-px whitespace-nowrap"
              style={{ borderColor: tab === t.id ? '#8B0000' : 'transparent', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              <Icon name={t.icon} size={14} />
              {t.label}
              {t.count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: '#8B0000', color: '#fff' }}>{t.count}</span>}
            </button>
          ))}
          <button onClick={() => loadAll(user.role)} className="ml-auto flex items-center gap-1 text-white/25 hover:text-white transition-colors text-xs px-2 whitespace-nowrap">
            <Icon name="RefreshCw" size={13} /> Обновить
          </button>
        </div>

        {tab === 'stories' && (
          <AdminStories
            stories={stories}
            isAdmin={isAdmin}
            onModerate={moderateStory}
            onSaveEdit={saveEditStory}
            smallInputClass={smallInputClass}
          />
        )}

        {tab === 'moderators' && isAdmin && (
          <AdminModerators
            modApps={modApps}
            onModerate={moderateMod}
          />
        )}

        {tab === 'users' && isAdmin && (
          <AdminUsers
            users={users}
            onUpdate={updateUser}
            onBan={banUser}
            onUnban={unbanUser}
            smallInputClass={smallInputClass}
          />
        )}

        {tab === 'stats' && isAdmin && (
          <AdminStats
            stats={stats}
            statsLoading={statsLoading}
            onRefresh={loadStats}
          />
        )}
      </main>
    </div>
  )
}