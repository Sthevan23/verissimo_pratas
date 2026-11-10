import type { ProductOrder } from '../types/admin'

export const PRODUCT_ORDER_OPTIONS: { value: ProductOrder; label: string }[] = [
  { value: 'categoria', label: 'Por categoria (cada categoria em sequência)' },
  { value: 'nome', label: 'Por nome (A a Z)' },
  { value: 'preco_menor', label: 'Por preço (menor primeiro)' },
  { value: 'preco_maior', label: 'Por preço (maior primeiro)' },
]

type Sortable = { name: string; category: string; price: number; salePrice?: number }

/** Ordena produtos pelo modo escolhido no painel. Padrão: por categoria. */
export function sortByProductOrder<T extends Sortable>(
  items: T[],
  mode: ProductOrder | undefined,
  categoryRank: Map<string, number>
): T[] {
  const rank = (category: string) => categoryRank.get(category) ?? Number.MAX_SAFE_INTEGER
  const priceOf = (p: T) => p.salePrice ?? p.price
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, 'pt-BR')

  const comparators: Record<ProductOrder, (a: T, b: T) => number> = {
    categoria: (a, b) => rank(String(a.category)) - rank(String(b.category)) || byName(a, b),
    nome: byName,
    preco_menor: (a, b) => priceOf(a) - priceOf(b) || byName(a, b),
    preco_maior: (a, b) => priceOf(b) - priceOf(a) || byName(a, b),
  }
  return [...items].sort(comparators[mode ?? 'categoria'])
}
