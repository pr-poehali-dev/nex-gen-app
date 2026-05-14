import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import UserName from '@/components/ui/UserName'
import { AUTH_URL, getSessionId, getCachedUser, fetchMe } from '@/lib/auth'

const sid = getSessionId()

interface Dialog {
  partner_id: number
  partner_username: string
  partner_avatar: string
  name_color: string
  name_effect: string
  last_at: string
  last_text: string
  unread: number
}

interface Message {
  id: number
  from_user_id: number
  to_user_id: number
  text: string
  is_read: boolean
  created_at: string
}

interface Partner {
  id: number
  username: string
  avatar_url: string
  role: string
  name_color: string
  name_effect: string
}

function timeAgo(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function Avatar({ url, username, size = 9 }: { url: string; username: string; size?: number }) {
  const s = `w-${size} h-${size}`
  return (
    <div className={`${s} rounded-sm flex-shrink-0 overflow-hidden`} style={{ border: '1px solid rgba(139,0,0,0.3)' }}>
      {url
        ? <img src={url} alt={username} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(139,0,0,0.15)', color: '#8B0000', fontFamily: "'Cinzel Decorative', serif" }}>
            {username[0].toUpperCase()}
          </div>
      }
    </div>
  )
}

export default function Messages() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const me = getCachedUser()

  const [dialogs, setDialogs] = useState<Dialog[]>([])
  const [partner, setPartner] = useState<Partner | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMe().then(u => {
      if (!u) { navigate('/login'); return }
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (!authChecked) return
    loadDialogs()
  }, [authChecked])

  useEffect(() => {
    if (!authChecked || !userId) return
    loadChat(Number(userId))
  }, [authChecked, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadDialogs = async () => {
    const res = await fetch(`${AUTH_URL}?action=messages_list`, { headers: { 'X-Session-Id': sid } })
    const data = await res.json()
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    setDialogs(Array.isArray(parsed) ? parsed : [])
    setLoading(false)
  }

  const loadChat = async (uid: number) => {
    const res = await fetch(`${AUTH_URL}?action=messages_chat&with=${uid}`, { headers: { 'X-Session-Id': sid } })
    const data = await res.json()
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (parsed.partner) {
      setPartner(parsed.partner)
      setMessages(parsed.messages || [])
      // Помечаем как прочитанные
      fetch(`${AUTH_URL}?action=messages_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
        body: JSON.stringify({ from_user_id: uid }),
      })
      setDialogs(prev => prev.map(d => d.partner_id === uid ? { ...d, unread: 0 } : d))
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !userId) return
    setSending(true)
    const res = await fetch(`${AUTH_URL}?action=messages_send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
      body: JSON.stringify({ to_user_id: Number(userId), text: text.trim() }),
    })
    const data = await res.json()
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (parsed.id) {
      setMessages(prev => [...prev, parsed])
      setText('')
      loadDialogs()
    }
    setSending(false)
  }

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808' }}>
      <Icon name="Loader" size={16} className="text-white/20 animate-spin" />
    </div>
  )

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      {/* Шапка */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(8,8,8,0.95)' }}>
        <button onClick={() => userId ? navigate('/messages') : navigate('/catalog')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          {userId ? 'Диалоги' : 'Каталог'}
        </button>
        <button onClick={() => navigate('/')} className="text-white font-bold tracking-wider hover:text-red-400 transition-colors" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          ShadowTales
        </button>
        <div className="w-20" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Список диалогов */}
        <div className={`${userId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-white/5 flex-shrink-0`}>
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-white/40 text-xs uppercase tracking-wider">Сообщения</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <div className="flex items-center justify-center py-12"><Icon name="Loader" size={16} className="text-white/20 animate-spin" /></div>}
            {!loading && dialogs.length === 0 && (
              <p className="text-white/20 text-sm text-center py-12 px-4">Нет диалогов. Напиши кому-нибудь первым!</p>
            )}
            {dialogs.map(d => (
              <button
                key={d.partner_id}
                onClick={() => navigate(`/messages/${d.partner_id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 text-left"
                style={{ backgroundColor: Number(userId) === d.partner_id ? 'rgba(139,0,0,0.08)' : 'transparent' }}
              >
                <Avatar url={d.partner_avatar} username={d.partner_username} size={9} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <UserName username={d.partner_username} role="user" name_color={d.name_color} name_effect={d.name_effect} className="text-sm" />
                    <span className="text-white/20 text-xs flex-shrink-0">{timeAgo(d.last_at)}</span>
                  </div>
                  <p className="text-white/30 text-xs truncate">{d.last_text}</p>
                </div>
                {d.unread > 0 && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: '#8B0000', color: '#fff' }}>
                    {d.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Чат */}
        {userId && partner ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Шапка чата */}
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-white/5">
              <button onClick={() => navigate(`/u/${partner.username}`)} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                <Avatar url={partner.avatar_url} username={partner.username} size={8} />
                <UserName username={partner.username} role={partner.role} name_color={partner.name_color} name_effect={partner.name_effect} className="text-sm" />
              </button>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isMe = msg.from_user_id === me?.id
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-xs md:max-w-md px-4 py-2.5 rounded-sm text-sm leading-6"
                        style={{
                          backgroundColor: isMe ? 'rgba(139,0,0,0.25)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isMe ? 'rgba(139,0,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        <p>{msg.text}</p>
                        <p className="text-xs mt-1 text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>{timeAgo(msg.created_at)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Форма */}
            <form onSubmit={sendMessage} className="flex-shrink-0 flex items-end gap-3 px-5 py-4 border-t border-white/5">
              <textarea
                className="flex-1 bg-transparent border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm outline-none focus:border-[#8B0000] transition-colors placeholder:text-white/20 resize-none"
                rows={1}
                placeholder="Написать сообщение..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent) } }}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center border rounded-sm transition-all"
                style={{ borderColor: '#8B0000', backgroundColor: text.trim() ? '#8B0000' : 'transparent', color: '#fff', opacity: !text.trim() ? 0.4 : 1 }}
              >
                {sending ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
              </button>
            </form>
          </div>
        ) : !userId ? null : (
          <div className="flex-1 flex items-center justify-center">
            <Icon name="Loader" size={16} className="text-white/20 animate-spin" />
          </div>
        )}

        {/* Плейсхолдер если чат не выбран на десктопе */}
        {!userId && (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <p className="text-white/20 text-sm">Выбери диалог</p>
          </div>
        )}
      </div>
    </div>
  )
}
