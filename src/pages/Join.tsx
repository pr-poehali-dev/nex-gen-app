import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'

const API_URL = 'https://functions.poehali.dev/3c308c13-780b-4cbd-82f9-2544dd692ce9'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function Join() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({ name: '', contact: '', reason: '' })

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
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (!res.ok) { setErrorMsg(parsed.error); setStatus('error') }
      else setStatus('success')
    } catch {
      setErrorMsg('Ошибка соединения. Попробуй ещё раз.')
      setStatus('error')
    }
  }

  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20 resize-none"

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.2) 0%, transparent 60%)' }} />

      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button onClick={() => navigate('/catalog')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          Каталог
        </button>
        <button onClick={() => navigate('/')} className="text-white text-lg font-bold tracking-wider hover:text-red-400 transition-colors" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <div className="w-24" />
      </header>

      <main className="max-w-2xl mx-auto px-6 md:px-8 py-14">
        {status === 'success' ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <div className="text-5xl mb-6">🕯️</div>
            <h2 className="text-2xl text-white mb-3" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Заявка отправлена</h2>
            <p className="text-white/40 text-sm mb-8">Мы рассмотрим её и свяжемся с тобой.</p>
            <button onClick={() => navigate('/catalog')} className="text-[#8B0000] hover:text-red-400 transition-colors text-sm flex items-center gap-2 mx-auto">
              <Icon name="ArrowLeft" size={14} />
              Вернуться в каталог
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

            {/* Заголовок */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 border rounded-sm mb-5 text-xs tracking-widest uppercase" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                <Icon name="Shield" size={12} />
                Открытый набор
              </div>
              <h1 className="text-3xl md:text-4xl text-white mb-4" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Стать модератором
              </h1>
              <p className="text-white/40 text-sm leading-7">
                Модераторы ShadowTales читают присланные истории и решают — достойны ли они попасть в каталог. Это ответственность перед теми, кто приходит сюда за настоящим страхом.
              </p>
            </div>

            {/* Что нужно */}
            <div className="mb-10 space-y-3">
              {[
                { icon: 'BookOpen', text: 'Читать и оценивать присланные истории' },
                { icon: 'Shield', text: 'Следить за качеством и атмосферой контента' },
                { icon: 'Clock', text: 'Уделять хотя бы пару часов в неделю' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 text-white/50 text-sm">
                  <Icon name={item.icon as 'BookOpen'} size={14} className="text-[#8B0000] flex-shrink-0" />
                  {item.text}
                </div>
              ))}
            </div>

            <div className="border-b mb-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white/40 text-xs mb-2 uppercase tracking-wider">Имя или псевдоним</label>
                <input className={inputClass} placeholder="Как тебя называть?" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-2 uppercase tracking-wider">Как с тобой связаться</label>
                <input className={inputClass} placeholder="Telegram, email или другое..." value={form.contact} onChange={e => set('contact', e.target.value)} required />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-2 uppercase tracking-wider">
                  Почему хочешь стать модератором?
                  <span className="ml-2 normal-case" style={{ color: form.reason.length < 30 ? '#8B0000' : 'rgba(255,255,255,0.2)' }}>
                    {form.reason.length} / мин. 30 символов
                  </span>
                </label>
                <textarea className={inputClass} rows={5} placeholder="Расскажи о себе и своей любви к хоррору..." value={form.reason} onChange={e => set('reason', e.target.value)} required />
              </div>

              {status === 'error' && <p className="text-red-500 text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 text-sm tracking-widest uppercase transition-all duration-300 border rounded-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}
              >
                {status === 'loading'
                  ? <><Icon name="Loader" size={16} className="animate-spin" /> Отправляем...</>
                  : <><Icon name="Send" size={16} /> Отправить заявку</>
                }
              </button>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  )
}
