import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL, getSessionId, getCachedUser, fetchMe, logout, User } from '@/lib/auth'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'
import { NAME_COLORS, NAME_EFFECTS, BADGE_EFFECTS } from '@/lib/levels'

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

interface Submission {
  id: number; title: string; author_name: string; genre: string
  text: string; status: 'pending' | 'approved' | 'rejected' | 'deleted'
  created_at: string; moderator_comment: string; moderated_at: string | null; moderated_by: string
}
interface ModApp {
  id: number; name: string; contact: string; reason: string
  status: 'pending' | 'approved' | 'rejected'; created_at: string
}
interface AppUser {
  id: number; username: string; email: string
  role: 'user' | 'moderator' | 'admin'; status: string; created_at: string
  name_color?: string; name_effect?: string; ban_reason?: string
  badge_text?: string; badge_effect?: string
}
interface ModerationStats {
  totals: { pending: number; approved: number; rejected: number; deleted: number; total: number }
  moderators: { username: string; role: string; approved: number; rejected: number; last_action: string | null }[]
  by_day: { date: string; count: number }[]
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На рассмотрении', color: '#b8860b' },
  approved: { label: 'Одобрено',        color: '#2e7d32' },
  rejected: { label: 'Отклонено',       color: '#8B0000' },
  deleted:  { label: 'Удалено',         color: '#555' },
  active:   { label: 'Активен',         color: '#2e7d32' },
  banned:   { label: 'Заблокирован',    color: '#8B0000' },
}
const ROLE_LABEL: Record<string, string> = { user: 'Пользователь', moderator: 'Модератор', admin: 'Администратор' }

