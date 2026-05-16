export interface Submission {
  id: number; title: string; author_name: string; genre: string
  text: string; status: 'pending' | 'approved' | 'rejected' | 'deleted'
  created_at: string; moderator_comment: string; moderated_at: string | null; moderated_by: string
}
export interface ModApp {
  id: number; name: string; contact: string; reason: string
  status: 'pending' | 'approved' | 'rejected'; created_at: string
}
export interface AppUser {
  id: number; username: string; email: string
  role: 'user' | 'moderator' | 'admin'; status: string; created_at: string
  name_color?: string; name_effect?: string; ban_reason?: string
  badge_text?: string; badge_effect?: string; custom_role?: string; hide_role?: boolean
}
export interface ModerationStats {
  totals: { pending: number; approved: number; rejected: number; deleted: number; total: number }
  moderators: { username: string; role: string; approved: number; rejected: number; last_action: string | null }[]
  by_day: { date: string; count: number }[]
}

export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На рассмотрении', color: '#b8860b' },
  approved: { label: 'Одобрено',        color: '#2e7d32' },
  rejected: { label: 'Отклонено',       color: '#8B0000' },
  deleted:  { label: 'Удалено',         color: '#555' },
  active:   { label: 'Активен',         color: '#2e7d32' },
  banned:   { label: 'Заблокирован',    color: '#8B0000' },
}
export const ROLE_LABEL: Record<string, string> = { user: 'Пользователь', moderator: 'Модератор', admin: 'Администратор' }