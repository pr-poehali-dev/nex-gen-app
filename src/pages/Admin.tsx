import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'

const API_URL = 'https://functions.poehali.dev/1dfd0899-ad39-4aec-835b-43bb3396248d'

interface Submission {
  id: number
  title: string
  author_name: string
  genre: string
  text: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На модерации', color: '#b8860b' },
  approved: { label: 'Одобрено',     color: '#2e7d32' },
  rejected: { label: 'Отклонено',    color: '#8B0000' },
}

export default function Admin() {
  const navigate = useNavigate()
  const [key, setKey] = useState('')
  const [inputKey, setInputKey] = useState('')
  const [stories, setStories] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  const fetchStories = async (adminKey: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_URL, {
        headers: { 'X-Admin-Key': adminKey },
      })
      if (res.status === 401) { setError('Неверный ключ'); setLoading(false); return }
      const data = await res.json()
      setStories(data)
      setKey(adminKey)
    } catch {
      setError('Ошибка соединения')
    }
    setLoading(false)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStories(inputKey.trim())
  }

  const moderate = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(id)
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify({ id, action }),
    })
    if (res.ok) {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      setStories(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as Submission['status'] } : s))
      setExpanded(null)
    }
    setActionLoading(null)
  }

  const filtered = stories.filter(s => filter === 'all' || s.status === filter)
  const counts = {
    all: stories.length,
    pending: stories.filter(s => s.status === 'pending').length,
    approved: stories.filter(s => s.status === 'approved').length,
    rejected: stories.filter(s => s.status === 'rejected').length,
  }

  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20"

  if (!key) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm px-6"
        >
          <h1
            className="text-2xl text-white mb-2 text-center"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Панель администратора
          </h1>
          <p className="text-white/30 text-sm text-center mb-8">ShadowTales</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className={inputClass}
              placeholder="Секретный ключ..."
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm tracking-widest uppercase border rounded-sm transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}
            >
              {loading
                ? <><Icon name="Loader" size={15} className="animate-spin" /> Вход...</>
                : <><Icon name="KeyRound" size={15} /> Войти</>
              }
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.15) 0%, transparent 60%)' }} />

      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <Icon name="ArrowLeft" size={16} />
          На сайт
        </button>
        <span className="text-white text-lg font-bold" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Модерация
        </span>
        <button
          onClick={() => fetchStories(key)}
          className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm"
        >
          <Icon name="RefreshCw" size={15} />
          Обновить
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-8 py-10">
        {/* Фильтры */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 text-sm border rounded-sm transition-all"
              style={{
                backgroundColor: filter === f ? '#8B0000' : 'transparent',
                borderColor: filter === f ? '#8B0000' : 'rgba(255,255,255,0.1)',
                color: filter === f ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {{ pending: 'На модерации', approved: 'Одобренные', rejected: 'Отклонённые', all: 'Все' }[f]}
              <span className="ml-2 opacity-60 text-xs">{counts[f]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-white/30 text-sm py-12 text-center">Нет историй в этом разделе</p>
        )}

        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {filtered.map(story => {
              const st = STATUS_LABEL[story.status]
              const isOpen = expanded === story.id
              return (
                <motion.div
                  key={story.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-sm overflow-hidden"
                  style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  {/* Шапка карточки */}
                  <button
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : story.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-sm border" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                          {story.genre}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-white text-base truncate" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                        {story.title}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">{story.author_name} · {new Date(story.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-white/30 flex-shrink-0" />
                  </button>

                  {/* Раскрытый текст */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5">
                          <div
                            className="text-white/50 text-sm leading-7 whitespace-pre-wrap mb-5 max-h-64 overflow-y-auto pr-2"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
                          >
                            {story.text}
                          </div>

                          {story.status === 'pending' && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => moderate(story.id, 'approve')}
                                disabled={actionLoading === story.id}
                                className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm transition-all"
                                style={{ borderColor: '#2e7d32', color: '#2e7d32', backgroundColor: 'transparent' }}
                              >
                                {actionLoading === story.id
                                  ? <Icon name="Loader" size={14} className="animate-spin" />
                                  : <Icon name="Check" size={14} />
                                }
                                Опубликовать
                              </button>
                              <button
                                onClick={() => moderate(story.id, 'reject')}
                                disabled={actionLoading === story.id}
                                className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm transition-all"
                                style={{ borderColor: '#8B0000', color: '#8B0000', backgroundColor: 'transparent' }}
                              >
                                <Icon name="X" size={14} />
                                Отклонить
                              </button>
                            </div>
                          )}

                          {story.status !== 'pending' && (
                            <p className="text-white/20 text-xs">Решение уже принято</p>
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
      </main>
    </div>
  )
}