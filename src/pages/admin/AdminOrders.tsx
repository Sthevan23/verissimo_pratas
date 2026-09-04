import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PageHeader } from '../../components/admin/Modal'
import { StatusBadge, ORDER_STATUS_OPTIONS } from '../../components/admin/StatusBadge'
import { getDatabase, saveDb } from '../../services/adminStore'
import { fetchStoreOrders } from '../../services/orderService'
import type { Order } from '../../types/admin'
import { formatPrice } from '../../utils/format'

export function AdminOrders() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const remote = await fetchStoreOrders()
      if (!alive) return
      if (remote.length > 0) {
        const db = getDatabase()
        db.orders = remote
        saveDb(db)
        setOrders(remote)
      } else {
        setOrders(getDatabase().orders)
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.cep ?? '').includes(q)
        )
      }
      return true
    })
  }, [orders, filter, search])

  return (
    <>
      <Helmet><title>Pedidos — Verissimo Admin</title></Helmet>
      <PageHeader
        title="Pedidos"
        subtitle={loading ? 'Carregando...' : `${filtered.length} pedidos · vindos do WhatsApp / site`}
      />

      <div className="admin-card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido, cliente, email, CEP..." className="admin-input flex-1" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-input sm:w-48">
          <option value="all">Todos</option>
          {ORDER_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="admin-card p-8 text-center text-muted text-sm mb-4">
          Ainda não há pedidos. Quando a cliente finalizar no site, o pedido abre no WhatsApp e aparece aqui.
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="admin-table-th">Pedido</th>
                <th className="admin-table-th">Cliente</th>
                <th className="admin-table-th">Data</th>
                <th className="admin-table-th">Produtos</th>
                <th className="admin-table-th">Valor</th>
                <th className="admin-table-th">Pagamento</th>
                <th className="admin-table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-off-white/40 cursor-pointer">
                  <td className="admin-table-td"><Link to={`/admin/pedidos/${o.id}`}>{o.orderNumber}</Link></td>
                  <td className="admin-table-td">
                    <div>{o.customerName}</div>
                    {o.shippingAddress && (
                      <div className="text-[11px] text-muted mt-0.5">{o.shippingAddress}</div>
                    )}
                  </td>
                  <td className="admin-table-td text-muted">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="admin-table-td">{o.items.length}</td>
                  <td className="admin-table-td font-medium">{formatPrice(o.total)}</td>
                  <td className="admin-table-td capitalize">{o.paymentMethod === 'whatsapp' ? 'WhatsApp' : o.paymentMethod}</td>
                  <td className="admin-table-td"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden mt-4 space-y-3">
        {filtered.map((o) => (
          <Link key={o.id} to={`/admin/pedidos/${o.id}`} className="admin-card p-4 block">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-sm">{o.orderNumber}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-sm text-warm-gray">{o.customerName}</p>
            {o.shippingAddress && <p className="text-[11px] text-muted mt-1">{o.shippingAddress}</p>}
            <p className="text-sm font-medium mt-2">{formatPrice(o.total)}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
