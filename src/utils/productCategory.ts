import type { CategorySlug } from '../types'
import { categorySlugMatchesFilter } from './categoryNav'

export function isPersonalizadosCategory(category: string): boolean {
  return category === 'personalizados' || category.startsWith('personalizados-')
}

/** Preserve the administrator's category choice; never infer it from product copy. */
export function normalizeProductCategory(input: {
  category: string
  name?: string
  slug?: string
  description?: string
}): CategorySlug {
  return String(input.category ?? '').trim().toLowerCase() as CategorySlug
}

/** Match the stored category slug against a category page or its family page. */
export function matchesStoreCategoryFilter(
  product: { category: string; isNew?: boolean },
  category: string
): boolean {
  if (category === 'novidades') return Boolean(product.isNew)
  return categorySlugMatchesFilter(product.category, category)
}
