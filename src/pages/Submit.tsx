import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'

const GENRES = ['Хоррор', 'Мистика', 'Психологический триллер', 'Крипипаста']
const API_URL = 'https://functions.poehali.dev/e051682f-c039-4b37-81c8-dbd8077e10db'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function Submit() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    title: '',
    author_name: '',
    genre: '',
    text: '',
  })

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(typeof data === 'string' ? JSON.parse(data).error : data.error)
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Ошибка соединения. Попробуй ещё раз.')
      setStatus('error')
    }
  }

  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20 resize-none"

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.2) 0%, transparent 60%)' }}
      />

      {/* Шапка */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <Icon name="ArrowLeft" size={16} />
          <span className="hidden sm:inline">Каталог</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-white text-base md:text-lg font-bold tracking-wider hover:text-red-400 transition-colors duration-200"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          ShadowTales
        </button>
        <div className="w-24" />
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-2xl md:text-4xl text-white mb-3"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Предложить историю
          </h1>
          <p className="text-white/40 text-sm mb-10">
            Модератор проверит и опубликует. Обычно это занимает 1–2 дня.
          </p>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <h2
                className="text-2xl text-white mb-3"
                style={{ fontFamily: "'Cinzel Decorative', serif" }}
              >
                История отправлена
              </h2>
              <p className="text-white/40 text-sm mb-8">
                Модератор рассмотрит её в ближайшее время.
              </p>
              <button
                onClick={() => navigate('/catalog')}
                className="text-[#8B0000] hover:text-red-400 transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                <Icon name="ArrowLeft" size={14} />
                Вернуться в каталог
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white/40 text-xs mb-2 uppercase tracking-wider">Название истории</label>
                <input
                  className={inputClass}
                  placeholder="Придумай жуткий заголовок..."
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs mb-2 uppercase tracking-wider">Имя автора</label>
                <input
                  className={inputClass}
                  placeholder="Можно псевдоним или «Аноним»"
                  value={form.author_name}
                  onChange={e => set('author_name', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs mb-2 uppercase tracking-wider">Жанр</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => set('genre', g)}
                      className="px-4 py-1.5 text-sm transition-all duration-200 border rounded-sm"
                      style={{
                        backgroundColor: form.genre === g ? '#8B0000' : 'transparent',
                        borderColor: form.genre === g ? '#8B0000' : 'rgba(255,255,255,0.1)',
                        color: form.genre === g ? '#fff' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-xs mb-2 uppercase tracking-wider">
                  Текст истории
                  <span className="ml-2 normal-case" style={{ color: form.text.length < 100 ? '#8B0000' : 'rgba(255,255,255,0.2)' }}>
                    {form.text.length} / мин. 100 символов
                  </span>
                </label>
                <textarea
                  className={inputClass}
                  rows={8}
                  placeholder="Начни свою историю здесь..."
                  value={form.text}
                  onChange={e => set('text', e.target.value)}
                  required
                />
              </div>

              {status === 'error' && (
                <p className="text-red-500 text-sm">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !form.genre}
                className="w-full py-3 text-sm tracking-widest uppercase transition-all duration-300 border rounded-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: status === 'loading' ? 'transparent' : '#8B0000',
                  borderColor: '#8B0000',
                  color: '#fff',
                  opacity: !form.genre ? 0.4 : 1,
                }}
              >
                {status === 'loading' ? (
                  <>
                    <Icon name="Loader" size={16} className="animate-spin" />
                    Отправляем...
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={16} />
                    Отправить на модерацию
                  </>
                )}
              </button>
            </form>
          )}

          {/* Баннер набора в модераторы */}
          {status !== 'success' && (
            <div
              className="mt-10 border rounded-sm px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{ borderColor: 'rgba(139,0,0,0.3)', backgroundColor: 'rgba(139,0,0,0.06)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Shield" size={13} className="text-[#8B0000]" />
                  <span className="text-xs uppercase tracking-widest text-[#8B0000]">Открытый набор</span>
                </div>
                <p className="text-white text-sm" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Ищем модераторов</p>
                <p className="text-white/40 text-xs mt-1">Хочешь решать, какие истории попадают на сайт?</p>
              </div>
              <button
                onClick={() => navigate('/join')}
                className="flex-shrink-0 px-4 py-2 text-xs border rounded-sm transition-all duration-200 tracking-wider uppercase hover:bg-[#8B0000] hover:text-white"
                style={{ borderColor: '#8B0000', color: '#8B0000', backgroundColor: 'transparent' }}
              >
                Подать заявку
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}