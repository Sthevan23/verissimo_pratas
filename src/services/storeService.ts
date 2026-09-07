import type { Product, Category } from '../types'
import { getDatabase } from './adminStore'
import { categoryLabels, homeCategories as fallbackHomeCategories } from '../data/categories'
import { resolveProductSizes } from '../data/sizes'
import { normalizeProductImageUrl } from './remoteCatalog'

/** Bridge: storefront reads from admin store (localStorage) when available */
export function getStoreProducts(): Product[] {
  const db = getDatabase()
  return db.products
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
      image: normalizeProductImageUrl(c.image),
      description: c.description,
    }))
}

/** Grid "Nossas categorias" na página inicial — editável no painel */
export function getHomeCategories(): Category[] {
  const fromDb = getDatabase()
    .categories.filter((c) => c.active && c.showOnHome !== false)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      slug: c.slug as Category['slug'],
      name: c.name,
      image: normalizeProductImageUrl(c.image),
      description: c.description,
    }))

  return fromDb.length > 0 ? fromDb : fallbackHomeCategories
}

export function getStoreSettings() {
  return getDatabase().settings
}

export function getStoreCategoryLabels(): Record<string, string> {
  const db = getDatabase()
  const labels: Record<string, string> = { ...categoryLabels }
  db.categories.forEach((c) => { labels[c.slug] = c.name })
  return labels
}

function adminToStoreProduct(p: import('../types/admin').AdminProduct): Product {
  const images = (Array.isArray(p.images) ? p.images : [])
    .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
    .map((img) => {
      const trimmed = img.trim()
      if (trimmed.startsWith('/uploads/products/')) {
        const f = trimmed.split('/').pop() || ''
        return bustMediaCache(`/api/media.php?f=${encodeURIComponent(f)}`)
      }
      if (trimmed.includes('/api/media.php')) {
        return bustMediaCache(trimmed)
      }
      return trimmed
    })

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

/** Quebra cache CDN/Hostinger de fotos quebradas */
function bustMediaCache(url: string): string {
  try {
    const u = new URL(url, 'https://verissimopratas.com.br')
    if (!u.pathname.includes('media.php')) return url
    u.searchParams.set('v', '20260907b')
    return `${u.pathname}?${u.searchParams.toString()}`
  } catch {
    return url
  }
}
