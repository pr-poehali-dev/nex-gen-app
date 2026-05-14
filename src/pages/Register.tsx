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

  const inputClass = "w-full bg-transparent border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20"

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#080808' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(60,0,0,0.2) 0%, transparent 60%)' }} />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm relative">
        <button onClick={() => navigate('/')} className="text-white/30 hover:text-white transition-colors text-lg font-bold tracking-wider mb-10 block" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>

        {success ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <div className="text-5xl mb-5">🕯️</div>
            <h2 className="text-xl text-white mb-3" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Заявка отправлена</h2>
            <p className="text-white/40 text-sm mb-6">Администратор рассмотрит её и одобрит доступ. После этого ты сможешь войти.</p>
            <Link to="/login" className="text-[#8B0000] hover:text-red-400 transition-colors text-sm">Перейти ко входу</Link>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl text-white mb-1" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Регистрация</h1>
            <p className="text-white/30 text-sm mb-8">Заявка будет одобрена администратором</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input className={inputClass} placeholder="Имя пользователя" value={form.username} onChange={e => set('username', e.target.value)} required autoFocus />
              <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} required />
              <input className={inputClass} type="password" placeholder="Пароль (мин. 6 символов)" value={form.password} onChange={e => set('password', e.target.value)} required />
              <input className={inputClass} type="password" placeholder="Повтори пароль" value={form.password2} onChange={e => set('password2', e.target.value)} required />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 text-sm tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2" style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}>
                {loading ? <><Icon name="Loader" size={15} className="animate-spin" />Отправляем...</> : <><Icon name="UserPlus" size={15} />Подать заявку</>}
              </button>
            </form>
            <p className="text-white/30 text-sm mt-6 text-center">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-[#8B0000] hover:text-red-400 transition-colors">Войти</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
