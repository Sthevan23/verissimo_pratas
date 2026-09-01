import type { CartItem, Product } from '../types'

export type CartLineSelection = {
  size?: string
  choices?: Record<string, string>
}

/** Normaliza o 3º argumento legado (string = tamanho) */
export function normalizeCartLineSelection(
  line?: string | CartLineSelection
): CartLineSelection {
  if (typeof line === 'string') return { size: line }
  return line ?? {}
}

export function choicesKey(choices?: Record<string, string>): string {
  if (!choices || !Object.keys(choices).length) return ''
  const sorted = Object.keys(choices)
    .sort()
    .map((k) => `${k}=${choices[k]}`)
    .join('|')
  return sorted
}

export function cartLineKey(
  productId: string,
  size?: string,
  choices?: Record<string, string>
): string {
  return `${productId}::${size ?? ''}::${choicesKey(choices)}`
}

export function sameCartLine(
  a: Pick<CartItem, 'product' | 'selectedSize' | 'selectedChoices'>,
  b: { productId: string; size?: string; choices?: Record<string, string> }
): boolean {
  return (
    a.product.id === b.productId &&
    (a.selectedSize ?? '') === (b.size ?? '') &&
    choicesKey(a.selectedChoices) === choicesKey(b.choices)
  )
}

export function formatCartChoices(choices?: Record<string, string>): string {
  if (!choices) return ''
  return Object.values(choices).filter(Boolean).join(' · ')
}

export function describeCartChoices(
  product: Product,
  choices?: Record<string, string>
): string {
  if (!choices || !Object.keys(choices).length) return ''
  if (product.options?.length) {
    return product.options
      .map((opt) => (choices[opt.id] ? `${opt.label}: ${choices[opt.id]}` : null))
      .filter(Boolean)
      .join(' · ')
  }
  return formatCartChoices(choices)
}

export function productRequiresSelection(product: {
  sizes?: string[]
  options?: { values: string[] }[]
}): boolean {
  const hasSizes = Boolean(product.sizes?.length)
  const hasOptions = Boolean(product.options?.some((o) => o.values.length > 0))
  return hasSizes || hasOptions
}
