import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PageHeader } from '../../components/admin/Modal'
import { getDatabase } from '../../services/adminStore'
import { formatPrice } from '../../utils/format'

export function AdminCustomers() {
  const customers = useMemo(() => getDatabase().customers, [])

  return (
    <>
      <Helmet><title>Clientes — Verissimo Admin</title></Helmet>
      <PageHeader title="Clientes" subtitle={`${customers.length} clientes cadastrados`} />

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="admin-table-th">Nome</th>
                <th className="admin-table-th">Email</th>
                <th className="admin-table-th">Telefone</th>
                <th className="admin-table-th">Pedidos</th>
                <th className="admin-table-th">Total gasto</th>
                <th className="admin-table-th">Última compra</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-off-white/40">
                  <td className="admin-table-td"><Link to={`/admin/clientes/${c.id}`}>{c.name}</Link></td>
                  <td className="admin-table-td text-muted">{c.email}</td>
                  <td className="admin-table-td">{c.phone}</td>
                  <td className="admin-table-td">{c.totalOrders}</td>
                  <td className="admin-table-td font-medium">{formatPrice(c.totalSpent)}</td>
                  <td className="admin-table-td text-muted">{c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3 mt-4">
        {customers.map((c) => (
          <Link key={c.id} to={`/admin/clientes/${c.id}`} className="admin-card p-4 block">
            <p className="font-medium text-sm">{c.name}</p>
            <p className="text-xs text-muted">{c.email}</p>
            <div className="flex justify-between mt-2 text-sm">
              <span>{c.totalOrders} pedidos</span>
              <span className="font-medium">{formatPrice(c.totalSpent)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export function AdminCustomerDetail() {
  const { id } = useParams()
  const db = getDatabase()
  const customer = db.customers.find((c) => c.id === id)
  const orders = db.orders.filter((o) => o.customerId === id)

  if (!customer) return <div className="text-center py-20 text-muted">Cliente não encontrado</div>

  const avgTicket = customer.totalOrders ? customer.totalSpent / customer.totalOrders : 0

  return (
    <>
      <Helmet><title>{customer.name} — Verissimo Admin</title></Helmet>
      <PageHeader title={customer.name} subtitle={customer.email} />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="admin-card p-5 text-center"><p className="text-muted text-xs uppercase tracking-wider mb-1">Pedidos</p><p className="admin-num text-3xl">{customer.totalOrders}</p></div>
        <div className="admin-card p-5 text-center"><p className="text-muted text-xs uppercase tracking-wider mb-1">Total gasto</p><p className="admin-num text-3xl">{formatPrice(customer.totalSpent)}</p></div>
        <div className="admin-card p-5 text-center"><p className="text-muted text-xs uppercase tracking-wider mb-1">Ticket médio</p><p className="admin-num text-3xl">{formatPrice(avgTicket)}</p></div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-serif text-lg font-light">Histórico de pedidos</h3></div>
        {orders.map((o) => (
          <Link key={o.id} to={`/admin/pedidos/${o.id}`} className="flex justify-between px-5 py-4 border-b border-border/50 hover:bg-off-white/40">
            <span className="text-sm">{o.orderNumber}</span>
            <span className="text-sm font-medium">{formatPrice(o.total)}</span>
          </Link>
        ))}
      </div>
    </>
  )
}