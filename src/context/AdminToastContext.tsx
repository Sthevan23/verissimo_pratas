import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface AdminToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null)

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <AdminToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3.5 text-sm font-light shadow-lg animate-[slideIn_0.3s_ease] ${
              t.type === 'success'
                ? 'bg-graphite text-cream'
                : t.type === 'error'
                  ? 'bg-red-900 text-cream'
                  : 'bg-charcoal text-cream'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  )
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext)
  if (!ctx) throw new Error('useAdminToast must be used within AdminToastProvider')
  return ctx
}

export function calcMargin(cost: number, price: number) {
  if (!price || price <= 0) return { profit: 0, percent: 0 }
  const profit = price - cost
  const percent = (profit / price) * 100
  return { profit, percent }
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
