import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SalesChartPoint } from '../../types/admin'
import { formatPrice } from '../../utils/format'

interface SalesChartProps {
  data: SalesChartPoint[]
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="admin-card p-5 sm:p-6">
      <h3 className="font-serif text-lg font-light text-graphite mb-6">Faturamento</h3>
      <div className="h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A1A1A" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#1A1A1A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DF" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip
              contentStyle={{ background: '#FAFAF8', border: '1px solid #E5E3DF', borderRadius: 0, fontSize: 12 }}
              formatter={(value, name) => [
                name === 'revenue' ? formatPrice(Number(value)) : value,
                name === 'revenue' ? 'Faturamento' : 'Pedidos',
              ]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#1A1A1A" strokeWidth={1.5} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
