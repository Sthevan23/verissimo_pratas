import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Pencil, XCircle } from 'lucide-react'
import { ConfirmDialog, PageHeader } from '../../components/admin/Modal'
import { StatusBadge, ORDER_STATUS_OPTIONS } from '../../components/admin/StatusBadge'
import { getDatabase, saveDb } from '../../services/adminStore'
import { fetchStoreOrders, updateStoreOrder } from '../../services/orderService'
import { useAdminToast } from '../../context/AdminToastContext'
import type { Order } from '../../types/admin'
import { formatPrice } from '../../utils/format'

export function AdminOrders() {
  const { showToast } = useAdminToast()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const remote = await fetchStoreOrders()
    if (remote.length > 0) {
      const db = getDatabase()
      db.orders = remote
      saveDb(db)
      setOrders(remote)
    } else {
      setOrders(getDatabase().orders)
    }
    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      await load()
      if (!alive) return
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

  const handleCancel = async () => {
    if (!cancelId) return
    setBusyId(cancelId)
    const updated = await updateStoreOrder({ id: cancelId, status: 'cancelado' })
    setBusyId(null)
    setCancelId(null)
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      const db = getDatabase()
      db.orders = db.orders.map((o) => (o.id === updated.id ? updated : o))
      saveDb(db)
      showToast('Pedido cancelado.')
    } else {
      showToast('Não foi possível cancelar o pedido.', 'error')
    }
  }

  const cancelTarget = orders.find((o) => o.id === cancelId)

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
          <table className="w-full min-w-[780px]">
            <thead>
              <tr>
                <th className="admin-table-th">Pedido</th>
                <th className="admin-table-th">Cliente</th>
                <th className="admin-table-th">Data</th>
                <th className="admin-table-th">Produtos</th>
                <th className="admin-table-th">Valor</th>
                <th className="admin-table-th">Pagamento</th>
                <th className="admin-table-th">Status</th>
                <th className="admin-table-th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-off-white/40">
                  <td className="admin-table-td">
                    <Link to={`/admin/pedidos/${o.id}`} className="hover:underline">{o.orderNumber}</Link>
                  </td>
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
                  <td className="admin-table-td">
                    <div className="flex gap-1">
                      <Link
                        to={`/admin/pedidos/${o.id}`}
                        className="p-2 hover:bg-off-white"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      {o.status !== 'cancelado' && (
                        <button
                          type="button"
                          onClick={() => setCancelId(o.id)}
                          className="p-2 hover:bg-off-white text-red-600"
                          title="Cancelar"
                          disabled={busyId === o.id}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden mt-4 space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="admin-card p-4">
            <Link to={`/admin/pedidos/${o.id}`} className="block">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-sm">{o.orderNumber}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-sm text-warm-gray">{o.customerName}</p>
              {o.shippingAddress && <p className="text-[11px] text-muted mt-1">{o.shippingAddress}</p>}
              <p className="text-sm font-medium mt-2">{formatPrice(o.total)}</p>
            </Link>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
              <Link to={`/admin/pedidos/${o.id}`} className="flex-1 admin-btn-secondary text-[10px] py-2 text-center">
                Editar
              </Link>
              {o.status !== 'cancelado' && (
                <button
                  type="button"
                  onClick={() => setCancelId(o.id)}
                  className="flex-1 admin-btn-secondary text-[10px] py-2 text-red-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => void handleCancel()}
        title="Cancelar pedido"
        message={`Deseja cancelar o pedido ${cancelTarget?.orderNumber ?? ''}?`}
        confirmLabel="Cancelar pedido"
        danger
      />
    </>
  )
}
