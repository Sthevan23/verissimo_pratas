import type { Order, OrderItem, OrderStatus } from '../types/admin'
import type { CartItem } from '../types'
import { WRITE_TOKEN } from './remoteCatalog'

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
}

function cartToOrderItems(cart: CartItem[]): OrderItem[] {
  return cart.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    productImage: item.product.images[0] ?? '',
    quantity: item.quantity,
    unitPrice: item.product.salePrice ?? item.product.price,
    size: item.selectedSize,
  }))
}

export async function createStoreOrder(payload: CheckoutOrderPayload): Promise<Order | null> {
  const addressParts = [
    payload.cep ? `CEP ${payload.cep}` : null,
    payload.city,
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
    if (!data?.ok || !data.order) return null
    return data.order as Order
  } catch {
    return null
  }
}

export async function fetchStoreOrders(): Promise<Order[]> {
  try {
    const res = await fetch(ORDERS_URL, {
      headers: { 'X-Verissimo-Token': WRITE_TOKEN },
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
  try {
    const res = await fetch(ORDERS_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Verissimo-Token': WRITE_TOKEN,
      },
      body: JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (!data?.ok || !data.order) return null
    return data.order as Order
  } catch {
    return null
  }
}
