export const AUTH_URL = 'https://functions.poehali.dev/d0f4fb94-917f-48a7-b530-b140ac3819eb'

export interface User {
  id: number
  username: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  status: string
}

export function getSessionId(): string {
  return localStorage.getItem('session_id') || ''
}

export function saveSession(session_id: string, user: User) {
  localStorage.setItem('session_id', session_id)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('session_id')
  localStorage.removeItem('user')
}

export function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function fetchMe(): Promise<User | null> {
  const sid = getSessionId()
  if (!sid) return null
  try {
    const res = await fetch(`${AUTH_URL}?action=me`, {
      headers: { 'X-Session-Id': sid },
    })
    if (!res.ok) {
      // Сервер ответил 401/403 — сессия недействительна, чистим
      if (res.status === 401 || res.status === 403) { clearSession(); return null }
      // Другая ошибка сервера — возвращаем кэш, не разлогиниваем
      return getCachedUser()
    }
    const user = await res.json()
    localStorage.setItem('user', JSON.stringify(user))
    return user
  } catch {
    // Сеть недоступна — возвращаем кэш, не разлогиниваем
    return getCachedUser()
  }
}

export async function logout() {
  const sid = getSessionId()
  if (sid) {
    await fetch(`${AUTH_URL}?action=logout`, {
      method: 'POST',
      headers: { 'X-Session-Id': sid },
    }).catch(() => {})
  }
  clearSession()
}