import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-graphite/40 z-[150]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${widths[size]} bg-cream z-[160] shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-cream">
              <h2 className="font-serif text-xl font-light">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-off-white transition-colors" aria-label="Fechar">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  extra?: ReactNode
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger, extra }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <p className="text-warm-gray font-light mb-6">{message}</p>
      {extra}
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="admin-btn-secondary">Cancelar</button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`admin-btn-primary ${danger ? 'bg-red-900 hover:bg-red-950 border-red-900' : ''}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="admin-card p-12 text-center">
      <p className="font-serif text-xl font-light text-graphite mb-2">{title}</p>
      {description && <p className="text-sm text-muted font-light mb-6">{description}</p>}
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 min-w-0 w-full">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-graphite">{title}</h1>
        {subtitle && <p className="text-sm text-muted font-light mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 shrink-0">{action}</div>}
    </div>
  )
}
