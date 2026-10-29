import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getSession,
  loginAdmin,
  logoutAdmin,
  refreshAdminSession,
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
    void refreshAdminSession().then((s) => {
      setSession(s)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const onExpired = () => {
      void logoutAdmin()
      setSession(null)
    }
    window.addEventListener('verissimo-admin-session-expired', onExpired)
    return () => window.removeEventListener('verissimo-admin-session-expired', onExpired)
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
    void logoutAdmin()
    setSession(null)
  }, [])

  const canAccess = useCallback(
    (module: string) => {
      const active = session ?? getSession()
      if (!active) return false
      return hasPermission(active.role as AdminRole, module)
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
