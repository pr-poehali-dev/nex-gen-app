import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { AUTH_URL, saveSession } from '@/lib/auth'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' })
  const [sentEmail, setSentEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])

  const set = (f: string, v: string) => { setForm(p => ({ ...p, [f]: v })); setError('') }

  // Таймер повторной отправки
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Шаг 1 — отправить код
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password2) { setError('Пароли не совпадают'); return }
    if (form.password.length < 6) { setError('Пароль минимум 6 символов'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${AUTH_URL}?action=register_send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      })
      const data = await res.json()
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (!res.ok) { setError(parsed.error); setLoading(false); return }
      setSentEmail(form.email)
      setStep('code')
      setResendCooldown(60)
      setTimeout(() => codeRefs.current[0]?.focus(), 100)
    } catch {
      setError('Ошибка соединения')
    }
    setLoading(false)
  }

  // Ввод кода — автопереход между ячейками
  const handleCodeInput = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = v
    setCode(next)
    setError('')
    if (v && i < 5) codeRefs.current[i + 1]?.focus()
    if (next.every(c => c !== '') && next.join('').length === 6) {
      verifyCode(next.join(''))
    }
  }

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      setError('')
      verifyCode(pasted)
    }
  }

  // Шаг 2 — проверить код
  const verifyCode = async (codeStr: string) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${AUTH_URL}?action=register_verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sentEmail, code: codeStr }),
      })
      const data = await res.json()
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (!res.ok) {
        setError(parsed.error)
        setCode(['', '', '', '', '', ''])
        setTimeout(() => codeRefs.current[0]?.focus(), 50)
        setLoading(false)
        return
      }
      saveSession(parsed.session_id, parsed.user)
      navigate('/catalog')
    } catch {
      setError('Ошибка соединения')
    }
    setLoading(false)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyCode(code.join(''))
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${AUTH_URL}?action=register_send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      })
      if (res.ok) {
        setCode(['', '', '', '', '', ''])
        setResendCooldown(60)
        setTimeout(() => codeRefs.current[0]?.focus(), 100)
      }
    } catch { /* ignore */ }
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
        className="w-full max-w-sm px-6 relative"
      >
        <button
          onClick={() => step === 'code' ? setStep('form') : navigate('/')}
          className="text-white/25 hover:text-white transition-colors tracking-widest text-sm uppercase mb-12 flex items-center gap-2"
        >
          <Icon name="ArrowLeft" size={12} />
          {step === 'code' ? 'Назад' : 'ShadowTales'}
        </button>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}>
              <h1 className="text-3xl text-white mb-1" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Регистрация
              </h1>
              <p className="text-white/25 text-sm mb-10">Создай аккаунт — займёт минуту</p>

              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label className="block text-white/30 text-xs uppercase tracking-wider mb-3">Имя пользователя</label>
                  <input className={inputClass} placeholder="Придумай ник" value={form.username} onChange={e => set('username', e.target.value)} required autoFocus minLength={3} />
                </div>
                <div>
                  <label className="block text-white/30 text-xs uppercase tracking-wider mb-3">Email</label>
                  <input className={inputClass} type="email" placeholder="email@mail.ru" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-white/30 text-xs uppercase tracking-wider mb-3">Пароль</label>
                  <input className={inputClass} type="password" placeholder="•••••• (мин. 6 символов)" value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-white/30 text-xs uppercase tracking-wider mb-3">Повтори пароль</label>
                  <input className={inputClass} type="password" placeholder="••••••" value={form.password2} onChange={e => set('password2', e.target.value)} required />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm" style={{ color: '#cc3333' }}>
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2 transition-all"
                  style={{ backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff' }}
                >
                  {loading
                    ? <><Icon name="Loader" size={13} className="animate-spin" /> Отправляем код...</>
                    : <><Icon name="Mail" size={13} /> Получить код</>
                  }
                </button>
              </form>

              <p className="text-white/20 text-xs mt-8 text-center">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="text-[#8B0000] hover:text-red-400 transition-colors">Войти</Link>
              </p>
            </motion.div>
          )}

          {step === 'code' && (
            <motion.div key="code" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <div className="w-8 h-px mb-8" style={{ backgroundColor: '#8B0000' }} />
              <h1 className="text-2xl text-white mb-2" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Введи код
              </h1>
              <p className="text-white/30 text-sm mb-1">Мы отправили 6-значный код на</p>
              <p className="text-white/60 text-sm mb-10 truncate">{sentEmail}</p>

              <form onSubmit={handleVerify}>
                {/* 6 ячеек для кода */}
                <div className="flex gap-2 mb-6" onPaste={handleCodePaste}>
                  {code.map((c, i) => (
                    <input
                      key={i}
                      ref={el => { codeRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={c}
                      onChange={e => handleCodeInput(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      className="flex-1 text-center text-white text-xl py-3 border-b-2 outline-none bg-transparent transition-colors"
                      style={{
                        borderColor: c ? '#8B0000' : 'rgba(255,255,255,0.12)',
                        color: c ? '#fff' : 'rgba(255,255,255,0.3)',
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm mb-4" style={{ color: '#cc3333' }}>
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.some(c => c === '')}
                  className="w-full py-3 text-xs tracking-widest uppercase border rounded-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: '#8B0000', borderColor: '#8B0000', color: '#fff',
                    opacity: code.some(c => c === '') ? 0.4 : 1,
                  }}
                >
                  {loading
                    ? <><Icon name="Loader" size={13} className="animate-spin" /> Проверяем...</>
                    : <><Icon name="Check" size={13} /> Подтвердить</>
                  }
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs transition-colors"
                  style={{ color: resendCooldown > 0 ? 'rgba(255,255,255,0.2)' : '#8B0000' }}
                >
                  {resendCooldown > 0 ? `Отправить повторно через ${resendCooldown} с` : 'Отправить код повторно'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
