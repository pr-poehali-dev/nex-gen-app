import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL, getSessionId, getCachedUser, fetchMe, logout, User } from '@/lib/auth'

const STORIES_API = 'https://functions.poehali.dev/1dfd0899-ad39-4aec-835b-43bb3396248d'
const MOD_API = 'https://functions.poehali.dev/3c308c13-780b-4cbd-82f9-2544dd692ce9'

// Резервный вход по секретному ключу (для первого запуска)
function AdminKeyLogin({ onSuccess, navigate, inputClass, sid }: {
  onSuccess: (role: string) => void
  navigate: ReturnType<typeof useNavigate>
  inputClass: string
  sid: string
}) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch(STORIES_API, { headers: { 'X-Admin-Key': key.trim() } })
    if (res.status === 401) { setError('Неверный ключ'); setLoading(false); return }
    // Ключ верный — сохраняем как виртуального admin-пользователя
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

interface Submission {
  id: number; title: string; author_name: string; genre: string
  text: string; status: 'pending' | 'approved' | 'rejected' | 'deleted'; created_at: string
}
interface ModApp {
  id: number; name: string; contact: string; reason: string
  status: 'pending' | 'approved' | 'rejected'; created_at: string
}
interface AppUser {
  id: number; username: string; email: string
  role: 'user' | 'moderator' | 'admin'; status: string; created_at: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На рассмотрении', color: '#b8860b' },
  approved: { label: 'Одобрено',        color: '#2e7d32' },
  rejected: { label: 'Отклонено',       color: '#8B0000' },
  deleted:  { label: 'Удалено',         color: '#555' },
  active:   { label: 'Активен',         color: '#2e7d32' },
}

const ROLE_LABEL: Record<string, string> = { user: 'Пользователь', moderator: 'Модератор', admin: 'Администратор' }

