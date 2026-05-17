import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL } from '@/lib/auth'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password2) { setError('Пароли не совпадают'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${AUTH_URL}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      })
      const data = await res.json()
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (!res.ok) { setError(parsed.error); setLoading(false); return }
      setSuccess(true)
    } catch {
      setError('Ошибка соединения')
    }
    setLoading(false)
  }

  const inputClass = "w-full border border-zinc-200 rounded-lg px-4 py-3 text-zinc-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-zinc-300 bg-white"

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm px-6"
      >
        <button
          onClick={() => navigate('/')}
          className="text-zinc-400 hover:text-zinc-700 transition-colors text-sm mb-10 flex items-center gap-2"
        >
          <Icon name="ArrowLeft" size={14} />
          ShadowTales
        </button>

        {success ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-8 h-0.5 mb-8 bg-blue-600" />
            <h1 className="text-3xl text-zinc-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Заявка отправлена
            </h1>
            <p className="text-zinc-500 text-sm leading-7 mb-8">
              Администратор рассмотрит твою заявку. После одобрения ты сможешь войти.
            </p>
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2">
              <Icon name="ArrowRight" size={14} /> Перейти ко входу
            </Link>
          </motion.div>
        ) : (
          <>
            <h1 className="text-3xl text-zinc-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Регистрация
            </h1>
            <p className="text-zinc-400 text-sm mb-8">Заявка рассматривается администратором</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Имя пользователя</label>
                <input className={inputClass} placeholder="Придумай ник" value={form.username} onChange={e => set('username', e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Email</label>
                <input className={inputClass} type="email" placeholder="email@mail.ru" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Пароль</label>
                <input className={inputClass} type="password" placeholder="мин. 6 символов" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Повтори пароль</label>
                <input className={inputClass} type="password" placeholder="••••••" value={form.password2} onChange={e => set('password2', e.target.value)} required />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 mt-2"
              >
                {loading ? <><Icon name="Loader" size={14} className="animate-spin" /> Отправляем...</> : 'Подать заявку'}
              </button>
            </form>

            <p className="text-zinc-400 text-xs mt-6 text-center">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 transition-colors">Войти</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