export default function Admin() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(getCachedUser())
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState<'stories' | 'moderators' | 'users' | 'stats'>('stories')

  const [stories, setStories] = useState<Submission[]>([])
  const [storyFilter, setStoryFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedStory, setExpandedStory] = useState<number | null>(null)
  const [storyActionLoading, setStoryActionLoading] = useState<number | null>(null)
  const [storyComment, setStoryComment] = useState<Record<number, string>>({})
  const [editingStory, setEditingStory] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', text: '', genre: '' })

  const [modApps, setModApps] = useState<ModApp[]>([])
  const [modFilter, setModFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedMod, setExpandedMod] = useState<number | null>(null)
  const [modActionLoading, setModActionLoading] = useState<number | null>(null)

  const [users, setUsers] = useState<AppUser[]>([])
  const [userFilter, setUserFilter] = useState<'pending' | 'active' | 'banned' | 'all'>('pending')
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [banReason, setBanReason] = useState<Record<number, string>>({})
  const [badgeInput, setBadgeInput] = useState<Record<number, string>>({})

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

  const moderateStory = async (id: number, action: 'approve' | 'reject' | 'delete') => {
    setStoryActionLoading(id)
    const comment = storyComment[id] || ''
    const res = await fetch(STORIES_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action, comment }) })
    if (res.ok) {
      if (action === 'delete') {
        setStories(prev => prev.filter(s => s.id !== id))
      } else {
        const ns = action === 'approve' ? 'approved' : 'rejected'
        setStories(prev => prev.map(s => s.id === id ? { ...s, status: ns as Submission['status'], moderator_comment: comment } : s))
      }
      setExpandedStory(null)
      setStoryComment(prev => { const n = { ...prev }; delete n[id]; return n })
    }
    setStoryActionLoading(null)
  }

  const saveEditStory = async (id: number) => {
    setStoryActionLoading(id)
    const res = await fetch(STORIES_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action: 'edit', ...editForm }) })
    if (res.ok) {
      setStories(prev => prev.map(s => s.id === id ? { ...s, ...editForm } : s))
      setEditingStory(null)
    }
    setStoryActionLoading(null)
  }

  const moderateMod = async (id: number, action: 'approve' | 'reject') => {
    setModActionLoading(id)
    const res = await fetch(MOD_API, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, action }) })
    if (res.ok) {
      const ns = action === 'approve' ? 'approved' : 'rejected'
      setModApps(prev => prev.map(a => a.id === id ? { ...a, status: ns as ModApp['status'] } : a))
      setExpandedMod(null)
    }
    setModActionLoading(null)
  }

  const updateUser = async (id: number, patch: { status?: string; role?: string; name_color?: string; name_effect?: string; badge_text?: string; badge_effect?: string }) => {
    setUserActionLoading(id)
    const res = await fetch(`${AUTH_URL}?action=update_user`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, ...patch }) })
    const data = await res.json()
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    setUsers(prev => prev.map(u => u.id === id ? {
      ...u, ...patch,
      ...(parsed.name_color !== undefined ? { name_color: parsed.name_color } : {}),
      ...(parsed.name_effect !== undefined ? { name_effect: parsed.name_effect } : {}),
      ...(parsed.badge_text !== undefined ? { badge_text: parsed.badge_text } : {}),
      ...(parsed.badge_effect !== undefined ? { badge_effect: parsed.badge_effect } : {}),
    } : u))
    setUserActionLoading(null)
  }

  const banUser = async (id: number) => {
    const reason = (banReason[id] || '').trim()
    if (!reason) return
    setUserActionLoading(id)
    const res = await fetch(`${AUTH_URL}?action=ban_user`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id, reason }) })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'banned', ban_reason: reason } : u))
      setBanReason(prev => { const n = { ...prev }; delete n[id]; return n })
    }
    setUserActionLoading(null)
  }

  const unbanUser = async (id: number) => {
    setUserActionLoading(id)
    const res = await fetch(`${AUTH_URL}?action=unban_user`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ id }) })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active', ban_reason: undefined } : u))
    setUserActionLoading(null)
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
  const filteredStories = stories.filter(s => storyFilter === 'all' || s.status === storyFilter)
  const storyCounts = { all: stories.length, pending: stories.filter(s => s.status === 'pending').length, approved: stories.filter(s => s.status === 'approved').length, rejected: stories.filter(s => s.status === 'rejected').length }
  const filteredMods = modApps.filter(a => modFilter === 'all' || a.status === modFilter)
  const modCounts = { all: modApps.length, pending: modApps.filter(a => a.status === 'pending').length, approved: modApps.filter(a => a.status === 'approved').length, rejected: modApps.filter(a => a.status === 'rejected').length }
  const filteredUsers = users.filter(u => userFilter === 'all' || u.status === userFilter)
  const userCounts = { all: users.length, pending: users.filter(u => u.status === 'pending').length, active: users.filter(u => u.status === 'active').length, banned: users.filter(u => u.status === 'banned').length }

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
                  const isEditing = editingStory === story.id
                  return (
                    <motion.div key={story.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4" onClick={() => setExpandedStory(isOpen ? null : story.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-sm border" style={{ borderColor: '#8B0000', color: '#8B0000' }}>{story.genre}</span>
                            <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                            {story.moderated_by && <span className="text-white/20 text-xs">модератор: {story.moderated_by}</span>}
                          </div>
                          <p className="text-white text-base truncate" style={{ fontFamily: "'Cinzel Decorative', serif" }}>{story.title}</p>
                          <p className="text-white/30 text-xs mt-0.5">{story.author_name} · {new Date(story.created_at).toLocaleDateString('ru-RU')}</p>
                          {story.moderator_comment && (
                            <p className="text-white/40 text-xs mt-1 italic">Комментарий: {story.moderator_comment}</p>
                          )}
                        </div>
                        <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-white/30 flex-shrink-0" />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>

                              {/* Редактирование */}
                              {isEditing ? (
                                <div className="space-y-3 mb-4">
                                  <input className={`${smallInputClass} w-full`} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Заголовок" />
                                  <textarea className={`${smallInputClass} w-full resize-none`} rows={8} value={editForm.text} onChange={e => setEditForm(f => ({ ...f, text: e.target.value }))} placeholder="Текст истории" />
                                  <div className="flex gap-2">
                                    <button onClick={() => saveEditStory(story.id)} disabled={storyActionLoading === story.id} className="flex items-center gap-1 px-4 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                      {storyActionLoading === story.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Сохранить
                                    </button>
                                    <button onClick={() => setEditingStory(null)} className="px-4 py-1.5 text-xs border rounded-sm" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>Отмена</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-white/50 text-sm leading-7 whitespace-pre-wrap mb-4 max-h-64 overflow-y-auto pr-2">{story.text}</div>
                              )}

                              {/* Комментарий модератора */}
                              {story.status === 'pending' && !isEditing && (
                                <div className="mb-4">
                                  <textarea
                                    className={`${smallInputClass} w-full resize-none`}
                                    rows={2}
                                    placeholder="Комментарий к решению (необязательно)..."
                                    value={storyComment[story.id] || ''}
                                    onChange={e => setStoryComment(prev => ({ ...prev, [story.id]: e.target.value }))}
                                  />
                                </div>
                              )}

                              {/* Кнопки действий */}
                              {!isEditing && (
                                <div className="flex gap-2 flex-wrap">
                                  {story.status === 'pending' && (
                                    <>
                                      <button onClick={() => moderateStory(story.id, 'approve')} disabled={storyActionLoading === story.id} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                        {storyActionLoading === story.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Опубликовать
                                      </button>
                                      <button onClick={() => moderateStory(story.id, 'reject')} disabled={storyActionLoading === story.id} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                                        <Icon name="X" size={12} /> Отклонить
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => { setEditingStory(story.id); setEditForm({ title: story.title, text: story.text, genre: story.genre }) }} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                                    <Icon name="Pencil" size={12} /> Редактировать
                                  </button>
                                  {isAdmin && (
                                    <button onClick={() => { if (confirm('Удалить историю?')) moderateStory(story.id, 'delete') }} disabled={storyActionLoading === story.id} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm ml-auto" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
                                      <Icon name="Trash2" size={12} /> Удалить
                                    </button>
                                  )}
                                </div>
                              )}
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

        {/* ===== ЗАЯВКИ В МОДЕРАТОРЫ ===== */}
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

        {/* ===== ПОЛЬЗОВАТЕЛИ ===== */}
        {tab === 'users' && isAdmin && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {(['pending', 'active', 'banned', 'all'] as const).map(f => (
                <button key={f} onClick={() => setUserFilter(f)} className="px-4 py-1.5 text-sm border rounded-sm transition-all"
                  style={{ backgroundColor: userFilter === f ? '#8B0000' : 'transparent', borderColor: userFilter === f ? '#8B0000' : 'rgba(255,255,255,0.1)', color: userFilter === f ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {{ pending: 'Ожидают', active: 'Активные', banned: 'Заблокированные', all: 'Все' }[f]}
                  <span className="ml-2 opacity-60 text-xs">{userCounts[f as keyof typeof userCounts]}</span>
                </button>
              ))}
            </div>
            {filteredUsers.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет пользователей</p>}
            <div className="flex flex-col gap-2">
              {filteredUsers.map(u => {
                const st = STATUS_LABEL[u.status] || STATUS_LABEL.pending
                const isOpen = expandedUser === u.id
                return (
                  <motion.div key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4" onClick={() => setExpandedUser(isOpen ? null : u.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <UserName username={u.username} name_color={u.name_color} name_effect={u.name_effect} className="text-sm" />
                          <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                          <span className="text-xs text-white/30">{ROLE_LABEL[u.role]}</span>
                        </div>
                        <p className="text-white/25 text-xs">{u.email}</p>
                        {u.status === 'banned' && u.ban_reason && (
                          <p className="text-white/30 text-xs mt-0.5 italic">Причина: {u.ban_reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {u.status === 'pending' && (
                          <>
                            <button onClick={e => { e.stopPropagation(); updateUser(u.id, { status: 'active' }) }} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                              {userActionLoading === u.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Одобрить
                            </button>
                            <button onClick={e => { e.stopPropagation(); updateUser(u.id, { status: 'rejected' }) }} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                              <Icon name="X" size={12} /> Отклонить
                            </button>
                          </>
                        )}
                        {u.status === 'banned' && (
                          <button onClick={e => { e.stopPropagation(); unbanUser(u.id) }} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                            <Icon name="ShieldCheck" size={12} /> Разбанить
                          </button>
                        )}
                        <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-white/20 flex-shrink-0" />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>

                            {/* Роль */}
                            {u.status === 'active' && (
                              <div>
                                <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Роль</label>
                                <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}
                                  className="text-xs px-3 py-2 rounded-sm border outline-none"
                                  style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                                  <option value="user">Пользователь</option>
                                  <option value="moderator">Модератор</option>
                                  <option value="admin">Администратор</option>
                                </select>
                              </div>
                            )}

                            {/* Цвет ника */}
                            <div>
                              <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Цвет ника</label>
                              <div className="flex flex-wrap gap-2">
                                {NAME_COLORS.map(c => (
                                  <button key={c.value} title={c.label}
                                    onClick={() => updateUser(u.id, { name_color: c.value })}
                                    className="w-6 h-6 rounded-sm border-2 transition-all flex items-center justify-center"
                                    style={{ backgroundColor: c.value || '#333', borderColor: u.name_color === c.value ? '#fff' : 'transparent' }}>
                                    {!c.value && <span className="text-white/40 text-xs">A</span>}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Эффект ника */}
                            <div>
                              <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Эффект ника</label>
                              <div className="flex flex-wrap gap-2">
                                {NAME_EFFECTS.map(ef => (
                                  <button key={ef.value}
                                    onClick={() => updateUser(u.id, { name_effect: ef.value })}
                                    className="px-3 py-1 text-xs border rounded-sm transition-all"
                                    style={{
                                      backgroundColor: u.name_effect === ef.value ? '#8B0000' : 'transparent',
                                      borderColor: u.name_effect === ef.value ? '#8B0000' : 'rgba(255,255,255,0.1)',
                                      color: u.name_effect === ef.value ? '#fff' : 'rgba(255,255,255,0.4)',
                                    }}>
                                    {ef.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Бейдж */}
                            <div>
                              <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Звание / Бейдж</label>
                              <div className="flex gap-2 mb-3">
                                <input
                                  className={`${smallInputClass} flex-1`}
                                  placeholder="Текст звания (макс. 40 символов)..."
                                  maxLength={40}
                                  value={badgeInput[u.id] !== undefined ? badgeInput[u.id] : (u.badge_text || '')}
                                  onChange={e => setBadgeInput(prev => ({ ...prev, [u.id]: e.target.value }))}
                                />
                                <button
                                  onClick={() => {
                                    const text = badgeInput[u.id] !== undefined ? badgeInput[u.id] : (u.badge_text || '')
                                    updateUser(u.id, { badge_text: text })
                                    setBadgeInput(prev => { const n = { ...prev }; delete n[u.id]; return n })
                                  }}
                                  disabled={userActionLoading === u.id}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm"
                                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                                >
                                  <Icon name="Check" size={12} /> Сохранить
                                </button>
                                {u.badge_text && (
                                  <button
                                    onClick={() => updateUser(u.id, { badge_text: '', badge_effect: '' })}
                                    disabled={userActionLoading === u.id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm"
                                    style={{ borderColor: 'rgba(139,0,0,0.4)', color: 'rgba(200,50,50,0.7)' }}
                                  >
                                    <Icon name="X" size={12} />
                                  </button>
                                )}
                              </div>
                              {/* Эффект бейджа */}
                              <div className="flex flex-wrap gap-2">
                                {BADGE_EFFECTS.map(ef => (
                                  <button key={ef.value}
                                    onClick={() => updateUser(u.id, { badge_effect: ef.value })}
                                    className="px-2 py-1 text-xs rounded-sm transition-all"
                                    style={{
                                      border: u.badge_effect === ef.value ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.07)',
                                      opacity: u.badge_effect === ef.value ? 1 : 0.6,
                                      fontWeight: u.badge_effect === ef.value ? 600 : 400,
                                    }}
                                  >
                                    {ef.value ? <UserBadge text={ef.label} effect={ef.value} /> : <span className="text-white/30">{ef.label}</span>}
                                  </button>
                                ))}
                              </div>
                              {u.badge_text && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-white/20 text-xs">Превью:</span>
                                  <UserBadge text={u.badge_text} effect={u.badge_effect} />
                                </div>
                              )}
                            </div>

                            {/* Бан */}
                            {u.status !== 'banned' && (
                              <div>
                                <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Заблокировать</label>
                                <div className="flex gap-2">
                                  <input
                                    className={`${smallInputClass} flex-1`}
                                    placeholder="Причина блокировки..."
                                    value={banReason[u.id] || ''}
                                    onChange={e => setBanReason(prev => ({ ...prev, [u.id]: e.target.value }))}
                                  />
                                  <button
                                    onClick={() => banUser(u.id)}
                                    disabled={!banReason[u.id]?.trim() || userActionLoading === u.id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm"
                                    style={{ borderColor: '#8B0000', color: '#8B0000', opacity: !banReason[u.id]?.trim() ? 0.4 : 1 }}>
                                    {userActionLoading === u.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Ban" size={12} />} Бан
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {/* ===== СТАТИСТИКА ===== */}
        {tab === 'stats' && isAdmin && (
          <>
            {statsLoading && <div className="py-16 flex justify-center"><Icon name="Loader" size={20} className="text-white/30 animate-spin" /></div>}
            {!statsLoading && stats && (
              <div className="space-y-8">
                {/* Итоги */}
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Общие показатели</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'На модерации', value: stats.totals.pending, color: '#b8860b' },
                      { label: 'Опубликовано', value: stats.totals.approved, color: '#2e7d32' },
                      { label: 'Отклонено', value: stats.totals.rejected, color: '#8B0000' },
                      { label: 'Всего', value: stats.totals.total, color: 'rgba(255,255,255,0.4)' },
                    ].map(item => (
                      <div key={item.label} className="p-4 rounded-sm text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
                        <p className="text-white/35 text-xs">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Работа модераторов */}
                {stats.moderators.length > 0 && (
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Активность модераторов</p>
                    <div className="flex flex-col gap-2">
                      {stats.moderators.map(m => (
                        <div key={m.username} className="flex items-center justify-between px-4 py-3 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <span className="text-white/70 text-sm">{m.username}</span>
                            <span className="ml-2 text-xs text-white/25">{ROLE_LABEL[m.role]}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span style={{ color: '#2e7d32' }}>+{m.approved} одобрено</span>
                            <span style={{ color: '#8B0000' }}>−{m.rejected} отклонено</span>
                            {m.last_action && <span className="text-white/20">{new Date(m.last_action).toLocaleDateString('ru-RU')}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Поступление историй */}
                {stats.by_day.length > 0 && (
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Поступление за 30 дней</p>
                    <div className="flex items-end gap-1 h-24">
                      {stats.by_day.map(d => {
                        const max = Math.max(...stats.by_day.map(x => x.count))
                        const pct = max > 0 ? (d.count / max) * 100 : 0
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.date}: ${d.count}`}>
                            <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max(4, pct)}%`, backgroundColor: '#8B0000', opacity: 0.6 }} />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between text-white/15 text-xs mt-1">
                      <span>{stats.by_day[0]?.date}</span>
                      <span>{stats.by_day[stats.by_day.length - 1]?.date}</span>
                    </div>
                  </div>
                )}

                <button onClick={loadStats} className="flex items-center gap-2 text-white/25 hover:text-white transition-colors text-xs">
                  <Icon name="RefreshCw" size={12} /> Обновить статистику
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}