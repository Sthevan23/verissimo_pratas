import type { CategorySlug } from '../types'

/** Tamanhos padrão de anéis (numeração BR) */
export const DEFAULT_RING_SIZES = [
  '12', '13', '14', '15', '16', '17', '18', '19', '20', '21',
  '22', '23', '24', '25', '26', '27', '28', '29', '30', '31',
]

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

/** Categorias que usam numeração de anel (12–31) */
const RING_SIZE_CATEGORIES = new Set<string>(['aneis', 'personalizados-aneis'])

export function categoryNeedsSize(category: string): boolean {
  return CATEGORIES_WITH_SIZE.includes(category as CategorySlug)
}

/** Garante lista de tamanhos para categorias que exigem seleção */
export function resolveProductSizes(
  category: string,
  sizes?: string[] | null
): string[] | undefined {
  if (sizes && sizes.length > 0) return sizes
  if (RING_SIZE_CATEGORIES.has(category)) return [...DEFAULT_RING_SIZES]
  if (categoryNeedsSize(category)) return [...DEFAULT_RING_SIZES].filter((s) => {
    const n = Number(s)
    return n >= 14 && n <= 22
  })
  return undefined
}
