import type { CartItem } from '../types'
import { describeCartChoices } from './cart'
import { formatPrice } from './format'
import { STORE_COMMERCE } from '../data/commerce'
import { whatsappLink } from '../data/contact'

export function buildCheckoutMessage(params: {
  cart: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  couponCode?: string
}): string {
  const { cart, subtotal, discount, shipping, total, couponCode } = params
  const lines = cart.map((item, i) => {
    const price = item.product.salePrice ?? item.product.price
    const size = item.selectedSize ? ` | Tamanho: ${item.selectedSize}` : ''
    const choices = describeCartChoices(item.product, item.selectedChoices)
    const choiceLine = choices ? ` | ${choices}` : ''
    return `${i + 1}. ${item.product.name}${size}${choiceLine}\n   Qtd: ${item.quantity} × ${formatPrice(price)} = ${formatPrice(price * item.quantity)}`
  })

  const getsGift = subtotal >= STORE_COMMERCE.giftMin

  return [
    '*Pedido — Verissimo Pratas 925*',
    '',
    ...lines,
    '',
    `Subtotal: ${formatPrice(subtotal)}`,
    discount > 0
      ? `Desconto${couponCode ? ` (${couponCode})` : ''}: -${formatPrice(discount)}`
      : null,
    `Frete: ${shipping === 0 ? 'Grátis' : formatPrice(shipping)}`,
    getsGift ? `Brinde: ${STORE_COMMERCE.giftLabel}` : null,
    `*Total: ${formatPrice(total)}*`,
    '',
    'Olá! Gostaria de finalizar este pedido.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function openCheckoutWhatsApp(params: {
  cart: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  couponCode?: string
}) {
  const message = buildCheckoutMessage(params)
  window.open(whatsappLink(message), '_blank', 'noopener,noreferrer')
}
