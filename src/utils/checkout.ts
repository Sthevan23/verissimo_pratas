import type { CartItem } from '../types'
import { describeCartChoices } from './cart'
import { formatPrice } from './format'
import { STORE_COMMERCE } from '../data/commerce'
import { whatsappLink } from '../data/contact'
import { formatCep } from '../services/shippingService'
import { createStoreOrder } from '../services/orderService'

export function buildCheckoutMessage(params: {
  cart: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  couponCode?: string
  cep?: string
  shippingLabel?: string
  city?: string
  orderNumber?: string
}): string {
  const {
    cart,
    subtotal,
    discount,
    shipping,
    total,
    couponCode,
    cep,
    shippingLabel,
    city,
    orderNumber,
  } = params
  const lines = cart.map((item, i) => {
    const price = item.product.salePrice ?? item.product.price
    const size = item.selectedSize ? ` | Tamanho: ${item.selectedSize}` : ''
    const choices = describeCartChoices(item.product, item.selectedChoices)
    const choiceLine = choices ? ` | ${choices}` : ''
    return `${i + 1}. ${item.product.name}${size}${choiceLine}\n   Qtd: ${item.quantity} × ${formatPrice(price)} = ${formatPrice(price * item.quantity)}`
  })

  const getsGift = subtotal >= STORE_COMMERCE.giftMin
  const freteLine = shippingLabel
    ? `Frete (${shippingLabel}): ${shipping === 0 ? 'Grátis' : formatPrice(shipping)}`
    : `Frete: ${shipping === 0 ? 'Grátis' : formatPrice(shipping)}`

  return [
    '*Pedido — Verissimo Pratas 925*',
    orderNumber ? `Nº ${orderNumber}` : null,
    '',
    ...lines,
    '',
    `Subtotal: ${formatPrice(subtotal)}`,
    discount > 0
      ? `Desconto${couponCode ? ` (${couponCode})` : ''}: -${formatPrice(discount)}`
      : null,
    cep ? `CEP: ${formatCep(cep)}${city ? ` (${city})` : ''}` : null,
    freteLine,
    getsGift ? `Brinde: ${STORE_COMMERCE.giftLabel}` : null,
    `*Total: ${formatPrice(total)}*`,
    '',
    'Olá! Gostaria de finalizar este pedido.',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function openCheckoutWhatsApp(params: {
  cart: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  couponCode?: string
  cep?: string
  shippingLabel?: string
  city?: string
}): Promise<{ orderNumber?: string }> {
  const order = await createStoreOrder(params)
  const message = buildCheckoutMessage({
    ...params,
    orderNumber: order?.orderNumber,
  })
  window.open(whatsappLink(message), '_blank', 'noopener,noreferrer')
  return { orderNumber: order?.orderNumber }
}
