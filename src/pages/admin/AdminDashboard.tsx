import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from 'lucide-react'
import { StatCard } from '../../components/admin/StatCard'
import { SalesChart } from '../../components/admin/SalesChart'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { getDashboardStats, getSalesChart, getTopProducts, getOrders } from '../../services/adminStore'
import { formatPrice } from '../../utils/format'
import { useAdminAuth } from '../../context/AdminAuthContext'

const PERIODS = [
  { label: 'Hoje', days: 1 },
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '3 meses', days: 90 },
  { label: '6 meses', days: 180 },
  { label: '1 ano', days: 365 },
]

export function AdminDashboard() {
  const { session } = useAdminAuth()
  const [period, setPeriod] = useState(30)
  const stats = useMemo(() => getDashboardStats(), [])
  const chartData = useMemo(() => getSalesChart(period), [period])
  const topProducts = useMemo(() => getTopProducts(5), [])
  const recentOrders = useMemo(() => getOrders().slice(0, 5), [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <>
      <Helmet><title>Dashboard — Verissimo Admin</title></Helmet>

      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-graphite">
          {greeting()}, {session?.name?.split(' ')[0] ?? 'Verissimo'}.
        </h1>
        <p className="text-sm text-muted font-light mt-1">Acompanhe o desempenho da sua loja.</p>
      </div>

      {/* Profit summary */}
      <div className="admin-card p-5 sm:p-6 mb-6 bg-graphite text-cream">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Faturamento bruto</p>
            <p className="admin-num text-2xl sm:text-3xl">{formatPrice(stats.grossRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Custos + Despesas</p>
            <p className="admin-num text-2xl sm:text-3xl">{formatPrice(stats.costs + stats.expenses)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Lucro líquido</p>
            <p className="admin-num text-2xl sm:text-3xl text-emerald-300">{formatPrice(stats.profit)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Ticket médio</p>
            <p className="admin-num text-2xl sm:text-3xl">{formatPrice(stats.avgTicket)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <StatCard label="Vendas hoje" value={stats.salesToday} icon={DollarSign} change={stats.salesTodayChange} prefix="R$" index={0} />
        <StatCard label="Vendas no mês" value={stats.salesMonth} icon={TrendingUp} change={stats.salesMonthChange} prefix="R$" index={1} />
        <StatCard label="Pedidos" value={stats.ordersCount} icon={ShoppingBag} change={stats.ordersChange} index={2} />
        <StatCard label="Ticket médio" value={stats.avgTicket} icon={Receipt} change={stats.ticketChange} prefix="R$" index={3} />
        <StatCard label="Produtos" value={stats.productsCount} icon={Package} index={4} />
        <StatCard label="Estoque baixo" value={stats.lowStockCount} icon={AlertTriangle} index={5} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setPeriod(p.days)}
            className={`px-3 py-1.5 text-[11px] tracking-wider uppercase transition-colors ${
              period === p.days ? 'bg-graphite text-cream' : 'border border-border text-warm-gray hover:border-graphite'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SalesChart data={chartData} />
        </div>

        <div className="admin-card p-5 sm:p-6">
          <h3 className="font-serif text-lg font-light mb-4">Mais vendidos</h3>
          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="text-xs text-muted w-5">{p.rank}º</span>
                <img src={p.image} alt="" className="w-10 h-10 object-cover bg-off-white shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light truncate">{p.name}</p>
                  <p className="text-[11px] text-muted">{p.quantitySold} vendidos · {formatPrice(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-serif text-lg font-light">Pedidos recentes</h3>
          <Link to="/admin/pedidos" className="text-[11px] tracking-wider uppercase text-muted hover:text-graphite">Ver todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="admin-table-th">Pedido</th>
                <th className="admin-table-th">Cliente</th>
                <th className="admin-table-th hidden sm:table-cell">Data</th>
                <th className="admin-table-th">Valor</th>
                <th className="admin-table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-off-white/50">
                  <td className="admin-table-td">
                    <Link to={`/admin/pedidos/${o.id}`} className="hover:text-charcoal">{o.orderNumber}</Link>
                  </td>
                  <td className="admin-table-td">{o.customerName}</td>
                  <td className="admin-table-td hidden sm:table-cell text-muted">
                    {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="admin-table-td font-medium">{formatPrice(o.total)}</td>
                  <td className="admin-table-td"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
