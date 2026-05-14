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
      else navigate('/catalog')
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
        <h1 className="text-2xl text-white mb-1" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Вход</h1>
        <p className="text-white/30 text-sm mb-8">Войди в свой аккаунт</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className={inputClass} placeholder="Логин или email" value={form.login} onChange={e => set('login', e.target.value)} required autoFocus />
          <input className={inputClass} type="password" placeholder="Пароль" value={form.password} onChange={e => set('password', e.target.value)} required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 text-sm tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2 transition-all" style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}>
            {loading ? <><Icon name="Loader" size={15} className="animate-spin" />Входим...</> : <><Icon name="LogIn" size={15} />Войти</>}
          </button>
        </form>
        <p className="text-white/30 text-sm mt-6 text-center">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-[#8B0000] hover:text-red-400 transition-colors">Подать заявку</Link>
        </p>
      </motion.div>
    </div>
  )
}
