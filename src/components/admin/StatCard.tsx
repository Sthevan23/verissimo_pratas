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
      className="admin-card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 flex items-center justify-center bg-off-white border border-border/60">
          <Icon className="w-[18px] h-[18px] text-silver-dark" strokeWidth={1.5} />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${change >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs tracking-[0.12em] uppercase text-muted mb-1.5">{label}</p>
      <p className="admin-num text-3xl sm:text-4xl text-graphite">{display}</p>
    </motion.div>
  )
}
