import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'

const STORIES_API = 'https://functions.poehali.dev/1dfd0899-ad39-4aec-835b-43bb3396248d'
const MOD_API = 'https://functions.poehali.dev/3c308c13-780b-4cbd-82f9-2544dd692ce9'

interface Submission {
  id: number
  title: string
  author_name: string
  genre: string
  text: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface ModApp {
  id: number
  name: string
  contact: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На рассмотрении', color: '#b8860b' },
  approved: { label: 'Одобрено',        color: '#2e7d32' },
  rejected: { label: 'Отклонено',       color: '#8B0000' },
}

export default function Admin() {
  const navigate = useNavigate()
  const [key, setKey] = useState('')
  const [inputKey, setInputKey] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Вкладки
  const [tab, setTab] = useState<'stories' | 'moderators'>('stories')

  // Истории
  const [stories, setStories] = useState<Submission[]>([])
  const [storyFilter, setStoryFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedStory, setExpandedStory] = useState<number | null>(null)
  const [storyActionLoading, setStoryActionLoading] = useState<number | null>(null)

  // Заявки модераторов
  const [modApps, setModApps] = useState<ModApp[]>([])
  const [modFilter, setModFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedMod, setExpandedMod] = useState<number | null>(null)
  const [modActionLoading, setModActionLoading] = useState<number | null>(null)

  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20"

  const fetchAll = async (adminKey: string) => {
    const [sRes, mRes] = await Promise.all([
      fetch(STORIES_API, { headers: { 'X-Admin-Key': adminKey } }),
      fetch(MOD_API, { headers: { 'X-Admin-Key': adminKey } }),
    ])
    if (sRes.status === 401) return false
    const [sData, mData] = await Promise.all([sRes.json(), mRes.json()])
    setStories(Array.isArray(sData) ? sData : [])
    setModApps(Array.isArray(mData) ? mData : [])
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const ok = await fetchAll(inputKey.trim())
    if (ok) { setKey(inputKey.trim()) }
    else setLoginError('Неверный ключ')
    setLoginLoading(false)
  }

  const moderateStory = async (id: number, action: 'approve' | 'reject') => {
    setStoryActionLoading(id)
    const res = await fetch(STORIES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify({ id, action }),
    })
    if (res.ok) {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      setStories(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as Submission['status'] } : s))
      setExpandedStory(null)
    }
    setStoryActionLoading(null)
  }

  const moderateMod = async (id: number, action: 'approve' | 'reject') => {
    setModActionLoading(id)
    const res = await fetch(MOD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify({ id, action }),
    })
    if (res.ok) {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      setModApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as ModApp['status'] } : a))
      setExpandedMod(null)
    }
    setModActionLoading(null)
  }

  // Экран входа
  if (!key) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm px-6">
          <h1 className="text-2xl text-white mb-2 text-center" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Панель администратора
          </h1>
          <p className="text-white/30 text-sm text-center mb-8">ShadowTales</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" className={inputClass} placeholder="Секретный ключ..." value={inputKey} onChange={e => setInputKey(e.target.value)} autoFocus />
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button type="submit" disabled={loginLoading} className="w-full py-3 text-sm tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2" style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}>
              {loginLoading ? <><Icon name="Loader" size={15} className="animate-spin" /> Вход...</> : <><Icon name="KeyRound" size={15} /> Войти</>}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  const filteredStories = stories.filter(s => storyFilter === 'all' || s.status === storyFilter)
  const storyCounts = { all: stories.length, pending: stories.filter(s => s.status === 'pending').length, approved: stories.filter(s => s.status === 'approved').length, rejected: stories.filter(s => s.status === 'rejected').length }

  const filteredMods = modApps.filter(a => modFilter === 'all' || a.status === modFilter)
  const modCounts = { all: modApps.length, pending: modApps.filter(a => a.status === 'pending').length, approved: modApps.filter(a => a.status === 'approved').length, rejected: modApps.filter(a => a.status === 'rejected').length }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.15) 0%, transparent 60%)' }} />

      <header className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          На сайт
        </button>
        <span className="text-white text-lg font-bold" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Модерация</span>
        <button onClick={() => fetchAll(key)} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm">
          <Icon name="RefreshCw" size={15} />
          Обновить
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-8 py-10">
        {/* Вкладки */}
        <div className="flex gap-1 mb-8 border-b border-white/5">
          {([
            { id: 'stories', label: 'Истории', icon: 'BookOpen', count: storyCounts.pending },
            { id: 'moderators', label: 'Заявки в модераторы', icon: 'Shield', count: modCounts.pending },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all -mb-px"
              style={{
                borderColor: tab === t.id ? '#8B0000' : 'transparent',
                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
              {t.count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: '#8B0000', color: '#fff' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== ВКЛАДКА: ИСТОРИИ ===== */}
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
            {filteredStories.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет историй в этом разделе</p>}
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {filteredStories.map(story => {
                  const st = STATUS_LABEL[story.status]
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
                              {story.status === 'pending' ? (
                                <div className="flex gap-3">
                                  <button onClick={() => moderateStory(story.id, 'approve')} disabled={storyActionLoading === story.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm transition-all" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                    {storyActionLoading === story.id ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
                                    Опубликовать
                                  </button>
                                  <button onClick={() => moderateStory(story.id, 'reject')} disabled={storyActionLoading === story.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
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

        {/* ===== ВКЛАДКА: ЗАЯВКИ В МОДЕРАТОРЫ ===== */}
        {tab === 'moderators' && (
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
            {filteredMods.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет заявок в этом разделе</p>}
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
                              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>Почему хочет стать модератором</p>
                              <p className="text-white/60 text-sm leading-7 mb-5">{app.reason}</p>
                              {app.status === 'pending' ? (
                                <div className="flex gap-3">
                                  <button onClick={() => moderateMod(app.id, 'approve')} disabled={modActionLoading === app.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                    {modActionLoading === app.id ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
                                    Принять
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
      </main>
    </div>
  )
}
