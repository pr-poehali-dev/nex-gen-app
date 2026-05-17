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
  const [form, setForm] = useState({ title: '', author_name: '', genre: '', text: '' })

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

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

  const inputClass = "w-full border border-zinc-200 rounded-lg px-4 py-3 text-zinc-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-zinc-300 bg-white resize-none"

  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      <header className="sticky top-0 z-20 flex items-center justify-between px-5 md:px-12 py-3.5 border-b border-zinc-100 bg-white/95 backdrop-blur-sm">
        <button onClick={() => navigate('/catalog')} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm">
          <Icon name="ArrowLeft" size={15} />
          <span className="hidden sm:inline">Каталог</span>
        </button>
        <button onClick={() => navigate('/')} className="text-zinc-900 text-base md:text-lg font-bold tracking-tight hover:text-blue-700 transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
          ShadowTales
        </button>
        <div className="w-24" />
      </header>

      <main className="max-w-2xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl md:text-4xl text-zinc-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Предложить историю
          </h1>
          <p className="text-zinc-400 text-sm mb-10">
            Модератор проверит и опубликует. Обычно это занимает 1–2 дня.
          </p>

          {status === 'success' ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Icon name="Check" size={20} className="text-green-500" />
              </div>
              <h2 className="text-xl text-zinc-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                История отправлена
              </h2>
              <p className="text-zinc-400 text-sm mb-8">Модератор рассмотрит её в ближайшее время.</p>
              <button onClick={() => navigate('/catalog')} className="text-blue-600 hover:text-blue-800 transition-colors text-sm flex items-center gap-2 mx-auto">
                <Icon name="ArrowLeft" size={14} />
                Вернуться в каталог
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Название истории</label>
                <input className={inputClass} placeholder="Придумай заголовок..." value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>

              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Имя автора</label>
                <input className={inputClass} placeholder="Можно псевдоним или «Аноним»" value={form.author_name} onChange={e => set('author_name', e.target.value)} required />
              </div>

              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-2">Жанр</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => set('genre', g)}
                      className="px-4 py-1.5 text-sm transition-all duration-200 border rounded-full"
                      style={{
                        backgroundColor: form.genre === g ? '#1d4ed8' : 'transparent',
                        borderColor: form.genre === g ? '#1d4ed8' : '#e4e4e7',
                        color: form.genre === g ? '#fff' : '#71717a',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
                  Текст истории
                  <span className={`ml-2 normal-case font-normal ${form.text.length < 100 ? 'text-red-400' : 'text-zinc-300'}`}>
                    {form.text.length} / мин. 100 символов
                  </span>
                </label>
                <textarea className={inputClass} rows={8} placeholder="Начни свою историю здесь..." value={form.text} onChange={e => set('text', e.target.value)} required />
              </div>

              {status === 'error' && <p className="text-red-500 text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || !form.genre}
                className="w-full py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <><Icon name="Loader" size={15} className="animate-spin" /> Отправляем...</>
                ) : (
                  <><Icon name="Send" size={15} /> Отправить на модерацию</>
                )}
              </button>
            </form>
          )}

          {status !== 'success' && (
            <div className="mt-10 border border-blue-100 rounded-xl px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Shield" size={13} className="text-blue-500" />
                  <span className="text-xs uppercase tracking-widest text-blue-500">Открытый набор</span>
                </div>
                <p className="text-zinc-800 text-sm font-medium">Ищем модераторов</p>
                <p className="text-zinc-500 text-xs mt-1">Хочешь решать, какие истории попадают на сайт?</p>
              </div>
              <button
                onClick={() => navigate('/join')}
                className="flex-shrink-0 px-4 py-2 text-xs rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
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
