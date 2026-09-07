import type { Order, OrderItem, OrderStatus } from '../types/admin'
import type { CartItem } from '../types'
import { getAdminAuthHeaders, getSession } from './authService'

const ORDERS_URL = '/api/orders.php'

export type CheckoutOrderPayload = {
  cart: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  couponCode?: string
  cep?: string
  shippingLabel?: string
  city?: string
  street?: string
  streetNumber?: string
  neighborhood?: string
}

function cartToOrderItems(cart: CartItem[]): OrderItem[] {
  return cart.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    productImage: item.product.images[0] ?? '',
    quantity: item.quantity,
    unitPrice: item.product.salePrice ?? item.product.price,
    size: item.selectedSize,
    choices: item.selectedChoices,
  }))
}

export async function createStoreOrder(
  payload: CheckoutOrderPayload
): Promise<{ order: Order | null; error?: string }> {
  const streetLine = payload.street
    ? `${payload.street}${payload.streetNumber ? `, nº ${payload.streetNumber}` : ''}`
    : payload.streetNumber
      ? `nº ${payload.streetNumber}`
      : null

  const addressParts = [
    streetLine,
    payload.neighborhood,
    payload.city,
    payload.cep ? `CEP ${payload.cep}` : null,
    payload.shippingLabel,
  ].filter(Boolean)

  try {
    const res = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Cliente WhatsApp',
        customerEmail: '',
        customerPhone: '',
        items: cartToOrderItems(payload.cart),
        subtotal: payload.subtotal,
        discount: payload.discount,
        shipping: payload.shipping,
        total: payload.total,
        paymentMethod: 'whatsapp',
        shippingAddress: addressParts.join(' · '),
        shippingLabel: payload.shippingLabel ?? '',
        cep: payload.cep ?? '',
        couponCode: payload.couponCode,
      }),
    })
    const data = await res.json()
    if (!data?.ok || !data.order) {
      return { order: null, error: (data?.error as string) || 'Não foi possível registrar o pedido.' }
    }
    return { order: data.order as Order }
  } catch {
    return { order: null, error: 'Erro de conexão ao registrar o pedido.' }
  }
}

export async function fetchStoreOrders(): Promise<Order[]> {
  if (!getSession()?.token) return []
  try {
    const res = await fetch(ORDERS_URL, {
      headers: getAdminAuthHeaders(false),
    })
    const data = await res.json()
    if (!data?.ok || !Array.isArray(data.orders)) return []
    return data.orders as Order[]
  } catch {
    return []
  }
}

export async function updateStoreOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  return updateStoreOrder({ id, status })
}

export type OrderUpdatePayload = {
  id: string
  status?: OrderStatus
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  shippingLabel?: string
  cep?: string
  notes?: string
  subtotal?: number
  discount?: number
  shipping?: number
  total?: number
  paymentStatus?: Order['paymentStatus']
  paymentMethod?: Order['paymentMethod']
  couponCode?: string | null
}

export async function updateStoreOrder(payload: OrderUpdatePayload): Promise<Order | null> {
  if (!getSession()?.token) return null
  try {
    const res = await fetch(ORDERS_URL, {
      method: 'PUT',
      headers: getAdminAuthHeaders(true),
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data?.ok || !data.order) return null
    return data.order as Order
  } catch {
    return null
  }
}
