import type { CategorySlug } from '../types'

/** Tamanhos padrão de anéis (numeração BR) */
export const DEFAULT_RING_SIZES = ['14', '15', '16', '17', '18', '19', '20', '21', '22']

const CATEGORIES_WITH_SIZE: CategorySlug[] = [
  'aneis',
  'personalizados-aneis',
  'pulseiras',
  'pulseiras-braceletes',
  'pulseiras-infantil',
  'personalizados-pulseiras',
  'masculinos-pulseira',
  'tornozeleiras',
]

export function categoryNeedsSize(category: string): boolean {
  return CATEGORIES_WITH_SIZE.includes(category as CategorySlug)
}

/** Garante lista de tamanhos para categorias que exigem seleção */
export function resolveProductSizes(
  category: string,
  sizes?: string[] | null
): string[] | undefined {
  if (sizes && sizes.length > 0) return sizes
  if (categoryNeedsSize(category)) return [...DEFAULT_RING_SIZES]
  return undefined
}
