import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { Helmet } from 'react-helmet-async'

export function AdminLogin() {
  const { session, login, loading: authLoading } = useAdminAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-graphite rounded-full animate-spin" />
      </div>
    )
  }

  if (session) return <Navigate to={from} replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password, remember)
    setLoading(false)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? 'Credenciais inválidas.')
    }
  }

  if (success) return <Navigate to={from} replace />

  return (
    <>
      <Helmet><title>Login — Verissimo Admin</title></Helmet>
      <div className="admin-shell min-h-screen-safe bg-off-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <span className="font-serif text-4xl font-light text-graphite">VP</span>
            <p className="text-xs tracking-[0.4em] uppercase text-muted mt-2">Verissimo Pratas 925</p>
            <p className="text-[15px] text-warm-gray font-normal mt-4">Painel Administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-card p-8 space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm font-light">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="admin-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input"
                placeholder="verissimopratass@gmail.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="admin-label">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-graphite"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-graphite"
                />
                <span className="text-warm-gray font-light">Lembrar acesso</span>
              </label>
              <button type="button" className="text-muted hover:text-graphite font-light text-sm transition-colors">
                Esqueci minha senha
              </button>
            </div>

            <button type="submit" disabled={loading} className="admin-btn-primary w-full py-3.5 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted mt-6 font-light">
            Configure VITE_ADMIN_EMAIL e VITE_ADMIN_PASSWORD no arquivo .env
          </p>
        </motion.div>
      </div>
    </>
  )
}
