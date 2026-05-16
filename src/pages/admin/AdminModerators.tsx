import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { ModApp, STATUS_LABEL } from './admin.types'

interface Props {
  modApps: ModApp[]
  onModerate: (id: number, action: 'approve' | 'reject') => Promise<void>
}

export default function AdminModerators({ modApps, onModerate }: Props) {
  const [modFilter, setModFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedMod, setExpandedMod] = useState<number | null>(null)
  const [modActionLoading, setModActionLoading] = useState<number | null>(null)

  const modCounts = {
    all: modApps.length,
    pending: modApps.filter(a => a.status === 'pending').length,
    approved: modApps.filter(a => a.status === 'approved').length,
    rejected: modApps.filter(a => a.status === 'rejected').length,
  }
  const filteredMods = modApps.filter(a => modFilter === 'all' || a.status === modFilter)

  const handleModerate = async (id: number, action: 'approve' | 'reject') => {
    setModActionLoading(id)
    await onModerate(id, action)
    setExpandedMod(null)
    setModActionLoading(null)
  }

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setModFilter(f)} className="px-4 py-1.5 text-sm border rounded-sm transition-all"
            style={{ backgroundColor: modFilter === f ? '#8B0000' : 'transparent', borderColor: modFilter === f ? '#8B0000' : 'rgba(255,255,255,0.1)', color: modFilter === f ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {{ pending: 'На рассмотрении', approved: 'Принятые', rejected: 'Отклонённые', all: 'Все' }[f]}
            <span className="ml-2 opacity-60 text-xs">{modCounts[f]}</span>
          </button>
        ))}
      </div>
      {filteredMods.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет заявок</p>}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filteredMods.map(app => {
            const st = STATUS_LABEL[app.status]
            const isOpen = expandedMod === app.id
            return (
              <motion.div key={app.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4" onClick={() => setExpandedMod(isOpen ? null : app.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                    </div>
                    <p className="text-white text-base">{app.name}</p>
                    <p className="text-white/30 text-xs mt-0.5">{app.contact} · {new Date(app.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-white/30 flex-shrink-0" />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="px-5 pb-5">
                        <p className="text-white/50 text-sm leading-7 mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>{app.reason}</p>
                        {app.status === 'pending' ? (
                          <div className="flex gap-3">
                            <button onClick={() => handleModerate(app.id, 'approve')} disabled={modActionLoading === app.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                              {modActionLoading === app.id ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />} Принять
                            </button>
                            <button onClick={() => handleModerate(app.id, 'reject')} disabled={modActionLoading === app.id} className="flex items-center gap-2 px-5 py-2 text-sm border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                              <Icon name="X" size={14} /> Отклонить
                            </button>
                          </div>
                        ) : <p className="text-white/20 text-xs">Решение уже принято</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
