import type { CategorySlug } from '../types'
import { categories } from '../data/categories'

/** Slugs válidos no catálogo (fonte única: data/categories.ts) */
export const STORE_CATEGORY_SLUGS = new Set<string>(
  categories.map((c) => c.slug)
)

/** URLs antigas / erradas → slug canônico da vitrine */
const LEGACY_CATEGORY_PARAM: Record<string, CategorySlug> = {
  'linha-masculina': 'masculinos',
  braceletes: 'pulseiras-braceletes',
}

/** Família → subcategorias incluídas em "Ver tudo" */
const FAMILY_MEMBERS: Record<string, readonly CategorySlug[]> = {
  brincos: ['brincos', 'brincos-duplas', 'brincos-trios'],
  pulseiras: ['pulseiras', 'pulseiras-braceletes', 'pulseiras-infantil'],
  berloques: ['berloques', 'berloques-pulseiras'],
  personalizados: [
    'personalizados',
    'personalizados-aneis',
    'personalizados-colares',
    'personalizados-pulseiras',
    'personalizados-berloques',
    'personalizados-chaveiros',
    'personalizados-pingentes',
  ],
  masculinos: [
    'masculinos',
    'masculinos-corrente',
    'masculinos-pulseira',
    'masculinos-pingente',
  ],
}

export function isStoreCategorySlug(slug: string): slug is CategorySlug {
  return STORE_CATEGORY_SLUGS.has(slug)
}

/** Normaliza ?categoria= da URL (sem mudar a intenção do clique) */
export function resolveStoreCategoryParam(raw: string | null | undefined): CategorySlug | null {
  if (raw == null) return null
  const trimmed = String(raw).trim().toLowerCase()
  if (!trimmed) return null
  const mapped = LEGACY_CATEGORY_PARAM[trimmed] ?? trimmed
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(mapped) ? (mapped as CategorySlug) : null
}

/** Link da vitrine — só o parâmetro categoria (limpa tamanho, busca, promo) */
export function storeCategoryUrl(slug: CategorySlug | string): string {
  const resolved = resolveStoreCategoryParam(slug) ?? String(slug).trim()
  const params = new URLSearchParams()
  params.set('categoria', resolved)
  return `/produtos?${params.toString()}`
}

export function normalizeStoredCategorySlug(raw: string): CategorySlug {
  const resolved = resolveStoreCategoryParam(raw)
  if (resolved) return resolved
  return String(raw).trim().toLowerCase() as CategorySlug
}

/** Produto pertence à categoria da URL? (slug do cadastro, sem “adivinhar” pelo nome) */
export function categorySlugMatchesFilter(
  productCategory: string,
  filterCategory: string
): boolean {
  const productCat = String(productCategory).trim().toLowerCase() as CategorySlug
  const filter = resolveStoreCategoryParam(filterCategory) ?? filterCategory

  if (filter === 'novidades') return false

  const family = FAMILY_MEMBERS[filter]
  if (family) {
    return (family as readonly string[]).includes(productCat)
  }

  if (filter === 'linha-masculina') {
    return FAMILY_MEMBERS.masculinos.includes(productCat)
  }

  return productCat === filter
}
