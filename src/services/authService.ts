import type { AdminRole } from '../types/admin'

const SESSION_KEY = 'verissimo-admin-session'

/** Metadados da sessão — token fica só no cookie HttpOnly `verissimo_admin`. */
export interface AdminSession {
  userId: string
  email: string
  name: string
  role: AdminRole
  expiresAt: number
  remember: boolean
}

function readCsrfCookie(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)verissimo_csrf=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function persistSessionMeta(session: AdminSession): void {
  const raw = JSON.stringify(session)
  if (session.remember) {
    localStorage.setItem(SESSION_KEY, raw)
    sessionStorage.removeItem(SESSION_KEY)
  } else {
    sessionStorage.setItem(SESSION_KEY, raw)
    localStorage.removeItem(SESSION_KEY)
  }
}

function readSessionMeta(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as AdminSession & { token?: string; csrf?: string }
    if (session.expiresAt < Date.now()) return null
    if (!readCsrfCookie()) return null
    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      expiresAt: session.expiresAt,
      remember: session.remember,
    }
  } catch {
    return null
  }
}

export async function refreshAdminSession(): Promise<AdminSession | null> {
  try {
    const res = await fetch('/api/auth.php', {
      credentials: 'include',
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok || !data?.ok || !data.session) {
      clearSessionMeta()
      return null
    }
    if (!readCsrfCookie()) {
      clearSessionMeta()
      return null
    }
    const meta = readSessionMeta()
    const session: AdminSession = {
      userId: String(data.session.userId ?? meta?.userId ?? 'admin'),
      email: String(data.session.email ?? meta?.email ?? ''),
      name: String(data.session.name ?? meta?.name ?? 'Administrador'),
      role: (data.session.role as AdminRole) || meta?.role || 'administrador',
      expiresAt: Number(data.session.expiresAt) || Date.now() + 8 * 60 * 60 * 1000,
      remember: meta?.remember ?? false,
    }
    persistSessionMeta(session)
    return session
  } catch {
    return readSessionMeta()
  }
}

export async function loginAdmin(
  email: string,
  password: string,
  remember = false
): Promise<{ success: true; session: AdminSession } | { success: false; error: string }> {
  try {
    const res = await fetch('/api/auth.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    })
    const data = await res.json()
    if (!res.ok || !data?.ok || !data.session) {
      return {
        success: false,
        error: (data?.error as string) || 'Email ou senha inválidos.',
      }
    }
    if (!readCsrfCookie() && !data.csrf) {
      return {
        success: false,
        error: 'Não foi possível iniciar sessão segura. Tente de novo.',
      }
    }

    const session: AdminSession = {
      userId: String(data.session.userId ?? 'admin'),
      email: String(data.session.email),
      name: String(data.session.name ?? 'Administrador'),
      role: (data.session.role as AdminRole) || 'administrador',
      expiresAt: Number(data.session.expiresAt) || Date.now() + 8 * 60 * 60 * 1000,
      remember,
    }
    persistSessionMeta(session)
    return { success: true, session }
  } catch {
    return { success: false, error: 'Não foi possível conectar ao servidor. Tente de novo.' }
  }
}

function clearSessionMeta(): void {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): AdminSession | null {
  return readSessionMeta()
}

export function isAdminLoggedIn(): boolean {
  return getSession() !== null
}

/** Headers para APIs admin — autenticação via cookie + CSRF. */
export function getAdminAuthHeaders(json = true): HeadersInit {
  const csrf = readCsrfCookie()
  const headers: Record<string, string> = {}
  if (json) headers['Content-Type'] = 'application/json'
  if (csrf) headers['X-Verissimo-CSRF'] = csrf
  return headers
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const csrf = readCsrfCookie()
  if (csrf && !headers.has('X-Verissimo-CSRF')) {
    headers.set('X-Verissimo-CSRF', csrf)
  }
  const res = await fetch(input, { ...init, credentials: 'include', headers })
  if (res.status === 403) {
    try {
      const body = await res.clone().json()
      const code = body?.code as string | undefined
      if (code === 'SESSION_UPGRADE_REQUIRED' || code === 'CSRF_INVALID') {
        clearSessionMeta()
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.dispatchEvent(new CustomEvent('verissimo-admin-session-expired'))
        }
      }
    } catch {
      /* ignore */
    }
  }
  return res
}

export async function logoutAdmin(): Promise<void> {
  clearSessionMeta()
  try {
    await fetch('/api/auth.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(readCsrfCookie() ? { 'X-Verissimo-CSRF': readCsrfCookie() } : {}),
      },
      body: JSON.stringify({ action: 'logout' }),
    })
  } catch {
    /* ignore */
  }
}

export function hasPermission(role: AdminRole, module: string): boolean {
  const perms: Record<string, string[]> = {
    administrador: ['*'],
    gerente: [
      'dashboard',
      'products',
      'orders',
      'inventory',
      'finance',
      'customers',
      'coupons',
      'reviews',
      'reports',
      'categories',
    ],
    editor: ['dashboard', 'products', 'categories', 'reviews'],
  }
  const allowed = perms[role] ?? []
  return allowed.includes('*') || allowed.includes(module)
}