export default function Admin() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(getCachedUser())
  const [authLoading, setAuthLoading] = useState(true)

  const [tab, setTab] = useState<'stories' | 'moderators' | 'users'>('stories')

  const [stories, setStories] = useState<Submission[]>([])
  const [storyFilter, setStoryFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedStory, setExpandedStory] = useState<number | null>(null)
  const [storyActionLoading, setStoryActionLoading] = useState<number | null>(null)

  const [modApps, setModApps] = useState<ModApp[]>([])
  const [modFilter, setModFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedMod, setExpandedMod] = useState<number | null>(null)
  const [modActionLoading, setModActionLoading] = useState<number | null>(null)

  const [users, setUsers] = useState<AppUser[]>([])
  const [userFilter, setUserFilter] = useState<'pending' | 'active' | 'all'>('pending')
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null)

  const sid = getSessionId()
  const adminKey = localStorage.getItem('admin_key') || ''

  useEffect(() => {
    // Если есть сохранённый admin_key — сразу входим как admin без сессии
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

  const moderateStory = async (id: number, action: 'approve' | 'reject' | 'delete') => {
    setStoryActionLoading(id)
    const res = await fetch(STORIES_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action }) })
    if (res.ok) {
      if (action === 'delete') setStories(prev => prev.filter(s => s.id !== id))
      else { const ns = action === 'approve' ? 'approved' : 'rejected'; setStories(prev => prev.map(s => s.id === id ? { ...s, status: ns as Submission['status'] } : s)) }
      setExpandedStory(null)
    }
    setStoryActionLoading(null)
  }

  const moderateMod = async (id: number, action: 'approve' | 'reject') => {
    setModActionLoading(id)
    const res = await fetch(MOD_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action }) })
    if (res.ok) { const ns = action === 'approve' ? 'approved' : 'rejected'; setModApps(prev => prev.map(a => a.id === id ? { ...a, status: ns as ModApp['status'] } : a)); setExpandedMod(null) }
    setModActionLoading(null)
  }

  const updateUser = async (id: number, patch: { status?: string; role?: string }) => {
    setUserActionLoading(id)
    await fetch(`${AUTH_URL}?action=update_user`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, ...patch }) })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u))
    setUserActionLoading(null)
  }

  const handleLogout = async () => {
    localStorage.removeItem('admin_key')
    await logout()
    navigate('/login')
  }

  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20"

  // Экран загрузки
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <Icon name="Loader" size={20} className="text-white/30 animate-spin" />
    </div>
  )

  // Нет доступа — показываем форму входа по секретному ключу + ссылку на логин
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return (
    <AdminKeyLogin onSuccess={(role) => { loadAll(role); window.location.reload() }} navigate={navigate} inputClass={inputClass} sid={sid} />
  )

  const isAdmin = user.role === 'admin'
  const filteredStories = stories.filter(s => storyFilter === 'all' || s.status === storyFilter)
  const storyCounts = { all: stories.length, pending: stories.filter(s => s.status === 'pending').length, approved: stories.filter(s => s.status === 'approved').length, rejected: stories.filter(s => s.status === 'rejected').length }
  const filteredMods = modApps.filter(a => modFilter === 'all' || a.status === modFilter)
  const modCounts = { all: modApps.length, pending: modApps.filter(a => a.status === 'pending').length, approved: modApps.filter(a => a.status === 'approved').length, rejected: modApps.filter(a => a.status === 'rejected').length }
  const filteredUsers = users.filter(u => userFilter === 'all' || u.status === userFilter)
  const userCounts = { all: users.length, pending: users.filter(u => u.status === 'pending').length, active: users.filter(u => u.status === 'active').length }

  const tabs = [
    { id: 'stories' as const, label: 'Истории', icon: 'BookOpen' as const, count: storyCounts.pending },
    ...(isAdmin ? [
      { id: 'moderators' as const, label: 'Заявки в модераторы', icon: 'Shield' as const, count: modCounts.pending },
      { id: 'users' as const, label: 'Пользователи', icon: 'Users' as const, count: userCounts.pending },
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
        <div className="flex gap-1 mb-8 border-b border-white/5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all -mb-px"
              style={{ borderColor: tab === t.id ? '#8B0000' : 'transparent', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              <Icon name={t.icon} size={14} />
              {t.label}
              {t.count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: '#8B0000', color: '#fff' }}>{t.count}</span>}
            </button>
          ))}
          <button onClick={() => loadAll(user.role)} className="ml-auto flex items-center gap-1 text-white/25 hover:text-white transition-colors text-xs px-2">
            <Icon name="RefreshCw" size={13} /> Обновить
          </button>
        </div>

        {/* ===== ИСТОРИИ ===== */}
        {tab === 'stories' && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                <button key={f} onClick={() => setStoryFilter(f)} className="px-4 py-1.5 text-sm border rounded-sm transition-all"
                  style={{ backgroundColor: storyFilter === f ? '#8B0000' : 'transparent', borderColor: storyFilter === f ? '#8B0000' : 'rgba(255,255,255,0.1)', color: storyFilter === f ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {{ pending: 'На модерации', approved: 'Одобренные', rejected: 'Отклонённые', all: 'Все' }[f]}
                  <span className="ml-2 opacity-60 text-xs">{storyCounts[f]}</span>
                </button>
              ))}
            </div>
            {filteredStories.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет историй</p>}
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {filteredStories.map(story => {
                  const st = STATUS_LABEL[story.status] || STATUS_LABEL.rejected
                  const isOpen = expandedStory === story.id
                  return (
                    <motion.div key={story.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4" onClick={() => setExpandedStory(isOpen ? null : story.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-sm border" style={{ borderColor: '#8B0000', color: '#8B0000' }}>{story.genre}</span>
                            <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                          </div>
                          <p className="text-white text-base truncate" style={{ fontFamily: "'Cinzel Decorative', serif" }}>{story.title}</p>
                          <p className="text-white/30 text-xs mt-0.5">{story.author_name} · {new Date(story.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-white/30 flex-shrink-0" />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <div className="px-5 pb-5">
                              <div className="text-white/50 text-sm leading-7 whitespace-pre-wrap mb-5 max-h-64 overflow-y-auto pr-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>{story.text}</div>
                              <div className="flex gap-3 flex-wrap">
                                {story.status === 'pending' && (
                                  <>
                                    <button onClick={() => moderateStory(story.id, 'approve')} disabled={storyActionLoading === story.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                      {storyActionLoading === story.id ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />} Опубликовать
                                    </button>
                                    <button onClick={() => moderateStory(story.id, 'reject')} disabled={storyActionLoading === story.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                                      <Icon name="X" size={14} /> Отклонить
                                    </button>
                                  </>
                                )}
                                {isAdmin && (
                                  <button onClick={() => { if (confirm('Удалить историю безвозвратно?')) moderateStory(story.id, 'delete') }} disabled={storyActionLoading === story.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm ml-auto hover:bg-red-950 transition-all" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                                    <Icon name="Trash2" size={14} /> Удалить
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ===== ЗАЯВКИ В МОДЕРАТОРЫ (только admin) ===== */}
        {tab === 'moderators' && isAdmin && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                <button key={f} onClick={() => setModFilter(f)} className="px-4 py-1.5 text-sm border rounded-sm transition-all"
                  style={{ backgroundColor: modFilter === f ? '#8B0000' : 'transparent', borderColor: modFilter === f ? '#8B0000' : 'rgba(255,255,255,0.1)', color: modFilter === f ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {{ pending: 'На рассмотрении', approved: 'Принятые', rejected: 'Отклонённые', all: 'Все' }[f]}
                  <span className="ml-2 opacity-60 text-xs">{modCounts[f]}</span>
                </button>
              ))}
            </div>
            {filteredMods.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет заявок</p>}
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {filteredMods.map(app => {
                  const st = STATUS_LABEL[app.status]
                  const isOpen = expandedMod === app.id
                  return (
                    <motion.div key={app.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4" onClick={() => setExpandedMod(isOpen ? null : app.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                          </div>
                          <p className="text-white text-base">{app.name}</p>
                          <p className="text-white/30 text-xs mt-0.5">{app.contact} · {new Date(app.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-white/30 flex-shrink-0" />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <div className="px-5 pb-5">
                              <p className="text-white/50 text-sm leading-7 mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>{app.reason}</p>
                              {app.status === 'pending' ? (
                                <div className="flex gap-3">
                                  <button onClick={() => moderateMod(app.id, 'approve')} disabled={modActionLoading === app.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                    {modActionLoading === app.id ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />} Принять
                                  </button>
                                  <button onClick={() => moderateMod(app.id, 'reject')} disabled={modActionLoading === app.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                                    <Icon name="X" size={14} /> Отклонить
                                  </button>
                                </div>
                              ) : <p className="text-white/20 text-xs">Решение уже принято</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ===== ПОЛЬЗОВАТЕЛИ (только admin) ===== */}
        {tab === 'users' && isAdmin && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {(['pending', 'active', 'all'] as const).map(f => (
                <button key={f} onClick={() => setUserFilter(f)} className="px-4 py-1.5 text-sm border rounded-sm transition-all"
                  style={{ backgroundColor: userFilter === f ? '#8B0000' : 'transparent', borderColor: userFilter === f ? '#8B0000' : 'rgba(255,255,255,0.1)', color: userFilter === f ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {{ pending: 'Ожидают', active: 'Активные', all: 'Все' }[f]}
                  <span className="ml-2 opacity-60 text-xs">{userCounts[f]}</span>
                </button>
              ))}
            </div>
            {filteredUsers.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет пользователей</p>}
            <div className="flex flex-col gap-2">
              {filteredUsers.map(u => {
                const st = STATUS_LABEL[u.status] || STATUS_LABEL.pending
                return (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm px-5 py-4 flex items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-sm">{u.username}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                        <span className="text-xs text-white/30">{ROLE_LABEL[u.role]}</span>
                      </div>
                      <p className="text-white/30 text-xs">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {u.status === 'pending' && (
                        <button onClick={() => updateUser(u.id, { status: 'active' })} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                          {userActionLoading === u.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Одобрить
                        </button>
                      )}
                      {u.status === 'active' && (
                        <select
                          value={u.role}
                          onChange={e => updateUser(u.id, { role: e.target.value })}
                          className="text-xs px-2 py-1.5 rounded-sm border outline-none"
                          style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                        >
                          <option value="user">Пользователь</option>
                          <option value="moderator">Модератор</option>
                          <option value="admin">Администратор</option>
                        </select>
                      )}
                      {u.status === 'pending' && (
                        <button onClick={() => updateUser(u.id, { status: 'rejected' })} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                          <Icon name="X" size={12} /> Отклонить
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}