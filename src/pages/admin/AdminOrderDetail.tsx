import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PageHeader } from '../../components/admin/Modal'
import { StatusBadge, ORDER_STATUS_OPTIONS } from '../../components/admin/StatusBadge'
import { getOrder, updateOrderStatus } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'
import type { OrderStatus } from '../../types/admin'

export function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useAdminToast()
  const order = id ? getOrder(id) : undefined

  if (!order) {
    return <div className="text-center py-20 text-muted">Pedido não encontrado</div>
  }

  const handleStatus = (status: OrderStatus) => {
    updateOrderStatus(order.id, status)
    showToast('Status atualizado.')
    navigate(0)
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
            <p className="text-sm text-muted">{order.customerEmail}</p>
            <p className="text-sm text-muted">{order.customerPhone}</p>
          </section>
          <section className="admin-card p-6 space-y-3">
            <h2 className="font-serif text-lg font-light mb-2">Entrega</h2>
            <p className="text-sm text-warm-gray">{order.shippingAddress}</p>
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
