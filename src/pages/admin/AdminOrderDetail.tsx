import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PageHeader } from '../../components/admin/Modal'
import { StatusBadge, ORDER_STATUS_OPTIONS } from '../../components/admin/StatusBadge'
import { getOrder, getDatabase, saveDb } from '../../services/adminStore'
import { fetchStoreOrders, updateStoreOrderStatus } from '../../services/orderService'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'
import type { Order, OrderStatus } from '../../types/admin'

export function AdminOrderDetail() {
  const { id } = useParams()
  const { showToast } = useAdminToast()
  const [order, setOrder] = useState<Order | undefined>(() => (id ? getOrder(id) : undefined))
  const [loading, setLoading] = useState(!order)

  useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      const local = getOrder(id)
      if (local) {
        setOrder(local)
        setLoading(false)
      }
      const remote = await fetchStoreOrders()
      if (!alive) return
      if (remote.length > 0) {
        const db = getDatabase()
        db.orders = remote
        saveDb(db)
      }
      const found = remote.find((o) => o.id === id) ?? getOrder(id)
      setOrder(found)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [id])

  const handleStatus = async (status: OrderStatus) => {
    if (!order) return
    const updated = await updateStoreOrderStatus(order.id, status)
    if (updated) {
      const db = getDatabase()
      db.orders = db.orders.map((o) => (o.id === updated.id ? updated : o))
      saveDb(db)
      setOrder(updated)
      showToast('Status atualizado.')
    } else {
      showToast('Não foi possível atualizar o status no servidor.')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-muted">Carregando pedido...</div>
  }

  if (!order) {
    return <div className="text-center py-20 text-muted">Pedido não encontrado</div>
  }

  return (
    <>
      <Helmet><title>Pedido {order.orderNumber} — Verissimo Admin</title></Helmet>
      <PageHeader title={`Pedido ${order.orderNumber}`} subtitle={new Date(order.createdAt).toLocaleString('pt-BR')} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="admin-card p-6">
            <h2 className="font-serif text-lg font-light mb-4">Produtos</h2>
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-border/50 last:border-0">
                <img src={item.productImage} alt="" className="w-16 h-16 object-cover bg-off-white" />
                <div className="flex-1">
                  <p className="text-sm font-light">{item.productName}</p>
                  <p className="text-xs text-muted">Qtd: {item.quantity} · {formatPrice(item.unitPrice)}</p>
                  {item.size && <p className="text-xs text-muted">Tamanho: {item.size}</p>}
                </div>
                <p className="font-medium text-sm">{formatPrice(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Desconto</span><span>-{formatPrice(order.discount)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Frete</span><span>{formatPrice(order.shipping)}</span></div>
              <div className="flex justify-between font-medium text-base pt-2 border-t border-border"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="admin-card p-6 space-y-3">
            <h2 className="font-serif text-lg font-light mb-2">Cliente</h2>
            <p className="text-sm">{order.customerName}</p>
            {order.customerEmail && <p className="text-sm text-muted">{order.customerEmail}</p>}
            {order.customerPhone && <p className="text-sm text-muted">{order.customerPhone}</p>}
            <p className="text-xs text-muted">Canal: WhatsApp</p>
          </section>
          <section className="admin-card p-6 space-y-3">
            <h2 className="font-serif text-lg font-light mb-2">Entrega</h2>
            <p className="text-sm text-warm-gray">{order.shippingAddress || '—'}</p>
            {order.cep && <p className="text-xs text-muted">CEP: {order.cep}</p>}
          </section>
          <section className="admin-card p-6 space-y-3">
            <h2 className="font-serif text-lg font-light mb-2">Status</h2>
            <StatusBadge status={order.status} />
            <select
              className="admin-input mt-2"
              value={order.status}
              onChange={(e) => handleStatus(e.target.value as OrderStatus)}
            >
              {ORDER_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </section>
        </div>
      </div>
    </>
  )
}
