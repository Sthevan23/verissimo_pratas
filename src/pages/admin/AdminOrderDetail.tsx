import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Pencil, XCircle } from 'lucide-react'
import { ConfirmDialog, PageHeader } from '../../components/admin/Modal'
import { StatusBadge, ORDER_STATUS_OPTIONS } from '../../components/admin/StatusBadge'
import { getOrder, getDatabase, saveDb } from '../../services/adminStore'
import { fetchStoreOrders, updateStoreOrder } from '../../services/orderService'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'
import type { Order, OrderStatus } from '../../types/admin'

type EditForm = {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  cep: string
  shippingLabel: string
  notes: string
  status: OrderStatus
  subtotal: string
  discount: string
  shipping: string
}

function toForm(order: Order): EditForm {
  return {
    customerName: order.customerName ?? '',
    customerEmail: order.customerEmail ?? '',
    customerPhone: order.customerPhone ?? '',
    shippingAddress: order.shippingAddress ?? '',
    cep: order.cep ?? '',
    shippingLabel: order.shippingLabel ?? '',
    notes: order.notes ?? '',
    status: order.status,
    subtotal: String(order.subtotal ?? 0),
    discount: String(order.discount ?? 0),
    shipping: String(order.shipping ?? 0),
  }
}

export function AdminOrderDetail() {
  const { id } = useParams()
  const { showToast } = useAdminToast()
  const [order, setOrder] = useState<Order | undefined>(() => (id ? getOrder(id) : undefined))
  const [loading, setLoading] = useState(!order)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      const local = getOrder(id)
      if (local) {
        setOrder(local)
        setForm(toForm(local))
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
      if (found) setForm(toForm(found))
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [id])

  const persistLocal = (updated: Order) => {
    const db = getDatabase()
    db.orders = db.orders.map((o) => (o.id === updated.id ? updated : o))
    if (!db.orders.some((o) => o.id === updated.id)) db.orders.unshift(updated)
    saveDb(db)
    setOrder(updated)
    setForm(toForm(updated))
  }

  const handleCancel = async () => {
    if (!order) return
    setSaving(true)
    const updated = await updateStoreOrder({ id: order.id, status: 'cancelado' })
    setSaving(false)
    setCancelOpen(false)
    if (updated) {
      persistLocal(updated)
      showToast('Pedido cancelado.')
    } else {
      showToast('Não foi possível cancelar o pedido.', 'error')
    }
  }

  const handleSave = async () => {
    if (!order || !form) return
    const subtotal = parseFloat(form.subtotal.replace(',', '.')) || 0
    const discount = parseFloat(form.discount.replace(',', '.')) || 0
    const shipping = parseFloat(form.shipping.replace(',', '.')) || 0
    const total = Math.max(0, subtotal - discount + shipping)

    setSaving(true)
    const updated = await updateStoreOrder({
      id: order.id,
      customerName: form.customerName.trim() || 'Cliente WhatsApp',
      customerEmail: form.customerEmail.trim(),
      customerPhone: form.customerPhone.trim(),
      shippingAddress: form.shippingAddress.trim(),
      cep: form.cep.trim(),
      shippingLabel: form.shippingLabel.trim(),
      notes: form.notes.trim(),
      status: form.status,
      subtotal,
      discount,
      shipping,
      total,
    })
    setSaving(false)
    if (updated) {
      persistLocal(updated)
      setEditing(false)
      showToast('Pedido atualizado.')
    } else {
      showToast('Não foi possível salvar as alterações.', 'error')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-muted">Carregando pedido...</div>
  }

  if (!order || !form) {
    return <div className="text-center py-20 text-muted">Pedido não encontrado</div>
  }

  const cancelled = order.status === 'cancelado'
  const previewTotal =
    Math.max(
      0,
      (parseFloat(form.subtotal.replace(',', '.')) || 0) -
        (parseFloat(form.discount.replace(',', '.')) || 0) +
        (parseFloat(form.shipping.replace(',', '.')) || 0)
    )

  return (
    <>
      <Helmet><title>Pedido {order.orderNumber} — Verissimo Admin</title></Helmet>
      <PageHeader
        title={`Pedido ${order.orderNumber}`}
        subtitle={new Date(order.createdAt).toLocaleString('pt-BR')}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/pedidos" className="admin-btn-secondary text-[10px]">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="admin-btn-secondary text-[10px]"
              >
                <Pencil className="w-4 h-4" /> Editar
              </button>
            )}
            {!cancelled && (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="admin-btn-secondary text-[10px] text-red-700 border-red-200"
                disabled={saving}
              >
                <XCircle className="w-4 h-4" /> Cancelar pedido
              </button>
            )}
          </div>
        }
      />

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
              {editing ? (
                <>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="admin-label">Subtotal</label>
                      <input
                        className="admin-input"
                        value={form.subtotal}
                        onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Desconto</label>
                      <input
                        className="admin-input"
                        value={form.discount}
                        onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Frete</label>
                      <input
                        className="admin-input"
                        value={form.shipping}
                        onChange={(e) => setForm({ ...form, shipping: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between font-medium text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(previewTotal)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Desconto</span><span>-{formatPrice(order.discount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Frete</span><span>{formatPrice(order.shipping)}</span></div>
                  <div className="flex justify-between font-medium text-base pt-2 border-t border-border"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                </>
              )}
            </div>
          </section>

          {editing && (
            <section className="admin-card p-6 space-y-3">
              <h2 className="font-serif text-lg font-light mb-2">Observações</h2>
              <textarea
                className="admin-input min-h-[100px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anotações internas do pedido"
              />
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="admin-card p-6 space-y-3">
            <h2 className="font-serif text-lg font-light mb-2">Cliente</h2>
            {editing ? (
              <>
                <div>
                  <label className="admin-label">Nome</label>
                  <input
                    className="admin-input"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">E-mail</label>
                  <input
                    className="admin-input"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">Telefone / WhatsApp</label>
                  <input
                    className="admin-input"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm">{order.customerName}</p>
                {order.customerEmail && <p className="text-sm text-muted">{order.customerEmail}</p>}
                {order.customerPhone && <p className="text-sm text-muted">{order.customerPhone}</p>}
                <p className="text-xs text-muted">Canal: WhatsApp</p>
              </>
            )}
          </section>

          <section className="admin-card p-6 space-y-3">
            <h2 className="font-serif text-lg font-light mb-2">Entrega</h2>
            {editing ? (
              <>
                <div>
                  <label className="admin-label">Endereço completo</label>
                  <textarea
                    className="admin-input min-h-[80px]"
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">CEP</label>
                  <input
                    className="admin-input"
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">Frete escolhido</label>
                  <input
                    className="admin-input"
                    value={form.shippingLabel}
                    onChange={(e) => setForm({ ...form, shippingLabel: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-warm-gray">{order.shippingAddress || '—'}</p>
                {order.cep && <p className="text-xs text-muted">CEP: {order.cep}</p>}
                {order.shippingLabel && (
                  <p className="text-xs text-muted">{order.shippingLabel}</p>
                )}
                {order.notes && (
                  <p className="text-xs text-muted mt-2 border-t border-border pt-2">{order.notes}</p>
                )}
              </>
            )}
          </section>

          <section className="admin-card p-6 space-y-3">
            <h2 className="font-serif text-lg font-light mb-2">Status</h2>
            <StatusBadge status={editing ? form.status : order.status} />
            {editing ? (
              <select
                className="admin-input mt-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as OrderStatus })}
              >
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <select
                className="admin-input mt-2"
                value={order.status}
                disabled={saving}
                onChange={async (e) => {
                  const status = e.target.value as OrderStatus
                  setSaving(true)
                  const updated = await updateStoreOrder({ id: order.id, status })
                  setSaving(false)
                  if (updated) {
                    persistLocal(updated)
                    showToast('Status atualizado.')
                  } else {
                    showToast('Não foi possível atualizar o status.', 'error')
                  }
                }}
              >
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}
          </section>

          {editing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(toForm(order))
                  setEditing(false)
                }}
                className="admin-btn-secondary flex-1"
                disabled={saving}
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="admin-btn-primary flex-1"
                disabled={saving}
              >
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => void handleCancel()}
        title="Cancelar pedido"
        message={`Deseja cancelar o pedido ${order.orderNumber}? Essa ação marca o pedido como cancelado.`}
        confirmLabel="Cancelar pedido"
        danger
      />
    </>
  )
}
