import type { Product, Category } from '../types'
import type { AdminProduct } from '../types/admin'
import { getDatabase } from './adminStore'
import { getStorefrontCatalog } from './catalogMemory'
import { categoryLabels, homeCategories as fallbackHomeCategories } from '../data/categories'
import { resolveProductSizes } from '../data/sizes'
import { normalizeProductImageUrl } from './remoteCatalog'
import { isLegacyForeignImage, localCategoryImage } from '../utils/legacyImages'
import { matchesStoreCategoryFilter } from '../utils/productCategory'

function sourceProducts() {
  return getStorefrontCatalog() ?? getDatabase().products
}

/** Ativo e com estoque — esgotados ficam só no painel admin. */
export function isPublishedOnStorefront(p: AdminProduct): boolean {
  return p.status === 'active' && Number(p.stock) > 0
}

/** Bridge: vitrine lê memória (API) ou localStorage */
export function getStoreProducts(): Product[] {
  return sourceProducts()
    .filter(isPublishedOnStorefront)
    .map(adminToStoreProduct)
}

/** Resolve produto por id (preferido) ou slug. Id evita abrir outro item com slug repetido. */
export function getStoreProductBySlug(ref: string): Product | undefined {
  const key = decodeURIComponent(ref || '').trim()
  if (!key) return undefined

  const onStore = sourceProducts().filter(isPublishedOnStorefront)
  const byId = onStore.find((p) => p.id === key)
  if (byId) return adminToStoreProduct(byId)

  const bySlug = onStore.filter((p) => p.slug === key)
  if (bySlug.length === 1) return adminToStoreProduct(bySlug[0])
  if (bySlug.length > 1) {
    const preferred = [...bySlug].sort((a, b) =>
      String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))
    )[0]
    return adminToStoreProduct(preferred)
  }
  return undefined
}

export function getStoreProductsByCategory(category: string): Product[] {
  if (category === 'promocoes') return getStoreProducts().filter((p) => p.isOnSale)
  return getStoreProducts().filter((p) => matchesStoreCategoryFilter(p, category))
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
    .map((c) => {
      const image = isLegacyForeignImage(c.image)
        ? localCategoryImage(String(c.slug))
        : c.image || localCategoryImage(String(c.slug))
      return {
        slug: c.slug as Category['slug'],
        name: c.name,
        image: publicImageUrl(image),
        description: c.description,
      }
    })
}

export function getHomeCategories(): Category[] {
  const fromDb = getDatabase()
    .categories.filter((c) => c.active && c.showOnHome !== false)
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const image = isLegacyForeignImage(c.image)
        ? localCategoryImage(String(c.slug))
        : c.image || localCategoryImage(String(c.slug))
      return {
        slug: c.slug as Category['slug'],
        name: c.name,
        image: publicImageUrl(image),
        description: c.description,
      }
    })

  return fromDb.length > 0 ? fromDb : fallbackHomeCategories
}

export function getStoreSettings() {
  return getDatabase().settings
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
    .filter((img) => !isLegacyForeignImage(img))
    .map((img) => publicImageUrl(img.trim()))

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku || undefined,
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
