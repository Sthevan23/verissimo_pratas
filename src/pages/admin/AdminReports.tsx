import { Helmet } from 'react-helmet-async'
import { Download } from 'lucide-react'
import { PageHeader } from '../../components/admin/Modal'
import { getDashboardStats, getTopProducts, getOrders, getDatabase } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'

const REPORTS = [
  { id: 'vendas', label: 'Vendas', desc: 'Faturamento e pedidos por período' },
  { id: 'produtos', label: 'Produtos', desc: 'Performance e estoque' },
  { id: 'clientes', label: 'Clientes', desc: 'Comportamento de compra' },
  { id: 'estoque', label: 'Estoque', desc: 'Níveis e movimentações' },
  { id: 'financeiro', label: 'Financeiro', desc: 'Entradas, saídas e lucro' },
]

export function AdminReports() {
  const { showToast } = useAdminToast()
  const stats = getDashboardStats()
  const top = getTopProducts(10)
  const orders = getOrders()
  const db = getDatabase()

  const exportCSV = (type: string) => {
    let csv = ''
    if (type === 'vendas') {
      csv = 'Pedido,Cliente,Data,Total,Status\n' + orders.map((o) => `${o.orderNumber},${o.customerName},${o.createdAt},${o.total},${o.status}`).join('\n')
    } else if (type === 'produtos') {
      csv = 'Produto,SKU,Categoria,Preço,Estoque\n' + db.products.map((p) => `${p.name},${p.sku},${p.category},${p.price},${p.stock}`).join('\n')
    } else if (type === 'clientes') {
      csv = 'Nome,Email,Pedidos,Total\n' + db.customers.map((c) => `${c.name},${c.email},${c.totalOrders},${c.totalSpent}`).join('\n')
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
      <Helmet><title>Relatórios — Verissimo Admin</title></Helmet>
      <PageHeader title="Relatórios" subtitle="Exporte dados da loja" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {REPORTS.map((r) => (
          <div key={r.id} className="admin-card p-6">
            <h3 className="font-serif text-lg font-light mb-1">{r.label}</h3>
            <p className="text-sm text-muted font-light mb-4">{r.desc}</p>
            <div className="flex gap-2">
              <button onClick={() => exportCSV(r.id)} className="admin-btn-primary text-[10px] py-2"><Download className="w-3.5 h-3.5" /> CSV</button>
              <button onClick={() => showToast('Exportação PDF em breve.', 'info')} className="admin-btn-secondary text-[10px] py-2">PDF</button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card p-6">
        <h3 className="font-serif text-lg font-light mb-4">Resumo rápido</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted">Faturamento mês</p><p className="admin-num text-xl">{formatPrice(stats.salesMonth)}</p></div>
          <div><p className="text-muted">Pedidos</p><p className="admin-num text-xl">{stats.ordersCount}</p></div>
          <div><p className="text-muted">Produtos ativos</p><p className="admin-num text-xl">{stats.productsCount}</p></div>
          <div><p className="text-muted">Lucro</p><p className="admin-num text-xl text-emerald-700">{formatPrice(stats.profit)}</p></div>
        </div>
        <div className="mt-6">
          <p className="text-muted text-sm mb-2">Top produtos</p>
          {top.slice(0, 5).map((p) => (
            <div key={p.productId} className="flex justify-between py-2 border-b border-border/50 text-sm">
              <span>{p.rank}. {p.name}</span>
              <span>{formatPrice(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
