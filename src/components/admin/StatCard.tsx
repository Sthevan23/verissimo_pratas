import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatPrice } from '../../utils/format'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  change?: number
  prefix?: string
  index?: number
}

export function StatCard({ label, value, icon: Icon, change, prefix = '', index = 0 }: StatCardProps) {
  const display = typeof value === 'number' && prefix === 'R$'
    ? formatPrice(value)
    : typeof value === 'number'
      ? value.toLocaleString('pt-BR')
      : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="admin-card p-3.5 sm:p-6 min-w-0 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-off-white border border-border/60 shrink-0">
          <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-silver-dark" strokeWidth={1.5} />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium shrink-0 ${change >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[10px] sm:text-xs tracking-[0.1em] uppercase text-muted mb-1 sm:mb-1.5 leading-snug break-words">{label}</p>
      <p className="admin-num text-xl sm:text-3xl lg:text-4xl text-graphite break-all">{display}</p>
    </motion.div>
  )
}
