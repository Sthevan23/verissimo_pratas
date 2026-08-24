import type { AdminRole } from '../types/admin'

const SESSION_KEY = 'verissimo-admin-session'

export interface AdminSession {
  userId: string
  email: string
  name: string
  role: AdminRole
  token: string
  expiresAt: number
  remember: boolean
}

function generateToken(): string {
  return crypto.randomUUID() + '-' + Date.now()
}

export async function loginAdmin(
  email: string,
  password: string,
  remember = false
): Promise<{ success: true; session: AdminSession } | { success: false; error: string }> {
  await delay(800)

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    return {
      success: false,
      error: 'Credenciais não configuradas. Defina VITE_ADMIN_EMAIL e VITE_ADMIN_PASSWORD no arquivo .env',
    }
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    return { success: false, error: 'Email ou senha inválidos.' }
  }

  const { getDatabase } = await import('./adminStore')
  const db = getDatabase()
  const user = db.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? db.adminUsers[0]

  const session: AdminSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token: generateToken(),
    expiresAt: Date.now() + (remember ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000),
    remember,
  }

  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  return { success: true, session }
}

export function getSession(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session: AdminSession = JSON.parse(raw)
    if (session.expiresAt < Date.now()) {
      logoutAdmin()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function hasPermission(role: AdminRole, module: string): boolean {
  const perms: Record<string, string[]> = {
    administrador: ['*'],
    gerente: ['dashboard', 'products', 'orders', 'inventory', 'finance', 'customers', 'coupons', 'reviews', 'reports', 'categories'],
    editor: ['dashboard', 'products', 'categories', 'reviews'],
  }
  const allowed = perms[role] ?? []
  return allowed.includes('*') || allowed.includes(module)
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
