import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import UserName from '@/components/ui/UserName'
import { AUTH_URL, getSessionId, getCachedUser } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

interface ChatMessage {
  id: number
  text: string
  created_at: string
  username: string
  avatar_url: string
  name_color: string
  name_effect: string
  role: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastIdRef = useRef<number>(0)
  const navigate = useNavigate()
  const currentUser = getCachedUser()

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${AUTH_URL}?action=chat_get`)
      if (!res.ok) return
      const data = await res.json()
      const msgs: ChatMessage[] = data.messages || []
      setMessages(msgs)
      if (msgs.length > 0) {
        const newId = msgs[msgs.length - 1].id
        if (!open && newId > lastIdRef.current && lastIdRef.current !== 0) {
          setUnread(u => u + 1)
        }
        lastIdRef.current = newId
      }
    } catch (_e) { /* ignore network errors */ }
  }, [open])

  useEffect(() => {
    fetchMessages()
    if (!open) return
    pollRef.current = setInterval(fetchMessages, 30000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open, fetchMessages])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
      inputRef.current?.focus()
    }
  }, [open, messages.length])

  const send = async () => {
    if (!text.trim() || sending) return
    if (!currentUser) { navigate('/login'); return }
    setSending(true)
    try {
      const res = await fetch(`${AUTH_URL}?action=chat_send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': getSessionId() },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setText('')
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Кнопка */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm"
        title="Чат сообщества"
      >
        <Icon name="MessageCircle" size={16} />
        <span className="hidden sm:inline">Чат</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold" style={{ backgroundColor: '#8B0000', color: '#fff' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Панель */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed z-50 flex flex-col"
              style={{
                top: 56,
                right: 16,
                width: 'min(360px, calc(100vw - 32px))',
                height: 'min(480px, calc(100vh - 80px))',
                backgroundColor: '#0e0e0e',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 4,
              }}
            >
              {/* Шапка */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-white/60 text-xs uppercase tracking-widest flex items-center gap-2">
                  <Icon name="MessageCircle" size={13} className="text-[#8B0000]" />
                  Чат сообщества
                </span>
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {messages.length === 0 && (
                  <p className="text-center text-white/20 text-xs py-8">Пока нет сообщений. Начни первым!</p>
                )}
                {messages.map(msg => {
                  const isOwn = currentUser?.username === msg.username
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Аватар */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(139,0,0,0.2)' }}>
                        {msg.avatar_url
                          ? <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/40">{msg.username[0]?.toUpperCase()}</div>
                        }
                      </div>
                      {/* Пузырь */}
                      <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <UserName username={msg.username} name_color={msg.name_color} name_effect={msg.name_effect} className="text-[11px]" />
                          <span className="text-white/20 text-[10px]">{formatTime(msg.created_at)}</span>
                        </div>
                        <div
                          className="px-3 py-2 rounded text-xs leading-relaxed break-words"
                          style={{
                            backgroundColor: isOwn ? 'rgba(139,0,0,0.25)' : 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.75)',
                            borderRadius: isOwn ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Ввод */}
              <div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {currentUser ? (
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={inputRef}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={onKey}
                      placeholder="Написать сообщение..."
                      rows={1}
                      maxLength={500}
                      className="flex-1 resize-none bg-transparent border rounded text-sm text-white/80 placeholder-white/20 px-3 py-2 outline-none focus:border-white/20 transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: "'Inter', sans-serif", minHeight: 36, maxHeight: 90 }}
                    />
                    <button
                      onClick={send}
                      disabled={!text.trim() || sending}
                      className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded transition-all"
                      style={{ backgroundColor: text.trim() ? '#8B0000' : 'rgba(255,255,255,0.05)', color: text.trim() ? '#fff' : 'rgba(255,255,255,0.2)' }}
                    >
                      {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => navigate('/login')} className="w-full text-center text-xs py-2 rounded transition-colors" style={{ color: '#8B0000', backgroundColor: 'rgba(139,0,0,0.08)' }}>
                    Войди, чтобы писать в чат
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}