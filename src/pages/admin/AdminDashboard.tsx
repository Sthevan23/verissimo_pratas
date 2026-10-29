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
import { getDatabase } from '../../services/adminStore'
import { formatPrice } from '../../utils/format'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useStoreOrders } from '../../hooks/useStoreOrders'
import {
  computeDashboardStatsFromOrders,
  computeSalesChartFromOrders,
  computeTopProductsFromOrders,
  monthLocalExpenses,
} from '../../services/orderAnalytics'

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
  const { orders, loading, error } = useStoreOrders()
  const db = getDatabase()

  const stats = useMemo(
    () =>
      computeDashboardStatsFromOrders(
        orders,
        db.products,
        monthLocalExpenses(db.transactions)
      ),
    [orders, db.products, db.transactions]
  )

  const chartData = useMemo(
    () => computeSalesChartFromOrders(orders, period),
    [orders, period]
  )

  const topProducts = useMemo(
    () => computeTopProductsFromOrders(orders, db.products, 5),
    [orders, db.products]
  )

  const recentOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5),
    [orders]
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <>
      <Helmet>
        <title>Dashboard — Verissimo Admin</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-graphite">
          {greeting()}, {session?.name?.split(' ')[0] ?? 'Verissimo'}.
        </h1>
        <p className="text-sm text-muted font-light mt-1">
          Indicadores de vendas com base nos pedidos do servidor (cancelados não entram no faturamento).
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted mb-4">Carregando pedidos do servidor…</p>
      )}
      {error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 mb-4 rounded-sm">
          {error}
        </p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-muted mb-4">
          Nenhum pedido no servidor ainda. Os valores de vendas aparecerão aqui após checkout na loja.
        </p>
      )}

      <div className="admin-card p-5 sm:p-6 mb-6 bg-graphite text-cream">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Faturamento bruto (mês)</p>
            <p className="admin-num text-2xl sm:text-3xl">{formatPrice(stats.grossRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Custos + Despesas*</p>
            <p className="admin-num text-2xl sm:text-3xl">{formatPrice(stats.costs + stats.expenses)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Lucro estimado*</p>
            <p className="admin-num text-2xl sm:text-3xl text-emerald-300">{formatPrice(stats.profit)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-silver-dark mb-1">Ticket médio (pagos)</p>
            <p className="admin-num text-2xl sm:text-3xl">{formatPrice(stats.avgTicket)}</p>
          </div>
        </div>
        <p className="text-[10px] text-silver-dark mt-4 opacity-80">
          * Custos usam preço de custo cadastrado no painel; despesas vêm do módulo Financeiro local.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4 mb-8 w-full min-w-0">
        <StatCard label="Vendas hoje" value={stats.salesToday} icon={DollarSign} change={stats.salesTodayChange} prefix="R$" index={0} />
        <StatCard label="Vendas no mês" value={stats.salesMonth} icon={TrendingUp} change={stats.salesMonthChange} prefix="R$" index={1} />
        <StatCard label="Pedidos pagos" value={stats.ordersCount} icon={ShoppingBag} change={stats.ordersChange} index={2} />
        <StatCard label="Ticket médio" value={stats.avgTicket} icon={Receipt} change={stats.ticketChange} prefix="R$" index={3} />
        <StatCard label="Produtos" value={stats.productsCount} icon={Package} index={4} />
        <StatCard label="Esgotados" value={stats.lowStockCount} icon={AlertTriangle} index={5} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            type="button"
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
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted">Sem vendas pagas no período.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-5">{p.rank}º</span>
                  {p.image ? (
                    <img src={p.image} alt="" className="w-10 h-10 object-cover bg-off-white shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-off-white shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light truncate">{p.name}</p>
                    <p className="text-[11px] text-muted">
                      {p.quantitySold} vendidos · {formatPrice(p.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-serif text-lg font-light">Pedidos recentes</h3>
          <Link to="/admin/pedidos" className="text-[11px] tracking-wider uppercase text-muted hover:text-graphite">
            Ver todos
          </Link>
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-td text-muted text-center py-8">
                    Nenhum pedido recente.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-off-white/50">
                    <td className="admin-table-td">
                      <Link to={`/admin/pedidos/${o.id}`} className="hover:text-charcoal">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="admin-table-td">{o.customerName}</td>
                    <td className="admin-table-td hidden sm:table-cell text-muted">
                      {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="admin-table-td font-medium">{formatPrice(o.total)}</td>
                    <td className="admin-table-td">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
