import type { CartItem } from '../types'
import { describeCartChoices } from './cart'
import { formatPrice } from './format'
import { STORE_COMMERCE } from '../data/commerce'
import { whatsappLink } from '../data/contact'
import { formatCep } from '../services/shippingService'
import { createStoreOrder } from '../services/orderService'

export type CheckoutParams = {
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
  orderNumber?: string
}

const DIVIDER = '────────────'

export function buildCheckoutMessage(params: CheckoutParams): string {
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
    street,
    streetNumber,
    neighborhood,
    orderNumber,
  } = params

  const itemBlocks = cart.map((item, i) => {
    const price = item.product.salePrice ?? item.product.price
    const code = (item.product.sku || item.product.id).trim()
    const detailLines = [
      `${i + 1}) *${item.product.name}*`,
      `   Código: ${code}`,
      item.selectedSize ? `   Tamanho: ${item.selectedSize}` : null,
      (() => {
        const choices = describeCartChoices(item.product, item.selectedChoices)
        return choices ? `   Opções: ${choices}` : null
      })(),
      `   Qtd: ${item.quantity} × ${formatPrice(price)} = *${formatPrice(price * item.quantity)}*`,
    ]
    return detailLines.filter(Boolean).join('\n')
  })

  const getsGift = subtotal >= STORE_COMMERCE.giftMin

  const freteLabel = shippingLabel
    ? shippingLabel.replace(/^Verissimo\s*[—–-]\s*/i, '').trim()
    : 'Frete'
  const freteLine =
    shipping === 0
      ? `Frete (${freteLabel}): *Grátis*`
      : `Frete (${freteLabel}): ${formatPrice(shipping)}`

  const addressLine = [
    street
      ? `${street}${streetNumber ? `, nº ${streetNumber}` : ''}`
      : streetNumber
        ? `nº ${streetNumber}`
        : null,
    neighborhood,
    city,
  ]
    .filter(Boolean)
    .join(' — ')

  return [
    '*Pedido — Verissimo Pratas 925*',
    orderNumber ? `Nº *${orderNumber}*` : null,
    DIVIDER,
    '*Itens do pedido*',
    '',
    itemBlocks.join('\n\n'),
    '',
    DIVIDER,
    '*Resumo*',
    `Subtotal: ${formatPrice(subtotal)}`,
    discount > 0
      ? `Desconto${couponCode ? ` (${couponCode})` : ''}: -${formatPrice(discount)}`
      : null,
    freteLine,
    getsGift ? `Brinde: ${STORE_COMMERCE.giftLabel}` : null,
    `*Total: ${formatPrice(total)}*`,
    addressLine || cep ? DIVIDER : null,
    addressLine || cep ? '*Entrega*' : null,
    addressLine ? `Endereço: ${addressLine}` : null,
    cep ? `CEP: ${formatCep(cep)}` : null,
    DIVIDER,
    'Olá! Gostaria de finalizar este pedido ✨',
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n')
}

export async function openCheckoutWhatsApp(
  params: Omit<CheckoutParams, 'orderNumber'>
): Promise<{ orderNumber?: string; error?: string }> {
  const { order, error } = await createStoreOrder(params)
  if (!order) {
    return { error: error || 'Não foi possível registrar o pedido.' }
  }
  const message = buildCheckoutMessage({
    ...params,
    orderNumber: order.orderNumber,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
  })
  window.open(whatsappLink(message), '_blank', 'noopener,noreferrer')
  return { orderNumber: order.orderNumber }
}
