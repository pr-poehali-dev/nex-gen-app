import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL, saveSession } from '@/lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`${AUTH_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (!res.ok) { setError(parsed.error); setLoading(false); return }
      saveSession(parsed.session_id, parsed.user)
      const role = parsed.user.role
      if (role === 'admin' || role === 'moderator') navigate('/admin')
      else navigate('/account')
    } catch {
      setError('Ошибка соединения')
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-transparent border-b border-white/10 px-0 py-3 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20"

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(60,0,0,0.18) 0%, transparent 60%)' }} />
      <div className="absolute left-0 top-0 h-full w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,0,0,0.25), transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm px-8 relative"
      >
        <button
          onClick={() => navigate('/')}
          className="text-white/25 hover:text-white transition-colors tracking-widest text-xs uppercase mb-12 flex items-center gap-2"
        >
          <Icon name="ArrowLeft" size={12} /> ShadowTales
        </button>

        <h1 className="text-3xl text-white mb-1" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Вход
        </h1>
        <p className="text-white/25 text-sm mb-10">Добро пожаловать обратно</p>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block text-white/30 text-xs uppercase tracking-wider mb-3">Логин или email</label>
            <input className={inputClass} placeholder="username или email" value={form.login} onChange={e => set('login', e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="block text-white/30 text-xs uppercase tracking-wider mb-3">Пароль</label>
            <input className={inputClass} type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>

          {error && <p className="text-sm" style={{ color: '#cc3333' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2 transition-all duration-300"
            style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}
          >
            {loading ? <><Icon name="Loader" size={13} className="animate-spin" /> Входим...</> : 'Войти'}
          </button>
        </form>

        <p className="text-white/20 text-xs mt-8 text-center">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-[#8B0000] hover:text-red-400 transition-colors">Подать заявку</Link>
        </p>
      </motion.div>
    </div>
  )
}
