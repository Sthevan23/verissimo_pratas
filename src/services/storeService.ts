import type { Product, Category } from '../types'
import { getDatabase } from './adminStore'
import { getStorefrontCatalog } from './catalogMemory'
import { categoryLabels, homeCategories as fallbackHomeCategories } from '../data/categories'
import { resolveProductSizes } from '../data/sizes'
import { normalizeProductImageUrl } from './remoteCatalog'

function sourceProducts() {
  return getStorefrontCatalog() ?? getDatabase().products
}

/** Bridge: vitrine lê memória (API) ou localStorage */
export function getStoreProducts(): Product[] {
  return sourceProducts()
    .filter((p) => p.status === 'active')
    .map(adminToStoreProduct)
}

export function getStoreProductBySlug(slug: string): Product | undefined {
  return getStoreProducts().find((p) => p.slug === slug)
}

export function getStoreProductsByCategory(category: string): Product[] {
  if (category === 'novidades') return getStoreProducts().filter((p) => p.isNew)
  if (category === 'promocoes') return getStoreProducts().filter((p) => p.isOnSale)
  return getStoreProducts().filter((p) => p.category === category)
}

export function getStoreFeaturedProducts(): Product[] {
  return getStoreProducts().filter((p) => p.isFeatured)
}

export function getStoreSaleProducts(): Product[] {
  return getStoreProducts().filter((p) => p.isOnSale)
}

export function getStoreRelatedProducts(product: Product, limit = 4): Product[] {
  return getStoreProducts()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit)
}

export function searchStoreProducts(query: string): Product[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return getStoreProducts().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.includes(q)
  )
}

export function getStoreCategories(): Category[] {
  const db = getDatabase()
  return db.categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      slug: c.slug as Category['slug'],
      name: c.name,
      image: publicImageUrl(c.image),
      description: c.description,
    }))
}

export function getHomeCategories(): Category[] {
  const fromDb = getDatabase()
    .categories.filter((c) => c.active && c.showOnHome !== false)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      slug: c.slug as Category['slug'],
      name: c.name,
      image: publicImageUrl(c.image),
      description: c.description,
    }))

  return fromDb.length > 0 ? fromDb : fallbackHomeCategories
}

export function getStoreSettings() {
  return getDatabase().settings
}

/** Fotos da home a partir dos IDs escolhidos no painel (ou fallback automático). */
export function getHomeShowcasePhotos(
  which: 'hero' | 'collection',
  limit: number
): { id: string; slug: string; name: string; src: string }[] {
  const settings = getStoreSettings()
  const ids =
    which === 'hero'
      ? settings.homeHeroProductIds ?? []
      : settings.homeCollectionProductIds ?? []

  const byId = new Map(getStoreProducts().map((p) => [p.id, p]))
  const fromSettings = ids
    .map((id) => byId.get(id))
    .filter((p): p is Product => Boolean(p?.images?.[0]))
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, src: p.images[0] }))

  if (fromSettings.length > 0) return fromSettings.slice(0, limit)

  const featured = getStoreFeaturedProducts()
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, src: p.images[0] }))
    .filter((p) => Boolean(p.src))

  if (featured.length >= (which === 'hero' ? 4 : 3)) {
    return featured.slice(0, limit)
  }

  const rest = getStoreProducts()
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, src: p.images[0] }))
    .filter((p) => Boolean(p.src) && !featured.some((f) => f.id === p.id))

  return [...featured, ...rest].slice(0, limit)
}

export function getStoreCategoryLabels(): Record<string, string> {
  const db = getDatabase()
  const labels: Record<string, string> = { ...categoryLabels }
  db.categories.forEach((c) => {
    labels[c.slug] = c.name
  })
  return labels
}

function adminToStoreProduct(p: import('../types/admin').AdminProduct): Product {
  const images = (Array.isArray(p.images) ? p.images : [])
    .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
    .map((img) => publicImageUrl(img.trim()))

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice,
    images,
    category: p.category,
    badge: p.badge,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: Number(p.stock) > 0,
    stock: p.stock,
    material: p.material,
    warranty: p.warranty,
    care: p.care,
    shippingDays: p.shippingDays,
    sizes: resolveProductSizes(p.category, p.sizes),
    options: p.options?.length ? p.options : undefined,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isOnSale: p.isOnSale,
  }
}

/** URL pública absoluta das fotos (evita path relativo quebrado) */
function publicImageUrl(url: string): string {
  if (!url) return url
  let next = url.trim()
  if (next.startsWith('/uploads/products/')) {
    const f = next.split('/').pop() || ''
    next = `/api/media.php?f=${encodeURIComponent(f)}`
  }
  next = normalizeProductImageUrl(next)
  if (next.startsWith('http://') || next.startsWith('https://') || next.startsWith('data:')) {
    return next
  }
  if (next.startsWith('/') && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${next}`
  }
  return next
}
