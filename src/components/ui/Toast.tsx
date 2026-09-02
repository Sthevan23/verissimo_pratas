import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function ToastContainer() {
  const { toasts } = useApp()

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center gap-3 bg-brand-green text-white px-6 py-3.5 shadow-lg min-w-[280px]"
          >
            <CheckCircle className="w-4 h-4 text-silver shrink-0" />
            <span className="text-sm font-light tracking-wide">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
