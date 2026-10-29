import { Helmet } from 'react-helmet-async'
import { useMemo } from 'react'
import { Download } from 'lucide-react'
import { PageHeader } from '../../components/admin/Modal'
import { getDatabase } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'
import { useStoreOrders } from '../../hooks/useStoreOrders'
import {
  computeDashboardStatsFromOrders,
  computeTopProductsFromOrders,
  filterRevenueOrders,
  monthLocalExpenses,
} from '../../services/orderAnalytics'

const REPORTS = [
  { id: 'vendas', label: 'Vendas', desc: 'Faturamento e pedidos por período' },
  { id: 'produtos', label: 'Produtos', desc: 'Performance e estoque' },
  { id: 'clientes', label: 'Clientes', desc: 'Comportamento de compra' },
  { id: 'estoque', label: 'Estoque', desc: 'Níveis e movimentações' },
  { id: 'financeiro', label: 'Financeiro', desc: 'Entradas, saídas e lucro' },
]

export function AdminReports() {
  const { showToast } = useAdminToast()
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

  const top = useMemo(
    () => computeTopProductsFromOrders(orders, db.products, 10),
    [orders, db.products]
  )

  const paidOrders = useMemo(() => filterRevenueOrders(orders), [orders])

  const exportCSV = (type: string) => {
    let csv = ''
    if (type === 'vendas') {
      if (paidOrders.length === 0) {
        showToast('Nenhuma venda paga no servidor para exportar.', 'info')
        return
      }
      csv =
        'Pedido,Cliente,Data,Total,Status\n' +
        paidOrders
          .map((o) => `${o.orderNumber},${o.customerName},${o.createdAt},${o.total},${o.status}`)
          .join('\n')
    } else if (type === 'produtos') {
      csv =
        'Produto,SKU,Categoria,Preço,Estoque\n' +
        db.products.map((p) => `${p.name},${p.sku},${p.category},${p.price},${p.stock}`).join('\n')
    } else if (type === 'clientes') {
      showToast(
        'Relatório de clientes usa cadastro local; pedidos vêm só do servidor.',
        'info'
      )
      csv =
        'Nome,Email,Pedidos cadastro,Total cadastro\n' +
        db.customers.map((c) => `${c.name},${c.email},${c.totalOrders},${c.totalSpent}`).join('\n')
    } else if (type === 'estoque' || type === 'financeiro') {
      showToast('Exportação detalhada em breve; use o painel Financeiro para despesas.', 'info')
      return
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${type}-${Date.now()}.csv`
    a.click()
    showToast('Relatório exportado em CSV.')
  }

  return (
    <>
      <Helmet>
        <title>Relatórios — Verissimo Admin</title>
      </Helmet>
      <PageHeader title="Relatórios" subtitle="Exporte dados da loja" />

      {loading && <p className="text-sm text-muted mb-4">Carregando pedidos do servidor…</p>}
      {error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {REPORTS.map((r) => (
          <div key={r.id} className="admin-card p-6">
            <h3 className="font-serif text-lg font-light mb-1">{r.label}</h3>
            <p className="text-sm text-muted font-light mb-4">{r.desc}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => exportCSV(r.id)} className="admin-btn-primary text-[10px] py-2">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={() => showToast('Exportação PDF em breve.', 'info')}
                className="admin-btn-secondary text-[10px] py-2"
              >
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card p-6">
        <h3 className="font-serif text-lg font-light mb-4">Resumo rápido</h3>
        <p className="text-xs text-muted mb-4">
          Vendas e pedidos pagos: API `/api/orders.php`. Cancelados não entram no faturamento.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted">Faturamento mês (pagos)</p>
            <p className="admin-num text-xl">{formatPrice(stats.salesMonth)}</p>
          </div>
          <div>
            <p className="text-muted">Pedidos pagos</p>
            <p className="admin-num text-xl">{stats.ordersCount}</p>
          </div>
          <div>
            <p className="text-muted">Produtos ativos (painel)</p>
            <p className="admin-num text-xl">{stats.productsCount}</p>
          </div>
          <div>
            <p className="text-muted">Lucro estimado*</p>
            <p className="admin-num text-xl text-emerald-700">{formatPrice(stats.profit)}</p>
          </div>
        </div>
        <p className="text-[10px] text-muted mt-2">* Inclui custo cadastrado no painel e despesas do Financeiro local.</p>
        <div className="mt-6">
          <p className="text-muted text-sm mb-2">Top produtos (vendas pagas)</p>
          {top.length === 0 ? (
            <p className="text-sm text-muted">Sem dados de vendas pagas.</p>
          ) : (
            top.slice(0, 5).map((p) => (
              <div key={p.productId} className="flex justify-between py-2 border-b border-border/50 text-sm">
                <span>
                  {p.rank}. {p.name}
                </span>
                <span>{formatPrice(p.revenue)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
