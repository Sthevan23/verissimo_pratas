import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export function ProtectedRoute({ children, module }: { children: React.ReactNode; module?: string }) {
  const { session, loading, canAccess } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-graphite rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (module && !canAccess(module)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}
