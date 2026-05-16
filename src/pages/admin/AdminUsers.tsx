import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import UserName from '@/components/ui/UserName'
import UserBadge from '@/components/ui/UserBadge'
import { NAME_COLORS, NAME_EFFECTS, BADGE_EFFECTS } from '@/lib/levels'
import { AppUser, STATUS_LABEL, ROLE_LABEL } from './admin.types'

interface Props {
  users: AppUser[]
  onUpdate: (id: number, patch: { status?: string; role?: string; name_color?: string; name_effect?: string; badge_text?: string; badge_effect?: string; custom_role?: string }) => Promise<void>
  onBan: (id: number, reason: string) => Promise<void>
  onUnban: (id: number) => Promise<void>
  smallInputClass: string
}

export default function AdminUsers({ users, onUpdate, onBan, onUnban, smallInputClass }: Props) {
  const [userFilter, setUserFilter] = useState<'pending' | 'active' | 'banned' | 'all'>('pending')
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [banReason, setBanReason] = useState<Record<number, string>>({})
  const [badgeInput, setBadgeInput] = useState<Record<number, string>>({})
  const [customRoleInput, setCustomRoleInput] = useState<Record<number, string>>({})

  const userCounts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
  }
  const filteredUsers = users.filter(u => userFilter === 'all' || u.status === userFilter)

  const handleUpdate = async (id: number, patch: Parameters<Props['onUpdate']>[1]) => {
    setUserActionLoading(id)
    await onUpdate(id, patch)
    setUserActionLoading(null)
  }

  const handleBan = async (id: number) => {
    const reason = (banReason[id] || '').trim()
    if (!reason) return
    setUserActionLoading(id)
    await onBan(id, reason)
    setBanReason(prev => { const n = { ...prev }; delete n[id]; return n })
    setUserActionLoading(null)
  }

  const handleUnban = async (id: number) => {
    setUserActionLoading(id)
    await onUnban(id)
    setUserActionLoading(null)
  }

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pending', 'active', 'banned', 'all'] as const).map(f => (
          <button key={f} onClick={() => setUserFilter(f)} className="px-4 py-1.5 text-sm border rounded-sm transition-all"
            style={{ backgroundColor: userFilter === f ? '#8B0000' : 'transparent', borderColor: userFilter === f ? '#8B0000' : 'rgba(255,255,255,0.1)', color: userFilter === f ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {{ pending: 'Ожидают', active: 'Активные', banned: 'Заблокированные', all: 'Все' }[f]}
            <span className="ml-2 opacity-60 text-xs">{userCounts[f as keyof typeof userCounts]}</span>
          </button>
        ))}
      </div>
      {filteredUsers.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет пользователей</p>}
      <div className="flex flex-col gap-2">
        {filteredUsers.map(u => {
          const st = STATUS_LABEL[u.status] || STATUS_LABEL.pending
          const isOpen = expandedUser === u.id
          return (
            <motion.div key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4" onClick={() => setExpandedUser(isOpen ? null : u.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <UserName username={u.username} name_color={u.name_color} name_effect={u.name_effect} className="text-sm" />
                    <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                    <span className="text-xs text-white/30">{ROLE_LABEL[u.role]}</span>
                  </div>
                  <p className="text-white/25 text-xs">{u.email}</p>
                  {u.status === 'banned' && u.ban_reason && (
                    <p className="text-white/30 text-xs mt-0.5 italic">Причина: {u.ban_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {u.status === 'pending' && (
                    <>
                      <button onClick={e => { e.stopPropagation(); handleUpdate(u.id, { status: 'active' }) }} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                        {userActionLoading === u.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Одобрить
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleUpdate(u.id, { status: 'rejected' }) }} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                        <Icon name="X" size={12} /> Отклонить
                      </button>
                    </>
                  )}
                  {u.status === 'banned' && (
                    <button onClick={e => { e.stopPropagation(); handleUnban(u.id) }} disabled={userActionLoading === u.id} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                      <Icon name="ShieldCheck" size={12} /> Разбанить
                    </button>
                  )}
                  <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-white/20 flex-shrink-0" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>

                      {/* Системная роль */}
                      {u.status === 'active' && (
                        <div>
                          <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Системная роль</label>
                          <select value={u.role} onChange={e => handleUpdate(u.id, { role: e.target.value })}
                            className="text-xs px-3 py-2 rounded-sm border outline-none"
                            style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                            <option value="user">Пользователь</option>
                            <option value="moderator">Модератор</option>
                            <option value="admin">Администратор</option>
                          </select>
                        </div>
                      )}

                      {/* Кастомная роль */}
                      <div>
                        <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Кастомная роль</label>
                        <p className="text-white/20 text-xs mb-2">Заменяет отображаемое название роли везде на сайте</p>
                        <div className="flex gap-2">
                          <input
                            className={`${smallInputClass} flex-1`}
                            placeholder="Например: Тёмный жрец, Хранитель архива..."
                            maxLength={40}
                            value={customRoleInput[u.id] !== undefined ? customRoleInput[u.id] : (u.custom_role || '')}
                            onChange={e => setCustomRoleInput(prev => ({ ...prev, [u.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => {
                              const val = customRoleInput[u.id] !== undefined ? customRoleInput[u.id] : (u.custom_role || '')
                              handleUpdate(u.id, { custom_role: val })
                              setCustomRoleInput(prev => { const n = { ...prev }; delete n[u.id]; return n })
                            }}
                            disabled={userActionLoading === u.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm"
                            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                          >
                            <Icon name="Check" size={12} /> Сохранить
                          </button>
                          {u.custom_role && (
                            <button
                              onClick={() => handleUpdate(u.id, { custom_role: '' })}
                              disabled={userActionLoading === u.id}
                              className="px-3 py-1.5 text-xs border rounded-sm"
                              style={{ borderColor: 'rgba(139,0,0,0.4)', color: 'rgba(200,50,50,0.7)' }}
                            >
                              <Icon name="X" size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Цвет ника */}
                      <div>
                        <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Цвет ника</label>
                        <div className="flex flex-wrap gap-2">
                          {NAME_COLORS.map(c => (
                            <button key={c.value} title={c.label}
                              onClick={() => handleUpdate(u.id, { name_color: c.value })}
                              className="w-6 h-6 rounded-sm border-2 transition-all flex items-center justify-center"
                              style={{ backgroundColor: c.value || '#333', borderColor: u.name_color === c.value ? '#fff' : 'transparent' }}>
                              {!c.value && <span className="text-white/40 text-xs">A</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Эффект ника */}
                      <div>
                        <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Эффект ника</label>
                        <div className="flex flex-wrap gap-2">
                          {NAME_EFFECTS.map(ef => (
                            <button key={ef.value}
                              onClick={() => handleUpdate(u.id, { name_effect: ef.value })}
                              className="px-3 py-1 text-xs border rounded-sm transition-all"
                              style={{
                                backgroundColor: u.name_effect === ef.value ? '#8B0000' : 'transparent',
                                borderColor: u.name_effect === ef.value ? '#8B0000' : 'rgba(255,255,255,0.1)',
                                color: u.name_effect === ef.value ? '#fff' : 'rgba(255,255,255,0.4)',
                              }}>
                              {ef.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Бейдж */}
                      <div>
                        <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Звание / Бейдж</label>
                        <div className="flex gap-2 mb-3">
                          <input
                            className={`${smallInputClass} flex-1`}
                            placeholder="Текст звания (макс. 40 символов)..."
                            maxLength={40}
                            value={badgeInput[u.id] !== undefined ? badgeInput[u.id] : (u.badge_text || '')}
                            onChange={e => setBadgeInput(prev => ({ ...prev, [u.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => {
                              const text = badgeInput[u.id] !== undefined ? badgeInput[u.id] : (u.badge_text || '')
                              handleUpdate(u.id, { badge_text: text })
                              setBadgeInput(prev => { const n = { ...prev }; delete n[u.id]; return n })
                            }}
                            disabled={userActionLoading === u.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm"
                            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                          >
                            <Icon name="Check" size={12} /> Сохранить
                          </button>
                          {u.badge_text && (
                            <button
                              onClick={() => handleUpdate(u.id, { badge_text: '', badge_effect: '' })}
                              disabled={userActionLoading === u.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm"
                              style={{ borderColor: 'rgba(139,0,0,0.4)', color: 'rgba(200,50,50,0.7)' }}
                            >
                              <Icon name="X" size={12} />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {BADGE_EFFECTS.map(ef => (
                            <button key={ef.value}
                              onClick={() => handleUpdate(u.id, { badge_effect: ef.value })}
                              className="px-2 py-1 text-xs rounded-sm transition-all"
                              style={{
                                border: u.badge_effect === ef.value ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.07)',
                                opacity: u.badge_effect === ef.value ? 1 : 0.6,
                                fontWeight: u.badge_effect === ef.value ? 600 : 400,
                              }}
                            >
                              {ef.value ? <UserBadge text={ef.label} effect={ef.value} /> : <span className="text-white/30">{ef.label}</span>}
                            </button>
                          ))}
                        </div>
                        {u.badge_text && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-white/20 text-xs">Превью:</span>
                            <UserBadge text={u.badge_text} effect={u.badge_effect} />
                          </div>
                        )}
                      </div>

                      {/* Бан */}
                      {u.status !== 'banned' && (
                        <div>
                          <label className="block text-white/25 text-xs uppercase tracking-wider mb-2">Заблокировать</label>
                          <div className="flex gap-2">
                            <input
                              className={`${smallInputClass} flex-1`}
                              placeholder="Причина блокировки..."
                              value={banReason[u.id] || ''}
                              onChange={e => setBanReason(prev => ({ ...prev, [u.id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleBan(u.id)}
                              disabled={!banReason[u.id]?.trim() || userActionLoading === u.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-sm"
                              style={{ borderColor: '#8B0000', color: '#8B0000', opacity: !banReason[u.id]?.trim() ? 0.4 : 1 }}>
                              {userActionLoading === u.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Ban" size={12} />} Бан
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}