import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { Submission, STATUS_LABEL } from './admin.types'

interface Props {
  stories: Submission[]
  isAdmin: boolean
  onModerate: (id: number, action: 'approve' | 'reject' | 'delete', comment: string) => Promise<void>
  onSaveEdit: (id: number, form: { title: string; text: string; genre: string }) => Promise<void>
  smallInputClass: string
}

export default function AdminStories({ stories, isAdmin, onModerate, onSaveEdit, smallInputClass }: Props) {
  const [storyFilter, setStoryFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [expandedStory, setExpandedStory] = useState<number | null>(null)
  const [storyActionLoading, setStoryActionLoading] = useState<number | null>(null)
  const [storyComment, setStoryComment] = useState<Record<number, string>>({})
  const [editingStory, setEditingStory] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', text: '', genre: '' })

  const storyCounts = {
    all: stories.length,
    pending: stories.filter(s => s.status === 'pending').length,
    approved: stories.filter(s => s.status === 'approved').length,
    rejected: stories.filter(s => s.status === 'rejected').length,
  }
  const filteredStories = stories.filter(s => storyFilter === 'all' || s.status === storyFilter)

  const handleModerate = async (id: number, action: 'approve' | 'reject' | 'delete') => {
    setStoryActionLoading(id)
    await onModerate(id, action, storyComment[id] || '')
    setExpandedStory(null)
    setStoryComment(prev => { const n = { ...prev }; delete n[id]; return n })
    setStoryActionLoading(null)
  }

  const handleSaveEdit = async (id: number) => {
    setStoryActionLoading(id)
    await onSaveEdit(id, editForm)
    setEditingStory(null)
    setStoryActionLoading(null)
  }

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setStoryFilter(f)} className="px-4 py-1.5 text-sm border rounded-sm transition-all"
            style={{ backgroundColor: storyFilter === f ? '#8B0000' : 'transparent', borderColor: storyFilter === f ? '#8B0000' : 'rgba(255,255,255,0.1)', color: storyFilter === f ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {{ pending: 'На модерации', approved: 'Одобренные', rejected: 'Отклонённые', all: 'Все' }[f]}
            <span className="ml-2 opacity-60 text-xs">{storyCounts[f]}</span>
          </button>
        ))}
      </div>
      {filteredStories.length === 0 && <p className="text-white/30 text-sm py-12 text-center">Нет историй</p>}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filteredStories.map(story => {
            const st = STATUS_LABEL[story.status] || STATUS_LABEL.rejected
            const isOpen = expandedStory === story.id
            const isEditing = editingStory === story.id
            return (
              <motion.div key={story.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4" onClick={() => setExpandedStory(isOpen ? null : story.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-sm border" style={{ borderColor: '#8B0000', color: '#8B0000' }}>{story.genre}</span>
                      <span className="text-xs px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                      {story.moderated_by && <span className="text-white/20 text-xs">модератор: {story.moderated_by}</span>}
                    </div>
                    <p className="text-white text-base truncate" style={{ fontFamily: "'Cinzel Decorative', serif" }}>{story.title}</p>
                    <p className="text-white/30 text-xs mt-0.5">{story.author_name} · {new Date(story.created_at).toLocaleDateString('ru-RU')}</p>
                    {story.moderator_comment && (
                      <p className="text-white/40 text-xs mt-1 italic">Комментарий: {story.moderator_comment}</p>
                    )}
                  </div>
                  <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-white/30 flex-shrink-0" />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>

                        {isEditing ? (
                          <div className="space-y-3 mb-4">
                            <input className={`${smallInputClass} w-full`} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Заголовок" />
                            <textarea className={`${smallInputClass} w-full resize-none`} rows={8} value={editForm.text} onChange={e => setEditForm(f => ({ ...f, text: e.target.value }))} placeholder="Текст истории" />
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveEdit(story.id)} disabled={storyActionLoading === story.id} className="flex items-center gap-1 px-4 py-1.5 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                {storyActionLoading === story.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Сохранить
                              </button>
                              <button onClick={() => setEditingStory(null)} className="px-4 py-1.5 text-xs border rounded-sm" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>Отмена</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-white/50 text-sm leading-7 whitespace-pre-wrap mb-4 max-h-64 overflow-y-auto pr-2">{story.text}</div>
                        )}

                        {story.status === 'pending' && !isEditing && (
                          <div className="mb-4">
                            <textarea
                              className={`${smallInputClass} w-full resize-none`}
                              rows={2}
                              placeholder="Комментарий к решению (необязательно)..."
                              value={storyComment[story.id] || ''}
                              onChange={e => setStoryComment(prev => ({ ...prev, [story.id]: e.target.value }))}
                            />
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex gap-2 flex-wrap">
                            {story.status === 'pending' && (
                              <>
                                <button onClick={() => handleModerate(story.id, 'approve')} disabled={storyActionLoading === story.id} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm" style={{ borderColor: '#2e7d32', color: '#2e7d32' }}>
                                  {storyActionLoading === story.id ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />} Опубликовать
                                </button>
                                <button onClick={() => handleModerate(story.id, 'reject')} disabled={storyActionLoading === story.id} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm" style={{ borderColor: '#8B0000', color: '#8B0000' }}>
                                  <Icon name="X" size={12} /> Отклонить
                                </button>
                              </>
                            )}
                            <button onClick={() => { setEditingStory(story.id); setEditForm({ title: story.title, text: story.text, genre: story.genre }) }} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                              <Icon name="Pencil" size={12} /> Редактировать
                            </button>
                            {isAdmin && (
                              <button onClick={() => { if (confirm('Удалить историю?')) handleModerate(story.id, 'delete') }} disabled={storyActionLoading === story.id} className="flex items-center gap-1.5 px-4 py-2 text-xs border rounded-sm ml-auto" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
                                <Icon name="Trash2" size={12} /> Удалить
                              </button>
                            )}
                          </div>
                        )}
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
