import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getSession,
  loginAdmin,
  logoutAdmin,
  hasPermission,
  type AdminSession,
} from '../services/authService'
import type { AdminRole } from '../types/admin'

interface AdminAuthContextValue {
  session: AdminSession | null
  loading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  canAccess: (module: string) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSession(getSession())
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const result = await loginAdmin(email, password, remember)
    if (result.success) {
      setSession(result.session)
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])

  const logout = useCallback(() => {
    logoutAdmin()
    setSession(null)
  }, [])

  const canAccess = useCallback(
    (module: string) => {
      if (!session) return false
      return hasPermission(session.role as AdminRole, module)
    },
    [session]
  )

  return (
    <AdminAuthContext.Provider value={{ session, loading, login, logout, canAccess }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
