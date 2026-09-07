import type { AdminRole } from '../types/admin'

const SESSION_KEY = 'verissimo-admin-session'

export interface AdminSession {
  userId: string
  email: string
  name: string
  role: AdminRole
  /** Token de sessão emitido por /api/auth.php (não é a senha) */
  token: string
  expiresAt: number
  remember: boolean
}

function persistSession(session: AdminSession): void {
  const raw = JSON.stringify(session)
  if (session.remember) {
    localStorage.setItem(SESSION_KEY, raw)
    sessionStorage.removeItem(SESSION_KEY)
  } else {
    sessionStorage.setItem(SESSION_KEY, raw)
    localStorage.removeItem(SESSION_KEY)
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    })
    const data = await res.json()
    if (!res.ok || !data?.ok || !data.token || !data.session) {
      return {
        success: false,
        error: (data?.error as string) || 'Email ou senha inválidos.',
      }
    }

    const session: AdminSession = {
      userId: String(data.session.userId ?? 'admin'),
      email: String(data.session.email),
      name: String(data.session.name ?? 'Administrador'),
      role: (data.session.role as AdminRole) || 'administrador',
      token: String(data.token),
      expiresAt: Number(data.session.expiresAt) || Date.now() + 8 * 60 * 60 * 1000,
      remember,
    }
    persistSession(session)
    return { success: true, session }
  } catch {
    return { success: false, error: 'Não foi possível conectar ao servidor. Tente de novo.' }
  }
}

export function getSession(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session: AdminSession = JSON.parse(raw)
    if (!session.token || session.expiresAt < Date.now()) {
      logoutAdmin()
      return null
    }
    return session
  } catch {
    return null
  }
}

/** Header de autenticação para APIs admin (catálogo, upload, pedidos). */
export function getAdminAuthHeaders(json = true): HeadersInit {
  const token = getSession()?.token
  const headers: Record<string, string> = {}
  if (json) headers['Content-Type'] = 'application/json'
  if (token) headers['X-Verissimo-Token'] = token
  return headers
}

export async function logoutAdmin(): Promise<void> {
  const token = getSession()?.token
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
  if (!token) return
  try {
    await fetch('/api/auth.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Verissimo-Token': token,
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
