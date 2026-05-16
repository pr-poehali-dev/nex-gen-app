import Icon from '@/components/ui/icon'
import { ModerationStats, ROLE_LABEL } from './admin.types'

interface Props {
  stats: ModerationStats | null
  statsLoading: boolean
  onRefresh: () => void
}

export default function AdminStats({ stats, statsLoading, onRefresh }: Props) {
  return (
    <>
      {statsLoading && <div className="py-16 flex justify-center"><Icon name="Loader" size={20} className="text-white/30 animate-spin" /></div>}
      {!statsLoading && stats && (
        <div className="space-y-8">
          {/* Итоги */}
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Общие показатели</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'На модерации', value: stats.totals.pending, color: '#b8860b' },
                { label: 'Опубликовано', value: stats.totals.approved, color: '#2e7d32' },
                { label: 'Отклонено', value: stats.totals.rejected, color: '#8B0000' },
                { label: 'Всего', value: stats.totals.total, color: 'rgba(255,255,255,0.4)' },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-sm text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-white/35 text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Работа модераторов */}
          {stats.moderators.length > 0 && (
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Активность модераторов</p>
              <div className="flex flex-col gap-2">
                {stats.moderators.map(m => (
                  <div key={m.username} className="flex items-center justify-between px-4 py-3 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span className="text-white/70 text-sm">{m.username}</span>
                      <span className="ml-2 text-xs text-white/25">{ROLE_LABEL[m.role]}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span style={{ color: '#2e7d32' }}>+{m.approved} одобрено</span>
                      <span style={{ color: '#8B0000' }}>−{m.rejected} отклонено</span>
                      {m.last_action && <span className="text-white/20">{new Date(m.last_action).toLocaleDateString('ru-RU')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Поступление историй */}
          {stats.by_day.length > 0 && (
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Поступление за 30 дней</p>
              <div className="flex items-end gap-1 h-24">
                {stats.by_day.map(d => {
                  const max = Math.max(...stats.by_day.map(x => x.count))
                  const pct = max > 0 ? (d.count / max) * 100 : 0
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.date}: ${d.count}`}>
                      <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max(4, pct)}%`, backgroundColor: '#8B0000', opacity: 0.6 }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-white/15 text-xs mt-1">
                <span>{stats.by_day[0]?.date}</span>
                <span>{stats.by_day[stats.by_day.length - 1]?.date}</span>
              </div>
            </div>
          )}

          <button onClick={onRefresh} className="flex items-center gap-2 text-white/25 hover:text-white transition-colors text-xs">
            <Icon name="RefreshCw" size={12} /> Обновить статистику
          </button>
        </div>
      )}
    </>
  )
}
